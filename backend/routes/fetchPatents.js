require('dotenv').config();
const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const Groq = require('groq-sdk');
const PATENTS_API_KEY = process.env.PATENTS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq(GROQ_API_KEY);

router.post('/', async (req, res) => {
  console.log('[fetchPatents] incoming companyName:', req.body.companyName);
  console.log('[fetchPatents] incoming input:', req.body.input);

  const companyName  = req.body.companyName;
  if (!companyName) {
    console.warn('[fetchPatents] missing companyName!');
    console.log(req.body.companyName);
    return res.status(400).json({ error: 'Missing companyName in request body' });
  }

  try {
    // Call the PatentView API 
    const response = await axios.get(
      'https://search.patentsview.org/api/v1/patent/',
      {
        headers: { 'X-Api-Key': PATENTS_API_KEY },
        params: {
          q: JSON.stringify({ 
            '_text_phrase': { 
              'assignees.assignee_organization': companyName 
            } 
          }),
          f: JSON.stringify([ 'patent_id','patent_title','patent_abstract','patent_type' ]),
          o: JSON.stringify({ page: 1, per_page: 20 })
        }
      }
    );

    const fetchPatentSummary = async (response) => {
      console.log('Patent fetch called');
      const response2 = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
         {
            role: 'system',
            content: `
            Use the user's idea (description, keywords, target industry, and/or company) to filter for relevance first. Only discuss patents that clearly relate to the user's idea, use case, technology stack, adjacent workflows, or industry context. DO NOT DISCUSS patents that are off-scope even if they match the organization name.

            Ideat: ${req.body.input}

          If no patents were found, say: "Sorry, no relevant patents could be fetched from USPTO for the given organization."

          If patents are found, explain the patents and summarize them clearly.

          As you summarize, highlight common themes across the patents — such as shared technologies, use cases, or industry applications. Then point out any unique or standout features worth mentioning.

          For every insight, generalization, or claim you make, include the corresponding patent ID in parentheses — for example: (US1234567B1). Speak naturally and in the first person, as if you're explaining this to the user. Avoid robotic or AI-like language such as "the provided patents" or "according to the data." and personal pronouns ("I see" or "you see").
          
          `
        },

          {
            role: 'user',
            content: JSON.stringify(response.data)
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "response",
            schema: {
              type: 'object',
              patent_ids: {
                type: 'array',
                items: { type: 'number'},
              },
              patent_ip_strength_rating: {
                type:'number',
                description: 'An objective assessment of how strong the organizations IP is. Assess based on strength/quality of patents, number of patents, and also defensability of patents. Rating is on a scale of 1-10.'
              },
              overall_patent_summary: {
                type: 'string',
              }
            }
          }
        }
      })

      return response2;
    }

    const response2 = await fetchPatentSummary(response);
    
    const result = JSON.parse(response2.choices[0].message.content || "{}");

    console.log(result);

    res.json(result);

  } catch (err) {
    // Log the full error (including any response body from the API)
    console.error('[fetchPatents] error calling PatentView:', 
      err.response2?.status, err.response2?.data || err.message
    );
    // Return the API’s error payload if there is one
    return res
      .status(500)
      .json({ error: err.response2?.data || err.message });
  }

});

module.exports = router;
