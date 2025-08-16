// routes/createSurvey.js

const express    = require('express');
const axios      = require('axios');
const { google } = require('googleapis');
const Groq       = require('groq-sdk');
const router     = express.Router();

const groq = new Groq(process.env.GROQ_API_KEY);

// OAuth2 client for user consent
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  `${process.env.BASE_URL || 'https://validly-final-render.onrender.com'}/survey/oauth2callback`
);
const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * GET /survey/status
 * Checks/refreshes tokens in session. 200 if valid, 401 if not.
 */
router.get('/status', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) {
    return res.status(401).json({ authenticated: false });
  }

  oauth2Client.setCredentials(tokens);
  try {
    await oauth2Client.getAccessToken();        // triggers refresh if expired
    req.session.tokens = oauth2Client.credentials;
    return res.json({ authenticated: true });
  } catch (err) {
    console.error('Token refresh failed:', err);
    delete req.session.tokens;
    return res.status(401).json({ authenticated: false });
  }
});

/**
 * GET /survey/auth
 * Opens Google’s consent screen in a popup.
 */
router.get('/auth', (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  res.redirect(url);
});

/**
 * GET /survey/oauth2callback
 * Handles Google's redirect with ?code=…
 * Exchanges code for tokens, stores them, then closes popup.
 */
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;

    // Notify opener and close popup
    res.send(`
      <html><body>
        <script>
          window.opener.postMessage({ surveyAuth: true }, '*');
          window.close();
        </script>
        <p>Authentication successful. You can close this window.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('OAuth2 callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

/**
 * POST /survey
 * 1) Fetch dynamic survey JSON from your LLM
 * 2) Create the Form
 * 3) Batch-update with the LLM’s requests array
 * 4) Set permissions
 * 5) Return a “force-copy” link
 */
router.post('/', async (req, res) => {
  const tokens = req.session.tokens;
  console.log(req.body.input);
  if (!tokens) {
    return res
      .status(401)
      .json({ error: 'Not authenticated; please start with /survey/auth' });
  }

  oauth2Client.setCredentials(tokens);
  const forms = google.forms({ version: 'v1', auth: oauth2Client });

  try {
    // 1) Ask LLM for properly structured JSON
    const fetchQuestions = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: 'system',
          content: `
You are an AI designed to help founders validate startup ideas. Based on the user's idea, generate a single JSON object compatible with the Google Forms API.

Your output must include:

form_title (string)

form_description (string, optional)

requests (array of exactly five createItem requests, per Forms v1 batchUpdate spec)

Each survey question must:

Be explicitly grounded in the provided startup idea (no generic or reusable prompts)

Yield actionable insights for product refinement or market scoping

Be concise, clear, and formatted as Google Forms JSON

Use a mix of:

Open-ended questions (via "textQuestion") for deep insight

Choice-based questions (via "choiceQuestion" with type "RADIO" or "CHECKBOX") for quantitative feedback

Strictly output only the final JSON object. No explanations or commentary.

Example request format:
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
          `
        },
        {
          role: 'user',
          content: JSON.stringify({ idea: req.body.input || "" })
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
                            title:        { type: "string" },
                            questionItem: {
                              type: "object",
                              properties: {
                                question: {
                                  type: "object",
                                  properties: {
                                    textQuestion: {
                                      type: "object",
                                      properties: {
                                        paragraph: { type: "boolean" }
                                      }
                                    },
                                    scaleQuestion: {
                                      type: "object",
                                      properties: {
                                        low:  { type: "integer" },
                                        high: { type: "integer" }
                                      },
                                      required: ["low","high"]
                                    },
                                    choiceQuestion: {
                                      type: "object",
                                      properties: {
                                        options: {
                                          type: "array",
                                          items: {
                                            type: "object",
                                            properties: {
                                              value: { type: "string" }
                                            },
                                            required: ["value"]
                                          }
                                        },
                                        type: {
                                          type: "string",
                                          enum: ["RADIO","CHECKBOX"]
                                        }
                                      },
                                      required: ["options","type"]
                                    }
                                  },
                                  // require at least one question type
                                  required: ["choiceQuestion"]
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

    // 2) Parse LLM response
    const surveyDef = JSON.parse(fetchQuestions.choices[0].message.content);
    const { form_title, form_description, requests } = surveyDef;

    // 3) Create form
    const createRes = await forms.forms.create({
      requestBody: {
        info: {
          title: form_title
        }
      }
    });
    const formId = createRes.data.formId;

    requests.push({
    updateFormInfo: {
      info: {
        description: form_description, // Replace with your desired description
      },
      updateMask: "description", // This tells the API to only update the description field
    },
  });

    // 4) Batch-update using exactly the LLM’s requests
    await forms.forms.batchUpdate({
      formId,    
      requestBody: { requests }
    });



    // 5) Make it publicly readable
    await axios.post(
      `https://www.googleapis.com/drive/v3/files/${formId}/permissions`,
      { role: 'reader', type: 'anyone' },
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    // 6) Return the copy link
    res.json({ copyUrl: `https://docs.google.com/forms/d/${formId}/` });
  } catch (err) {
    console.error('Survey creation error:', err.response?.data || err);
    res.status(500).json({ error: 'Survey generation failed' });
  }
});

module.exports = router;
