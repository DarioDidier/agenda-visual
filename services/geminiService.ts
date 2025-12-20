
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

export const generateRoutine = async (query: string): Promise<any[]> => {
  try {
    // Inicialización directa usando la variable de entorno inyectada justo antes de la llamada.
    // Esto asegura que siempre se use la clave más reciente si el usuario la cambia en el diálogo.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Lista de categorías disponibles para el contexto de la IA
    const categoriesStr = Object.values(Category).join(', ');

    // Usamos gemini-3-pro-preview para tareas complejas de razonamiento y generación de rutinas personalizadas.
    const model = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model,
      contents: `Eres un asistente experto en autismo y neurodivergencia. Tu tarea es crear una rutina diaria lógica y clara para la siguiente solicitud: "${query}".
      
      Reglas estrictas:
      1. Devuelve SOLAMENTE un Array JSON válido.
      2. Usa exactamente estas claves para cada objeto: 
         - "label": Nombre de la actividad en español (ej: "Lavarse los dientes").
         - "arasaacKeyword": Una única palabra clave en español para buscar el pictograma (ej: "dientes").
         - "iconName": Nombre de un icono de Lucide en inglés que represente la acción (ej: "Sparkles").
         - "category": Una de estas opciones: ${categoriesStr}.
         - "period": "morning", "afternoon" o "evening".
         - "time": Formato HH:MM (ej: "08:30").
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

    // Acceso directo a .text según las directrices del SDK.
    const text = response.text;
    if (!text) throw new Error("La IA no devolvió contenido.");

    // Parsear el JSON retornado
    return JSON.parse(text);

  } catch (error) {
    console.error("Error en el Asistente Mágico:", error);
    throw error;
  }
};
