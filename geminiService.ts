
import { GoogleGenAI, Type } from "@google/genai";
import { HeritageContent, Language } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const GeminiService = {
  async getStructuredContent(placeName: string, wikiSummary: string, lang: Language): Promise<HeritageContent> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transform this Wikipedia summary of ${placeName} into a structured cultural heritage report in ${lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi'}. 
      Summary: ${wikiSummary}
      
      Requirements:
      1. Overview & historical significance
      2. Architecture & sculptures (focus on Andhra styles like Dravidian, Chalukyan)
      3. Monuments & temples
      4. Local traditions & festivals
      5. Food & cuisine of the region
      6. Art, crafts & dance forms
      7. Language & literature
      8. Agriculture & local produce
      9. Clothing & lifestyle
      10. Famous Poets: List at least 2 famous poets associated with this place or Andhra Pradesh history, their period, language, contribution, and one famous verse/poem.

      If information is unavailable, use the phrase "Information not clearly documented".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            architecture: { type: Type.STRING },
            monuments: { type: Type.STRING },
            traditions: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            artCrafts: { type: Type.STRING },
            literature: { type: Type.STRING },
            agriculture: { type: Type.STRING },
            lifestyle: { type: Type.STRING },
            poets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  period: { type: Type.STRING },
                  language: { type: Type.STRING },
                  contribution: { type: Type.STRING },
                  famousVerse: { type: Type.STRING },
                  source: { type: Type.STRING }
                },
                required: ["name", "period", "language", "contribution", "famousVerse", "source"]
              }
            }
          },
          required: ["overview", "architecture", "monuments", "traditions", "cuisine", "artCrafts", "literature", "agriculture", "lifestyle", "poets"]
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw e;
    }
  },

  async reconstructMonument(imageDataBase64: string, context: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: imageDataBase64.split(',')[1], mimeType: "image/jpeg" } },
          { text: `Reconstruct this damaged monument or sculpture from ${context}. Restore missing features, carvings, and original architectural grandeur in high detail. Maintain historical accuracy for Andhra Pradesh heritage.` }
        ]
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return imageUrl;
  },

  async chat(message: string, history: { role: 'user' | 'model', text: string }[], lang: Language) {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are ITIHAASA AI, an expert on Andhra Pradesh's cultural heritage. 
        Answer queries about history, architecture, poets, and traditions of Andhra Pradesh. 
        Always respond in the user's selected language: ${lang}. 
        Keep responses educational and respectful.`
      }
    });

    // Simple chat session management (not full history in this snippet for brevity, but could be added)
    const result = await chat.sendMessage({ message });
    return result.text;
  }
};
