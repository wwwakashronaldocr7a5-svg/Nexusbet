
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
    const leagueQuery = league ? `specifically in the ${league} tournament` : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for real-world ${sport} matches happening right now (Live) AND matches scheduled for later today or tomorrow (Upcoming) ${leagueQuery}. 
      
      RULES:
      1. YOU MUST provide at least 4 'Upcoming' matches and 4 'Live' matches if available.
      2. For the 'status' field, you MUST ONLY use the strings 'Live' or 'Upcoming'. NEVER use 'Scheduled' or 'Postponed'.
      3. For 'id', generate a unique string like 'real-soccer-123'.
      4. Keep 'commentary' extremely short (max 10 words).
      5. Return ONLY the JSON array. Do not include markdown formatting or extra text.`,
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
              status: { type: Type.STRING, description: "Must be 'Live' or 'Upcoming'" },
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

    // Clean response text to ensure it's valid JSON
    let cleanedText = response.text.trim();
    // Remove potential markdown code blocks if the model ignored the mimeType hint
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const matches = JSON.parse(cleanedText);
    
    // Safety check: ensure status matches the type system exactly
    const validatedMatches = (matches as any[]).map(m => ({
      ...m,
      status: (m.status === 'Live' || m.status === 'Upcoming') ? m.status : 'Upcoming'
    }));

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { matches: validatedMatches, sources };
  } catch (error) {
    console.error("Grounding Fetch Error Detail:", error);
    return { matches: [], sources: [] };
  }
};
