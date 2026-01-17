
import { GoogleGenAI, Type } from "@google/genai";
import { Match, AIInsight } from "../types";

export const getDeepMatchAnalysis = async (match: Match): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a deep tactical analysis for this real-world sports match:
      Match: ${match.homeTeam} vs ${match.awayTeam} (${match.league})
      Sport: ${match.sport}
      
      Provide a detailed JSON response including:
      1. H2H (Head to Head) - last 5 matches outcome
      2. Win Probability (%) for Home, Draw, Away
      3. Key Players to watch
      4. Tactical Setup/Form analysis
      5. Predicted Correct Score`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            h2h: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            winProbability: {
              type: Type.OBJECT,
              properties: {
                home: { type: Type.NUMBER },
                draw: { type: Type.NUMBER },
                away: { type: Type.NUMBER }
              }
            },
            keyPlayers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tacticalAnalysis: { type: Type.STRING },
            predictedScore: { type: Type.STRING }
          },
          required: ["h2h", "winProbability", "keyPlayers", "tacticalAnalysis", "predictedScore"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return null;
  }
};

export const fetchRealWorldMatches = async (sport: string, league?: string): Promise<{ matches: Match[], sources: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const now = new Date().toLocaleTimeString();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Today is ${today}, current time is ${now}. 
      Search Google for ACTUAL, REAL-WORLD ${sport} matches ${league ? `in the ${league} league` : 'globally'} scheduled or live for TODAY and TOMORROW.
      
      CRITICAL RULES:
      1. ONLY return real matches that are actually happening. Do not invent matches.
      2. Status must be 'Live' if they are currently playing according to Google Search, otherwise 'Upcoming'.
      3. Provide realistic live odds from current market averages.
      4. For Live matches, include the actual real-time score.
      5. Include a short 'commentary' about the current state of the match or team news.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sport: { type: Type.STRING },
              league: { type: Type.STRING },
              homeTeam: { type: Type.STRING },
              awayTeam: { type: Type.STRING },
              startTime: { type: Type.STRING },
              status: { type: Type.STRING },
              score: {
                type: Type.OBJECT,
                properties: {
                  home: { type: Type.NUMBER },
                  away: { type: Type.NUMBER },
                  homeWickets: { type: Type.NUMBER },
                  awayWickets: { type: Type.NUMBER },
                  homeOvers: { type: Type.STRING },
                  awayOvers: { type: Type.STRING }
                }
              },
              odds: {
                type: Type.OBJECT,
                properties: {
                  home: { type: Type.NUMBER },
                  draw: { type: Type.NUMBER },
                  away: { type: Type.NUMBER }
                }
              },
              commentary: { type: Type.STRING }
            },
            required: ["id", "sport", "homeTeam", "awayTeam", "status", "odds", "league", "startTime"]
          }
        }
      }
    });

    let cleanedText = response.text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const matches = JSON.parse(cleanedText);
    const validatedMatches = (matches as any[]).map(m => ({
      ...m,
      status: (m.status === 'Live' || m.status === 'Upcoming') ? m.status : 'Upcoming',
      isNew: Math.random() > 0.8
    }));

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { matches: validatedMatches, sources };
  } catch (error) {
    console.error("Grounding Fetch Error:", error);
    return { matches: [], sources: [] };
  }
};
