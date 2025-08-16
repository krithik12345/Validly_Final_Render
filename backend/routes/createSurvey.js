// routes/createSurvey.js

const express    = require('express');
const axios      = require('axios');
const { google } = require('googleapis');
const Groq       = require('groq-sdk');

const router = express.Router();

const groq = new Groq(process.env.GROQ_API_KEY);

// OAuth2 client for user-consent
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  `${process.env.BASE_URL || 'http://localhost:5000'}/survey/oauth2callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * GET /survey/auth
 * Opens Google’s consent flow in the popup.
 * We pass the caller-provided `state` through to Google so it returns to us.
 * `state` will include the user's survey `input` (base64-encoded JSON).
 */
router.get('/auth', (req, res) => {
  const state = req.query.state || ''; // pass-through
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state
  });
  res.redirect(url);
});

/**
 * Utility: decode base64-encoded, URI-encoded JSON safely
 */
function decodeStateJSON(state) {
  try {
    // state was encoded as: btoa(encodeURIComponent(JSON.stringify(obj)))
    const decoded = Buffer.from(state, 'base64').toString('utf8');
    const jsonStr = decodeURIComponent(decoded);
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

/**
 * GET /survey/oauth2callback
 * Handles Google's redirect (?code, ?state), exchanges tokens, then
 * immediately CREATES the survey on the server (first-party cookie),
 * and posts the result back to the opener. No cross-site cookie needed.
 */
router.get('/oauth2callback', async (req, res) => {
  const code  = req.query.code;
  const state = req.query.state || '';

  if (!code) return res.status(400).send('Missing code parameter');

  // Recover the input payload from state
  const { input = '' } = decodeStateJSON(state);

  try {
    // 1) Exchange code → tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2) Build Forms client
    const forms = google.forms({ version: 'v1', auth: oauth2Client });

    // 3) Ask LLM for a properly structured survey JSON (matches Forms API)
    const fetchQuestions = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: 'system',
          content: `
You generate survey definitions for the Google Forms API.
Output a single JSON object with:
  • form_title       (string)
  • form_description (string, optional)
  • requests         (array of createItem requests)

Each element in "requests" must exactly match the Forms v1 batchUpdate spec.
For multiple-choice questions, use "choiceQuestion" with type "RADIO" or "CHECKBOX", e.g.:

{
  "createItem": {
    "item": {
      "title": "Your question?",
      "questionItem": {
        "question": {
          "choiceQuestion": {
            "options": [
              { "value": "Option A" },
              { "value": "Option B" }
            ],
            "type": "CHECKBOX"
          }
        }
      }
    },
    "location": { "index": 0 }
  }
}

Output ONLY the JSON—no commentary.
          `
        },
        {
          role: 'user',
          content: JSON.stringify({ idea: input || "" })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "survey",
          schema: {
            type: "object",
            properties: {
              form_title:       { type: "string" },
              form_description: { type: "string" },
              requests: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    createItem: {
                      type: "object",
                      properties: {
                        item: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            questionItem: {
                              type: "object",
                              properties: {
                                question: {
                                  type: "object",
                                  properties: {
                                    textQuestion: {
                                      type: "object",
                                      properties: { paragraph: { type: "boolean" } }
                                    },
                                    scaleQuestion: {
                                      type: "object",
                                      properties: { low: { type: "integer" }, high: { type: "integer" } },
                                      required: ["low","high"]
                                    },
                                    choiceQuestion: {
                                      type: "object",
                                      properties: {
                                        options: {
                                          type: "array",
                                          items: {
                                            type: "object",
                                            properties: { value: { type: "string" } },
                                            required: ["value"]
                                          }
                                        },
                                        type: {
                                          type: "string",
                                          enum: ["RADIO","CHECKBOX"] // <-- correct enums
                                        }
                                      },
                                      required: ["options","type"]
                                    }
                                  }
                                }
                              },
                              required: ["question"]
                            }
                          },
                          required: ["title","questionItem"]
                        },
                        location: {
                          type: "object",
                          properties: { index: { type: "integer" } },
                          required: ["index"]
                        }
                      },
                      required: ["item","location"]
                    }
                  },
                  required: ["createItem"]
                }
              }
            },
            required: ["form_title","requests"]
          }
        }
      }
    });

    const surveyDef = JSON.parse(fetchQuestions.choices[0].message.content);
    const { form_title, form_description, requests } = surveyDef;

    // 4) Create Form
    const createRes = await forms.forms.create({
      requestBody: {
        info: {
          title: form_title || 'Idea-Validation Survey (Template)',
          ...(form_description ? { description: form_description } : {})
        }
      }
    });
    const formId = createRes.data.formId;

    // 5) BatchUpdate with LLM-generated requests
    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests }
    });

    // 6) Make it viewable by anyone
    await axios.post(
      `https://www.googleapis.com/drive/v3/files/${formId}/permissions`,
      { role: 'reader', type: 'anyone' },
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const copyUrl = `https://docs.google.com/forms/d/${formId}/copy`;

    // 7) Post the result back to the opener and close
    res.send(`
      <html><body>
        <script>
          try {
            window.opener && window.opener.postMessage({ surveyDone: true, copyUrl: ${JSON.stringify(copyUrl)} }, '*');
          } catch (e) {}
          window.close();
        </script>
        <p>Survey created. You can close this window.</p>
        <a href="${copyUrl}" target="_blank" rel="noopener">Open form copy link</a>
      </body></html>
    `);
  } catch (err) {
    console.error('OAuth2 callback/survey error:', err.response?.data || err);
    // Signal error to opener as well
    res.status(500).send(`
      <html><body>
        <script>
          try {
            window.opener && window.opener.postMessage({ surveyDone: false, error: 'Survey generation failed' }, '*');
          } catch (e) {}
          window.close();
        </script>
        <p>Survey generation failed. You can close this window.</p>
      </body></html>
    `);
  }
});

module.exports = router;
