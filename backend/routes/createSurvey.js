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

// Clean up expired tokens every 10 minutes
setInterval(() => {
  if (global.tempTokens) {
    const now = Date.now();
    for (const [token, data] of global.tempTokens.entries()) {
      if (data.expiry < now) {
        global.tempTokens.delete(token);
      }
    }
  }
}, 10 * 60 * 1000); // 10 minutes

// Helper function to get tokens from session or temp token
const getTokens = (req) => {
  // First try session tokens
  if (req.session.tokens) {
    return req.session.tokens;
  }
  
  // Then try temp token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tempToken = authHeader.substring(7);
    const tokenData = global.tempTokens?.get(tempToken);
    
    if (tokenData && tokenData.expiry > Date.now()) {
      // Clean up expired tokens
      global.tempTokens.delete(tempToken);
      return tokenData.tokens;
    }
    
    // Clean up expired token
    if (tokenData) {
      global.tempTokens.delete(tempToken);
    }
  }
  
  return null;
};

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
 * GET /survey/token
 * Returns a temporary token for cross-origin requests
 */
router.get('/token', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Create a temporary token that expires in 5 minutes
  const tempToken = require('crypto').randomBytes(32).toString('hex');
  const tokenExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
  
  // Store in memory (in production, use Redis or similar)
  if (!global.tempTokens) global.tempTokens = new Map();
  global.tempTokens.set(tempToken, {
    tokens,
    expiry: tokenExpiry
  });

  res.json({ token: tempToken, expiresIn: 300 });
});

/**
 * GET /survey/test-token
 * Test endpoint to verify token system is working
 */
router.get('/test-token', async (req, res) => {
  const tokens = getTokens(req);
  if (tokens) {
    res.json({ authenticated: true, method: 'token' });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

/**
 * GET /survey/debug
 * Debug endpoint to check session and headers
 */
router.get('/debug', (req, res) => {
  res.json({
    session: req.session,
    hasTokens: !!req.session.tokens,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie ? 'present' : 'missing',
      authorization: req.headers.authorization ? 'present' : 'missing'
    },
    tempTokensCount: global.tempTokens ? global.tempTokens.size : 0
  });
});

/**
 * GET /survey/test
 * Simple test endpoint that works with both session and token auth
 */
router.get('/test', (req, res) => {
  const tokens = getTokens(req);
  if (tokens) {
    res.json({ 
      authenticated: true, 
      method: req.session.tokens ? 'session' : 'token',
      hasAccessToken: !!tokens.access_token
    });
  } else {
    res.status(401).json({ authenticated: false });
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
    
    // Store tokens in session AND create a temporary token
    req.session.tokens = tokens;
    
    // Create a temporary token that expires in 10 minutes
    const tempToken = require('crypto').randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Store in memory
    if (!global.tempTokens) global.tempTokens = new Map();
    global.tempTokens.set(tempToken, {
      tokens,
      expiry: tokenExpiry
    });

    // Notify opener with the token and close popup
    res.send(`
      <html><body>
        <script>
          window.opener.postMessage({ 
            surveyAuth: true, 
            token: '${tempToken}' 
          }, '*');
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
  const tokens = getTokens(req);
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
