import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

// This function creates a structured prompt to generate a routine based on a user query
// and maps it to our internal data structure.

export const generateRoutine = async (query: string): Promise<any[]> => {
  try {
    const apiKey = process.env.API_KEY;
    
    // Debugging check for Vercel deployment
    if (!apiKey) {
        console.warn("Gemini API Key is missing or empty. Please check your Vercel Environment Variables (API_KEY).");
        throw new Error("Falta la API Key. Por favor configura API_KEY en las variables de entorno.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // We ask Gemini to return a JSON list of activities.
    // We provide the list of available categories to help it categorize.
    const categoriesStr = Object.values(Category).join(', ');

    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: `Eres un experto asistente en educación especial y autismo. 
      Crea una rutina secuencial para un niño basada en esta solicitud: "${query}".
      
      Usa un lenguaje muy simple y directo.
      Asigna inteligentemente el "period" (morning, afternoon, evening) a cada actividad según la hora lógica del día.
      
      Para cada paso, proporciona una 'arasaacKeyword'. Esta palabra clave debe ser UN solo sustantivo o verbo en infinitivo en ESPAÑOL que describa mejor la acción visualmente para buscarla en una base de datos de pictogramas (ej: para "Lavarse los dientes" usa "dientes" o "cepillar").
      
      Debes devolver los datos estrictamente en formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: {
                type: Type.STRING,
                description: "Nombre corto de la actividad (ej: 'Lavarse los dientes')",
              },
              arasaacKeyword: {
                type: Type.STRING,
                description: "Palabra clave única en español para buscar el pictograma (ej: 'dientes', 'cama', 'colegio', 'manzana').",
              },
              iconName: {
                type: Type.STRING,
                description: "Nombre de un icono visual de respaldo en inglés (Lucide icon name).",
              },
              category: {
                type: Type.STRING,
                description: `Categoría de la actividad. Valores posibles: ${categoriesStr}`,
              },
              period: {
                type: Type.STRING,
                description: "El momento del día. Valores: 'morning', 'afternoon', 'evening'.",
              },
              time: {
                type: Type.STRING,
                description: "Hora sugerida en formato HH:MM (opcional)",
              }
            },
            required: ["label", "category", "iconName", "arasaacKeyword", "period"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean potential markdown fences (fixes issues where model wraps JSON in ```json ... ```)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Error generating routine:", error);
    return [];
  }
};