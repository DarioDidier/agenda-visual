import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

// This function creates a structured prompt to generate a routine based on a user query
// and maps it to our internal data structure.

export const generateRoutine = async (query: string): Promise<any[]> => {
  try {
    const apiKey = process.env.API_KEY;
    
    // Debugging check for Vercel deployment
    if (!apiKey) {
        throw new Error("Falta la API Key. Configura VITE_API_KEY o API_KEY en tu entorno.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // We ask Gemini to return a JSON list of activities.
    // We provide the list of available categories to help it categorize.
    const categoriesStr = Object.values(Category).join(', ');

    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: `Eres un asistente experto en autismo. Crea una rutina JSON para: "${query}".
      
      Reglas:
      1. Devuelve SOLAMENTE un Array JSON válido: [ { ... }, { ... } ].
      2. No incluyas texto antes ni después, ni bloques markdown markdown como \`\`\`json.
      3. Usa claves: "label" (nombre corto), "arasaacKeyword" (1 palabra clave español), "iconName" (icono Lucide inglés), "category" (valores: ${categoriesStr}), "period" (morning, afternoon, evening), "time" (HH:MM).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              arasaacKeyword: { type: Type.STRING },
              iconName: { type: Type.STRING },
              category: { type: Type.STRING },
              period: { type: Type.STRING },
              time: { type: Type.STRING }
            },
            required: ["label", "category", "iconName", "arasaacKeyword", "period"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("La IA no devolvió contenido.");

    console.log("Gemini Raw Response:", text);

    // Robust JSON Extraction: Find the first '[' and the last ']'
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    if (firstBracket === -1 || lastBracket === -1) {
        throw new Error("La respuesta no contiene una lista válida.");
    }

    const jsonString = text.substring(firstBracket, lastBracket + 1);
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error generating routine:", error);
    throw error; // Propagate error to UI
  }
};