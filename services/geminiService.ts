
import { GoogleGenAI, Type } from "@google/genai";
import { Match, AIInsight } from "../types";

export const getMatchInsight = async (match: Match): Promise<AIInsight | null> => {
  try {
    // Fix: Always instantiate GoogleGenAI inside the function for the latest API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Using gemini-3-pro-preview for complex reasoning task (sports match analysis).
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

    // Fix: Access response.text property directly.
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
