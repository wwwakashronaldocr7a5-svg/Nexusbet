
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
    console.error("Gemini Error:", error);
    return null;
  }
};

export const fetchRealWorldMatches = async (sport: string, league?: string): Promise<{ matches: Match[], sources: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const leagueQuery = league ? `specifically in the ${league} tournament` : '';
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for current live and upcoming ${sport} matches today ${leagueQuery}. 
      Include tournaments like LaLiga, Serie A, Premier League if it's Soccer.
      Include IPL if it's Cricket.
      Provide a list of up to 8 matches with current scores, teams, and status. 
      Return only JSON format matching the app's Match interface.`,
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
            required: ["id", "sport", "homeTeam", "awayTeam", "status", "odds"]
          }
        }
      }
    });

    const matches = JSON.parse(response.text.trim());
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { matches, sources };
  } catch (error) {
    console.error("Grounding Fetch Error:", error);
    return { matches: [], sources: [] };
  }
};
