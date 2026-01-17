
import { GoogleGenAI, Type } from "@google/genai";
import { Match, AIInsight } from "../types";

export const getMatchInsight = async (match: Match): Promise<AIInsight | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this sports match and provide a betting insight.
      Sport: ${match.sport}
      League: ${match.league}
      Home Team: ${match.homeTeam}
      Away Team: ${match.awayTeam}
      Current Odds: Home(${match.odds.home}), Draw(${match.odds.draw || 'N/A'}), Away(${match.odds.away})
      Current Status: ${match.status} ${match.score ? `(Score: ${match.score.home}-${match.score.away})` : ''}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING, description: "Short prediction text" },
            confidence: { type: Type.NUMBER, description: "Confidence level 0-100" },
            reasoning: { type: Type.STRING, description: "Detailed reasoning" }
          },
          required: ["prediction", "confidence", "reasoning"]
        }
      }
    });

    const jsonStr = response.text.trim();
    const data = JSON.parse(jsonStr);
    return {
      matchId: match.id,
      ...data
    };
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

export const fetchRealWorldMatches = async (sport: string, league?: string): Promise<{ matches: Match[], sources: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const leagueQuery = league ? `specifically in the ${league} tournament` : 'across all major global leagues';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for real-world ${sport} matches ${leagueQuery}. 
      Return a HIGH DENSITY list of at least 8 matches:
      - 4 'Live' matches (happening now)
      - 4 'Upcoming' matches (happening today/tomorrow)
      
      RULES:
      1. Use 'status' as exactly 'Live' or 'Upcoming'.
      2. For 'id', use unique strings.
      3. For 'odds', provide realistic betting market numbers (e.g. 1.85, 3.40, 4.20).
      4. For 'score', if 'Live', provide the current real-world score.
      5. Include a short 'commentary' snippet for each.`,
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
              commentary: { type: Type.STRING },
              minute: { type: Type.NUMBER }
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
      isNew: Math.random() > 0.7 // Randomly flag some as 'Top Events'
    }));

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { matches: validatedMatches, sources };
  } catch (error) {
    console.error("Grounding Fetch Error:", error);
    return { matches: [], sources: [] };
  }
};
