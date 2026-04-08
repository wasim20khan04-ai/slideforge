
import { GoogleGenAI, Type } from "@google/genai";
import { ThemeId, THEMES } from '../types';

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface ThemeSuggestionResponse {
    suggestedThemeId: string;
    reasoning: string;
}

export const suggestTheme = async (title: string, description: string): Promise<{ themeId: ThemeId; reasoning: string } | null> => {
  if (!apiKey) {
    console.warn("API Key not found. Mocking response.");
    // Fallback mock if no API key is present for dev (or throw error)
    return { themeId: 'cyber-future', reasoning: 'Mock: Tech fits professional content.' };
  }

  try {
    const validThemeIds = THEMES.map(t => t.id).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze the following slide content and choose the most visually appropriate theme from the list: [${validThemeIds}].
        
        Title: "${title}"
        Description: "${description}"

        Return the ID of the best theme.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                suggestedThemeId: { type: Type.STRING, enum: THEMES.map(t => t.id) },
                reasoning: { type: Type.STRING }
            },
            required: ["suggestedThemeId", "reasoning"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const data = JSON.parse(jsonText) as ThemeSuggestionResponse;
    return {
        themeId: data.suggestedThemeId as ThemeId,
        reasoning: data.reasoning
    };

  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return null;
  }
};
