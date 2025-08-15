const express = require('express');
const { LinkupClient } = require('linkup-sdk');
const { GoogleGenAI, Type } = require('@google/genai');
const Groq = require('groq-sdk');
const router = express.Router();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const linkup = new LinkupClient({
  apiKey: process.env.LINKUP_API_KEY
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const mockPath = path.join(__dirname, '..', 'testcases', 'mockLinkupResponse.json');
const loadMock = () => JSON.parse(fs.readFileSync(mockPath, 'utf-8'));

// Gemini structured output schemas
const geminiPitchSchema = {
  type: Type.OBJECT,
  properties: {
    pitch: {
      type: Type.STRING,
      description: "A compelling five-sentence pitch that follows these guidelines: 1. Hook: Start with a compelling statement that grabs attention 2. Value: Clearly state the core value proposition 3. Evidence: Support with market data and validation 4. Differentiator: Explain how it stands out from competitors 5. Call to Action: End with a clear next step or invitation"
    }
  },
  propertyOrdering: ["pitch"]
};

const geminiRevenueModelsSchema = {
  type: Type.OBJECT,
  properties: {
    revenueModels: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "A concise description of how the startup could generate revenue"
      },
      description: "3-5 potential revenue models that would be viable for this business"
    }
  },
  propertyOrdering: ["revenueModels"]
};

const geminiMVPSchema = {
  type: Type.OBJECT,
  properties: {
    mvpDesign: {
      type: Type.STRING,
      description: "A comprehensive, detailed description of the MVP's overall design and approach. This should be a substantial paragraph (150-250 words) that thoroughly explains the strategic vision, technical approach, user experience design, and competitive positioning of the MVP. Include specific details about how the MVP will be built, what makes it unique, and how it addresses the identified market needs."
    },
    mvpFeatures: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          feature: {
            type: Type.STRING,
            description: "A specific, descriptive name for the MVP feature"
          },
          differentiationFactor: {
            type: Type.STRING,
            description: "How this feature differs from competitor offerings"
          },
          uniqueImplementation: {
            type: Type.STRING,
            description: "Specific technical or business approach that sets it apart"
          },
          priority: {
            type: Type.STRING,
            description: "Priority of the feature (High, Medium, or Low) based on differentiation impact"
          },
          effort: {
            type: Type.STRING,
            description: "Estimated effort to implement the feature (High, Medium, or Low) based on technical complexity"
          },
          competitiveAdvantage: {
            type: Type.STRING,
            description: "Why this feature creates a competitive moat"
          }
        },
        propertyOrdering: ["feature", "differentiationFactor", "uniqueImplementation", "priority", "effort", "competitiveAdvantage"]
      },
      description: "5-8 highly differentiated features that together create a unique product experience"
    }
  },
  propertyOrdering: ["mvpDesign", "mvpFeatures"]
};

// Founder fit (Gemini) structured output schema
const geminiFounderFitSchema = {
  type: Type.OBJECT,
  properties: {
    founderfit: {
      type: Type.STRING,
      description: "Direct, second-person feedback about the user's fit for the idea. Concise, specific, and constructive."
    },
    founderfitscore: {
      type: Type.NUMBER,
      description: "Strict evidence-based score from 1 to 10 for the user's fit to the proposed business or product."
    },
    positivefounderfit: {
      type: Type.ARRAY,
      description: "Three skills/experiences/attributes the founder possesses that are advantageous.",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "Advantageous founder skill/experience/attribute." },
          description: { type: Type.STRING, description: "Short explanation why this helps in this market/business." }
        },
        propertyOrdering: ["skill", "description"]
      }
    },
    negativefounderfit: {
      type: Type.ARRAY,
      description: "Three missing skills/experiences/attributes the founder lacks that are necessary.",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "Missing founder skill/experience/attribute." },
          description: { type: Type.STRING, description: "Short explanation of relevance and impact of the gap." }
        },
        propertyOrdering: ["skill", "description"]
      }
    }
  },
  propertyOrdering: ["founderfit", "founderfitscore", "positivefounderfit", "negativefounderfit"]
};

// Gemini prompts for specific sections
const getGeminiPitchPrompt = (startupIdea, marketAnalysis, userProfile = null) => {
  let context = '';
  if (userProfile) {
    context = `\n\nFounder Context:
- Background: ${userProfile.background || 'Not specified'}
- Technical Skills: ${userProfile.technicalSkills || 'Not specified'}
- Previous Experience: ${userProfile.previousExperience || 'Not specified'}
- Industry: ${userProfile.industry || 'Not specified'}
- Stage: ${userProfile.stage || 'Not specified'}`;
  }

  return `Based on the following startup idea and market analysis, create a compelling five-sentence pitch that follows these guidelines:

1. Hook: Start with a compelling statement that grabs attention
2. Value: Clearly state the core value proposition
3. Evidence: Support with market data and validation
4. Differentiator: Explain how it stands out from competitors
5. Call to Action: End with a clear next step or invitation

Startup Idea: ${startupIdea}

Market Analysis Context:
- Market Demand Score: ${marketAnalysis.score || 'N/A'}/10
- Market Summary: ${marketAnalysis.summary || 'N/A'}
- Primary Pain Point: ${marketAnalysis.marketDemand?.painPoints?.primaryPainPoint || 'N/A'}
- Market Readiness: ${marketAnalysis.marketDemand?.timingTrends?.marketReadiness || 'N/A'}${context}

Create a professional, investor-ready pitch that incorporates the market insights and founder context.`;
};

const getGeminiRevenueModelsPrompt = (startupIdea, marketAnalysis, userProfile = null) => {
  let context = '';
  if (userProfile) {
    context = `\n\nFounder Context:
- Industry: ${userProfile.industry || 'Not specified'}
- Stage: ${userProfile.stage || 'Not specified'}
- Team Size: ${userProfile.teamSize || 'Not specified'}
- Funding: ${userProfile.funding || 'Not specified'}`;
  }

  return `Based on the following startup idea and market analysis, suggest 3-5 potential revenue models that would be viable for this business.

Startup Idea: ${startupIdea}

Market Analysis:
- Target Audience: ${marketAnalysis.targetAudience?.map(aud => aud.group).join(', ') || 'Not specified'}
- Market Demand Score: ${marketAnalysis.score || 'N/A'}/10
- Industry Context: ${marketAnalysis.marketDemand?.timingTrends?.emergingTrends || 'N/A'}${context}

Provide specific, actionable revenue model suggestions that align with the market opportunity and business model. Each suggestion should be a concise description of how the startup could generate revenue.`;
};

const getGeminiMVPFeaturesPrompt = (startupIdea, marketAnalysis, userProfile = null) => {
  let context = '';
  if (userProfile) {
    context = `\n\nFounder Context:
- Technical Skills: ${userProfile.technicalSkills || 'Not specified'}
- Tech Stack: ${userProfile.techStack || 'Not specified'}
- Team Size: ${userProfile.teamSize || 'Not specified'}
- Stage: ${userProfile.stage || 'Not specified'}`;
  }

  return `Based on the following startup idea and market analysis, design a highly differentiated MVP (Minimum Viable Product) that stands out from competitors.

Startup Idea: ${startupIdea}

Market Analysis:
- Primary Pain Point: ${marketAnalysis.marketDemand?.painPoints?.primaryPainPoint || 'N/A'}
- Target Audience: ${marketAnalysis.targetAudience?.map(aud => aud.group).join(', ') || 'Not specified'}
- Market Demand Score: ${marketAnalysis.score || 'N/A'}/10${context}

Your task is to design an MVP that is NOT just another copy of existing solutions. Focus on:

1. **Unique Value Proposition**: What makes this MVP fundamentally different from what's already in the market?
2. **Competitive Moats**: What features or approaches create defensible advantages?
3. **Innovation Angles**: How can you solve the problem in a way competitors haven't considered?

**IMPORTANT**: For the MVP Design section, provide a comprehensive, detailed description (150-250 words) that thoroughly explains:
- The strategic vision and approach
- Technical architecture and implementation strategy
- User experience design principles
- Competitive positioning and differentiation
- How the MVP addresses identified market needs
- Development timeline and milestones

For each feature, specify:
- **Feature Name**: Be specific and descriptive
- **Differentiation Factor**: How this feature differs from competitor offerings
- **Unique Implementation**: Specific technical or business approach that sets it apart
- **Priority**: High/Medium/Low based on differentiation impact
- **Implementation Effort**: High/Medium/Low based on technical complexity
- **Competitive Advantage**: Why this feature creates a moat

Provide 5-8 highly differentiated features that together create a unique product experience. Avoid generic features that could apply to any startup in the space. Each feature should have a clear competitive differentiation story.`;
};


const getGeminiFounderFitPrompt = (startupIdea, marketAnalysis, userProfile = null) => {
  let context = '';
  if (userProfile) {
    const locationString = userProfile.location
      ? [userProfile.location.city, userProfile.location.state, userProfile.location.country].filter(Boolean).join(', ')
      : 'Not specified';
    context = `\n\nFounder Profile:\n- Name: ${userProfile.firstName || 'N/A'} ${userProfile.lastName || ''}\n- Location: ${locationString}\n- Background: ${userProfile.background || 'Not specified'}\n- Technical Skills: ${userProfile.technicalSkills || 'Not specified'}\n- Previous Experience: ${userProfile.previousExperience || 'Not specified'}\n- Industry: ${userProfile.industry || 'Not specified'}\n- Customer Type: ${userProfile.customerType || 'Not specified'}\n- Stage: ${userProfile.stage || 'Not specified'}\n- Team Size: ${userProfile.teamSize || 'Not specified'}\n- Tech Stack: ${userProfile.techStack || 'Not specified'}\n- Funding: ${userProfile.funding || 'Not specified'}`;
  }

  return `Evaluate the founder fit for the following startup idea using the market analysis insight and the founder's profile. Return structured JSON only with the fields specified.\n\nStartup Idea: ${startupIdea}\n\nMarket Analysis Context (use strictly for evidence and relevance):\n- Primary Pain Point: ${marketAnalysis.marketDemand?.painPoints?.primaryPainPoint || 'N/A'}\n- Timing & Trends: ${marketAnalysis.marketDemand?.timingTrends?.emergingTrends || 'N/A'}\n- Target Audience: ${Array.isArray(marketAnalysis.targetAudience) ? marketAnalysis.targetAudience.map(a => a.group).join(', ') : 'Not specified'}\n- Market Demand Score: ${marketAnalysis.score || 'N/A'}/10${context}\n\nInstructions:\n- Write 'founderfit' as direct, second-person feedback. Be specific and actionable.\n- Set 'founderfitscore' from 1-10 based only on demonstrated evidence in the profile; do not be optimistic.\n- Provide exactly three items for both 'positivefounderfit' and 'negativefounderfit'.\n- Do not invent details beyond the provided profile; if unknown, focus feedback on what's missing.\n- Keep each description concise (1-2 sentences).`;
};


const getLinkupPrompt = (message, userProfile = null) => {

  let personalizedContext = '';
  if (userProfile) {
    const {
      firstName,
      lastName,
      location,
      background,
      technicalSkills,
      previousExperience,
      startupName,
      startupDescription,
      industry,
      customerType,
      stage,
      teamSize,
      techStack,
      funding
    } = userProfile;

    const locationString = location ? [location.city, location.state, location.country]
      .filter(Boolean)
      .join(', ') : 'Not specified';
    
    personalizedContext = `

Here is my personal and startup background. Use this information to find results for maximum relevance and specificity.

- Name: ${firstName || 'N/A'} ${lastName || ''}
- Location: ${locationString}
- Background/Field of Study: ${background || 'N/A'}
- Technical Skills: ${technicalSkills || 'N/A'}
- Previous Startup Experience: ${previousExperience || 'N/A'}
- Startup Name: ${startupName || 'N/A'}
- Description: ${startupDescription || 'N/A'}
- Target Industry: ${industry || 'N/A'}
- Target Customer: ${customerType || 'N/A'}
- Current Stage: ${stage || 'N/A'}
- Team Size: ${teamSize || 'N/A'}
- Tech Stack/AI Models: ${techStack || 'N/A'}
- Funding Raised: ${funding || 'N/A'}

Please place heavy emphasis and consider this rich context when finding results for analyzing my startup idea. Consider local
market conditions, my demonstrated skills, competitive landscape within my idea's industry, and the feasibility of
my idea given their current stage and team size. Avoid having redundant information across multiple description fields.`;
  }

  return ` Based on important market factors, how valid is my startup idea? Here's my startup idea: ${message}${personalizedContext}.
`;
};

// Function to rephrase user prompt for better LinkUp search results
const rephrasePromptForLinkUp = async (originalPrompt, userProfile = null) => {
  try {
    let contextPrompt = '';
    if (userProfile) {
      const {
        firstName,
        lastName,
        location,
        background,
        technicalSkills,
        previousExperience,
        startupName,
        startupDescription,
        industry,
        customerType,
        stage,
        teamSize,
        techStack,
        funding
      } = userProfile;

      const locationString = location ? [location.city, location.state, location.country]
        .filter(Boolean)
        .join(', ') : 'Not specified';
      
      contextPrompt = `

Founder Context (use this to make the search more relevant):
- Name: ${firstName || 'N/A'} ${lastName || ''}
- Location: ${locationString}
- Background: ${background || 'N/A'}
- Technical Skills: ${technicalSkills || 'N/A'}
- Previous Experience: ${previousExperience || 'N/A'}
- Startup Name: ${startupName || 'N/A'}
- Industry: ${industry || 'N/A'}
- Target Customer: ${customerType || 'N/A'}
- Stage: ${stage || 'N/A'}
- Team Size: ${teamSize || 'N/A'}
- Tech Stack: ${techStack || 'N/A'}
- Funding: ${funding || 'N/A'}`;
    }

    const rephrasePrompt = `You are an expert at rephrasing startup ideas into detailed, search-engine-optimized queries for market research. 

Your task is to take a user's startup idea and rephrase it into a strictly concise, comprehensive, detailed question that would be perfect for searching the web to find:
- Market demand and validation
- Competitor analysis  
- Industry trends and timing
- Target audience insights
- Pain points and opportunities

IMPORTANT RULES:
1. DO NOT add any new details or assumptions about the startup idea
2. DO NOT invent features, markets, or business models not mentioned by the user
3. ONLY expand on what the user has explicitly stated if a certain aspect is unclear
4. Make the query more specific and detailed for better search results
5. Format as a comprehensive research question
6. Include relevant industry terms and market research keywords
7. Consider the founder's background and context if provided

Original startup idea: "${originalPrompt}"${contextPrompt}

Rephrase this into a strictly concise, detailed, search-engine-optimized query for market/competitor research:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert market research query formulator. You help rephrase startup ideas into detailed, searchable questions without adding new information."
        },
        {
          role: "user", 
          content: rephrasePrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 500,
    });

    const rephrasedQuery = completion.choices[0]?.message?.content?.trim();
    
    if (!rephrasedQuery) {
      console.warn('Groq returned empty response, using original prompt');
      return originalPrompt;
    }

    console.log('Original prompt:', originalPrompt);
    console.log('Rephrased query:', rephrasedQuery);
    
    return rephrasedQuery;
  } catch (error) {
    console.error('Error rephrasing prompt with Groq:', error);
    console.log('Falling back to original prompt');
    return originalPrompt;
  }
};

const linkupOutputSchema = {
  type: "object",
  properties: {
      title: { type: "string", description: "A short, descriptive title for the startup idea." },
      overview: { type: "string", description: "A concise, one-paragraph summary of the entire analysis, covering the idea's potential, market, and key challenges." },
      score: { type: "number", description: "An extremely strict and realistic score from 1-10 for the idea's market demand and feasibility." },
      feasibilityscore: { type: "number", description: "An extremely strict and realistic score from 1-10 for the idea's market competitveness. With 10 being most competitive." },
      summary: { type: "string", description: "A multi-source supported summary of the market demand." },
      details: { type: "string", description: "AN extremely detailed analysis of the market demand." },
      marketDemand: {
          type: "object",
          properties: {
              painPoints: {
                  type: "object",
                  properties: {
                      primaryPainPoint: { type: "string", description: "The most critical pain point the startup is solving. Based on research" },
                      urgency: { type: "string", description: "How urgent is this problem for the target audience." },
                      evidence: { type: "string", description: "Evidence supporting the existence and urgency of the pain point." }
                  },
                  required: ["primaryPainPoint", "urgency", "evidence"]
              },
              timingTrends: {
                  type: "object",
                  properties: {
                      marketReadiness: { type: "string", description: "Is the market ready for this solution?" },
                      emergingTrends: { type: "string", description: "What emerging trends support this idea?" },
                      timingAssessment: { type: "string", description: "Overall assessment of the market timing." }
                  },
                  required: ["marketReadiness", "emergingTrends", "timingAssessment"]
              }
          },
          required: ["painPoints", "timingTrends"]
      },
      competitors: {
          type: "array",
          description: "A list of ten competitors that are similar to the user's startup idea any aspect. Rank them by popularity, market share, and other relevant metrics.",
          items: {
              type: "object",
              properties: {
                  name: { type: "string", description: "Name of the competitor." },
                  description: { type: "string", description: "Description of the competitor's business." },
                  popularity: { type: "string", enum: ["High", "Medium", "Low"], description: "Popularity of the competitor." },
                  locations: { type: "string", description: "Geographic locations where the competitor operates." },
                  pricing: { type: "string", description: "The competitor's pricing model." },
                  pros: { type: "array", items: { type: "string" }, description: "Strengths of the competitor." },
                  weaknesses: { type: "array", items: { type: "string" }, description: "Weaknesses of the competitor." },
                  competitiveness: { type: "number", description: "How competitive the competitor is in their market. With 10 being most competitive." }
              },
              required: ["name", "description", "popularity", "locations", "pricing", "pros", "weaknesses"]
          }
      },
      targetAudience: {
          type: "array",
          description: "A list of five target audience groups that the startup is targeting. For each group, provide a list of online communities/destinations that are speicfically relevant to the target audience.",
          items: {
              type: "object",
              properties: {
                  group: { type: "string", description: "A specific target audience group." },
                  onlineDestinations: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              name: { type: "string", description: "Name of the online community/destination." },
                              type: { type: "string", enum: ["Reddit", "Discord", "Forum", "Facebook Group", "Other"], description: "Type of the online community." },
                              url: { type: "string", description: "URL to the online community." },
                              description: { type: "string", description: "Description of why this is a good place to find the target audience." }
                          },
                          required: ["name", "type", "url", "description"]
                      }
                  }
              },
              required: ["group", "onlineDestinations"]
          }
      },
      // Note: pitch, revenueModels, mvpDesign, and mvpFeatures will be generated by Gemini
      personalizedstatus: { type: "boolean", default: false, description: "Whether or not founder fit/user profile was given." },
  },
  required: ["title", "overview", "score", "summary", "details", "marketDemand", "competitors", "targetAudience", "personalizedstatus"]
};

const linkupOutputPersonalizedSchema = {
  type: "object",
  properties: {
      title: { type: "string", description: "A short, catchy, descriptive title for the startup idea." },
      overview: { type: "string", description: "A concise, one-paragraph summary of the entire analysis, covering the idea's potential, market, and key challenges." },
      score: { type: "number", description: "An extremely strict and realistic score from 1-10 for the idea's market demand and feasibility." },
      feasibilityscore: { type: "number", description: "An extremely strict and realistic score from 1-10 for the idea's market competitveness. With 10 being most competitive." },
      summary: { type: "string", description: "A multi-source supported summary of the market demand." },
      details: { type: "string", description: "AN extremely detailed analysis of the market demand." },
      marketDemand: {
          type: "object",
          properties: {
              painPoints: {
                  type: "object",
                  properties: {
                      primaryPainPoint: { type: "string", description: "The most critical pain point the startup is solving." },
                      urgency: { type: "string", description: "How urgent is this problem for the target audience." },
                      evidence: { type: "string", description: "Evidence supporting the existence and urgency of the pain point." }
                  },
                  required: ["primaryPainPoint", "urgency", "evidence"]
              },
              timingTrends: {
                  type: "object",
                  properties: {
                      marketReadiness: { type: "string", description: "Is the market ready for this solution?" },
                      emergingTrends: { type: "string", description: "What emerging trends support this idea?" },
                      timingAssessment: { type: "string", description: "Overall assessment of the market timing." }
                  },
                  required: ["marketReadiness", "emergingTrends", "timingAssessment"]
              }
          },
          required: ["painPoints", "timingTrends"]
      },
      competitors: {
          type: "array",
          description: "A list of five to twenty reasonable competitors that are similar to the user's startup idea. They can be specific and niche. Rank them by popularity, market share, and other relevant metrics.",
          items: {
              type: "object",
              properties: {
                  name: { type: "string", description: "Name of the competitor." },
                  description: { type: "string", description: "Description of the competitor's business." },
                  popularity: { type: "string", enum: ["High", "Medium", "Low"], description: "Popularity of the competitor." },
                  locations: { type: "string", description: "Geographic locations where the competitor operates." },
                  pricing: { type: "string", description: "The competitor's pricing model." },
                  pros: { type: "array", items: { type: "string" }, description: "Strengths of the competitor." },
                  weaknesses: { type: "array", items: { type: "string" }, description: "Weaknesses of the competitor." },
                  competitiveness: { type: "number", description: "How competitive the competitor is in their market. With 10 being most competitive." }
              },
              required: ["name", "description", "popularity", "locations", "pricing", "pros", "weaknesses"]
          }
      },
      targetAudience: {
          type: "array",
          description: "A list of five target audience groups that the startup is targeting. For each group, provide a list of online communities/destinations that are relevant to the target audience.",
          items: {
              type: "object",
              properties: {
                  group: { type: "string", description: "A specific target audience group." },
                  onlineDestinations: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              name: { type: "string", description: "Name of the online community/destination." },
                              type: { type: "string", enum: ["Reddit", "Discord", "Forum", "Facebook Group", "Other"], description: "Type of the online community." },
                              url: { type: "string", description: "URL to the online community." },
                              description: { type: "string", description: "Description of why this is a good place to find the target audience." }
                          },
                          required: ["name", "type", "url", "description"]
                      }
                  }
              },
              required: ["group", "onlineDestinations"]
          }
      },
      // Note: pitch, revenueModels, mvpDesign, and mvpFeatures will be generated by Gemini
      personalizedstatus: { type: "boolean", default: true, description: "Whether or not founder fit/user profile was given." },
  },
  required: ["title", "overview", "score", "summary", "details", "marketDemand", "competitors", "targetAudience", "personalizedstatus"]
};

router.post('/chat', async (req, res) => {
  if (process.env.USE_LINKUP_MOCK === 'true') {
        console.log('Serving mockLinkupResponse.json (USE_LINKUP_MOCK=true)');
        const mockResponse = loadMock();
        
        // Rephrase the user's prompt for consistency (even in mock mode)
        console.log('Original user message (mock mode):', req.body.message);
        const rephrasedQuery = await rephrasePromptForLinkUp(req.body.message, req.body.userProfile);
        console.log('Rephrased query for LinkUp (mock mode):', rephrasedQuery);
        
        // Generate Gemini content for mock response
        try {
          
          // Generate pitch with structured output
          const pitchPrompt = getGeminiPitchPrompt(req.body.message, mockResponse, req.body.userProfile);
          const pitchResult = await gemini.models.generateContent({
            model: "gemini-1.5-flash",
            contents: pitchPrompt,
            config: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
              responseSchema: geminiPitchSchema
            }
          });
          const pitchData = JSON.parse(pitchResult.text);
          
          // Generate revenue models with structured output
          const revenuePrompt = getGeminiRevenueModelsPrompt(req.body.message, mockResponse, req.body.userProfile);
          const revenueResult = await gemini.models.generateContent({
            model: "gemini-1.5-flash",
            contents: revenuePrompt,
            config: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
              responseSchema: geminiRevenueModelsSchema
            }
          });
          const revenueData = JSON.parse(revenueResult.text);
          
          // Generate MVP features with structured output
          const mvpPrompt = getGeminiMVPFeaturesPrompt(req.body.message, mockResponse, req.body.userProfile);
          const mvpResult = await gemini.models.generateContent({
            model: "gemini-1.5-flash-8b",
            contents: mvpPrompt,
            config: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
              responseSchema: geminiMVPSchema
            }
          });
          const mvpData = JSON.parse(mvpResult.text);

          // Generate Founder Fit (only if personalized)
          let founderFitData = null;
          if (req.body.personalized) {
            const founderFitPrompt = getGeminiFounderFitPrompt(req.body.message, mockResponse, req.body.userProfile);
            const founderFitResult = await gemini.models.generateContent({
              model: "gemini-1.5-flash",
              contents: founderFitPrompt,
              config: {
                temperature: 0.5,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
                responseSchema: geminiFounderFitSchema
              }
            });
            founderFitData = JSON.parse(founderFitResult.text);
          }
          
                     // Combine all responses
           const combinedResponse = {
             ...mockResponse,
             pitch: pitchData.pitch,
             revenueModels: revenueData.revenueModels,
             mvpDesign: mvpData.mvpDesign,
             mvpFeatures: mvpData.mvpFeatures,
             ...(founderFitData ? {
               founderfit: founderFitData.founderfit,
               founderfitscore: founderFitData.founderfitscore,
               positivefounderfit: founderFitData.positivefounderfit,
               negativefounderfit: founderFitData.negativefounderfit
             } : {})
           };
          
          return res.json({reply: combinedResponse});
        } catch (error) {
          console.error('API Error:', error);
          // Return mock response without additional content if APIs fail
          return res.json({reply: mockResponse});
        }
  }

  const { message, model, personalized, userProfile } = req.body;

  let mode;
  if (model === 'Quick Search') {
    mode = 'standard';
  } else {
    mode = 'deep';
  }

    try {
    // Rephrase the user's prompt for better LinkUp search results
    console.log('Original user message:', message);
    const rephrasedQuery = await rephrasePromptForLinkUp(message, userProfile);
    console.log('Rephrased query for LinkUp:', rephrasedQuery);
    
    // Get market analysis from Linkup
    let linkupResponse;
    if (personalized) {
      linkupResponse = await linkup.search({
        query: getLinkupPrompt(rephrasedQuery, userProfile),
        depth: mode,
        outputType: "structured",
        structuredOutputSchema: linkupOutputPersonalizedSchema,
        includeImages: false,
        fromDate: new Date("2016-01-01T00:00:00-06:00"),
        toDate: new Date("2025-06-21T23:59:59-05:00")
      });
    } else {
      linkupResponse = await linkup.search({
        query: getLinkupPrompt(rephrasedQuery, personalized ? userProfile : null),
        depth: mode,
        outputType: "structured",
        structuredOutputSchema: linkupOutputSchema,
        includeImages: false,
        fromDate: new Date("2016-01-01T00:00:00-06:00"),
        toDate: new Date("2025-06-21T23:59:59-05:00")
      });
    }

    console.log('Linkup raw response:', linkupResponse);

    // Generate Gemini content with structured output
    
    // Generate pitch with structured output
    const pitchPrompt = getGeminiPitchPrompt(message, linkupResponse, userProfile);
    const pitchResult = await gemini.models.generateContent({
      model: "gemini-1.5-flash",
      contents: pitchPrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: geminiPitchSchema
      }
    });
    const pitchData = JSON.parse(pitchResult.text);
    
    // Generate revenue models with structured output
    const revenuePrompt = getGeminiRevenueModelsPrompt(message, linkupResponse, userProfile);
    const revenueResult = await gemini.models.generateContent({
      model: "gemini-1.5-flash",
      contents: revenuePrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: geminiRevenueModelsSchema
      }
    });
    const revenueData = JSON.parse(revenueResult.text);
    
    // Generate MVP features with structured output
    const mvpPrompt = getGeminiMVPFeaturesPrompt(message, linkupResponse, userProfile);
    const mvpResult = await gemini.models.generateContent({
      model: "gemini-1.5-flash",
      contents: mvpPrompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: geminiMVPSchema
      }
    });
    const mvpData = JSON.parse(mvpResult.text);

    // Generate Founder Fit (only if personalized)
    let founderFitData = null;
    if (personalized) {
      const founderFitPrompt = getGeminiFounderFitPrompt(message, linkupResponse, userProfile);
      const founderFitResult = await gemini.models.generateContent({
        model: "gemini-1.5-flash",
        contents: founderFitPrompt,
        config: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: geminiFounderFitSchema
        }
      });
      founderFitData = JSON.parse(founderFitResult.text);
    }
    
         // Combine all responses
     const combinedResponse = {
       ...linkupResponse,
       pitch: pitchData.pitch,
       revenueModels: revenueData.revenueModels,
       mvpDesign: mvpData.mvpDesign,
       mvpFeatures: mvpData.mvpFeatures,
       ...(founderFitData ? {
         founderfit: founderFitData.founderfit,
         founderfitscore: founderFitData.founderfitscore,
         positivefounderfit: founderFitData.positivefounderfit,
         negativefounderfit: founderFitData.negativefounderfit
       } : {})
     };
    
    res.json({ reply: combinedResponse });

  } catch (error) {
    console.error('API call failed:', error);
    
    const fallbackError = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      code: error?.code || 'NO_CODE',
      status: error?.status || 500,
      response: error?.response || null
    };
    
    console.error('API Error Details:', fallbackError);
    res.status(500).send('Error communicating with APIs: ' + fallbackError.message);
  }
});

module.exports = router;