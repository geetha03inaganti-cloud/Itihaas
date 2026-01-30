
import { GoogleGenAI, Type } from "@google/genai";
import { HeritageContent, Language } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const GeminiService = {
  async getStructuredContent(placeName: string, wikiSummary: string, lang: Language): Promise<HeritageContent> {
    const targetLang = lang === 'en' ? 'English' : lang === 'te' ? 'Telugu (తెలుగు)' : 'Hindi (हिंदी)';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a world-class cultural historian and translator. 
      Transform this Wikipedia summary of ${placeName} into a highly detailed, structured cultural heritage report.
      
      CRITICAL REQUIREMENT: The entire response content (all text values) MUST be written in ${targetLang}. 
      Do not use English words unless they are specific technical architectural terms that have no equivalent in ${targetLang}.
      
      Summary for reference: ${wikiSummary}
      
      Structure requirements (all descriptions must be in ${targetLang}):
      1. Overview: Historical significance and founding.
      2. Architecture: Specific styles (e.g., Vijayanagara, Dravidian, Buddhist) and stone-work details.
      3. Monuments: Key structures and shrines.
      4. Traditions: Local festivals, rituals, and folklore.
      5. Cuisine: Regional food specialties.
      6. Art & Crafts: Local paintings, weaves, or dance forms.
      7. Literature: Historical inscriptions or literary mentions.
      8. Agriculture: Regional crops and geography.
      9. Lifestyle: Traditional clothing and social structure.
      10. Poets: Exactly 2 famous poets associated with the region, with name, period, language, contribution, and a famous verse (all in ${targetLang}).`,
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
          { text: `Reconstruct this damaged monument or sculpture from ${context}. Restore missing features and original architectural grandeur in high detail. Maintain historical accuracy for Andhra Pradesh styles.` }
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
    const targetLang = lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi';
    
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are ITIHAASA AI, an expert on Andhra Pradesh's cultural heritage. 
        MANDATORY: You must communicate ONLY in ${targetLang}. 
        If the user asks in English but the app language is ${targetLang}, answer in ${targetLang}.
        Be informative, respectful, and academically accurate about the history of Andhra Pradesh.`
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  }
};
