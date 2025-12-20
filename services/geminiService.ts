
import { GoogleGenAI, Type } from "@google/genai";
import { Category, SupportLevel, DayType } from "../types";

export interface RoutineParams {
  age: number;
  dayType: DayType;
  supportLevel: SupportLevel;
  additionalInfo?: string;
}

export const generateRoutine = async (params: RoutineParams): Promise<any[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoriesStr = Object.values(Category).join(', ');
    
    // Usamos el modelo Flash para máxima velocidad y eficiencia de costos
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `Eres un experto en accesibilidad cognitiva y autismo (TEA). 
    Tu objetivo es crear rutinas visuales altamente predecibles y claras.
    
    CONTEXTO DEL NIÑO/A:
    - Edad: ${params.age} años.
    - Tipo de día: ${params.dayType}.
    - Nivel de apoyo necesario: ${params.supportLevel} (esto determina la complejidad de los pasos).
    
    REGLAS DE ACCESIBILIDAD:
    1. Usa lenguaje simple y positivo.
    2. Divide las tareas en pasos pequeños si el apoyo es "alto".
    3. Evita la sobrecarga: máximo 5-7 actividades por bloque.
    4. Si el tipo de día es "casa", enfócate en tareas domésticas, ocio en el hogar y autonomía personal.
    5. Devuelve SOLAMENTE un Array JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Genera una rutina de ${params.dayType} para un niño de ${params.age} años con nivel de apoyo ${params.supportLevel}. ${params.additionalInfo || ''}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Nombre claro de la actividad" },
              arasaacKeyword: { type: Type.STRING, description: "Palabra clave para buscar imagen" },
              iconName: { type: Type.STRING, description: "Icono de Lucide (ej: Bath, Coffee, Sun)" },
              category: { type: Type.STRING, description: "Categoría de la actividad" },
              period: { type: Type.STRING, description: "morning, afternoon o evening" },
              time: { type: Type.STRING, description: "HH:MM" },
              description: { type: Type.STRING, description: "Instrucción breve y simple" }
            },
            required: ["label", "category", "iconName", "arasaacKeyword", "period", "time"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se pudo obtener la rutina de los servidores de IA.");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en el Asistente Mágico:", error);
    throw error;
  }
};
