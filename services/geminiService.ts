import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

export const generateRoutine = async (query: string): Promise<any[]> => {
  try {
    // La instancia se crea aquí para usar la clave inyectada más reciente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const categoriesStr = Object.values(Category).join(', ');
    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model,
      contents: `Eres un asistente experto en autismo y neurodivergencia. Tu tarea es crear una rutina diaria lógica y clara para la siguiente solicitud: "${query}".
      
      Reglas estrictas:
      1. Devuelve SOLAMENTE un Array JSON válido.
      2. Usa exactamente estas claves para cada objeto: 
         - "label": Nombre de la actividad en español.
         - "arasaacKeyword": Una única palabra clave en español para buscar el pictograma.
         - "iconName": Nombre de un icono de Lucide en inglés.
         - "category": Una de estas opciones: ${categoriesStr}.
         - "period": "morning", "afternoon" o "evening".
         - "time": Formato HH:MM.
      3. Asegúrate de que el orden sea cronológico.`,
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
            required: ["label", "category", "iconName", "arasaacKeyword", "period", "time"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se recibió respuesta de la IA.");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en geminiService:", error);
    throw error;
  }
};