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
    // Se instancia justo antes del uso para asegurar que usa la API Key actual del entorno
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoriesStr = Object.values(Category).join(', ');
    
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `Eres un experto en accesibilidad cognitiva y autismo (TEA). 
    Tu objetivo es crear rutinas visuales altamente predecibles, claras y funcionales.
    
    CONTEXTO DEL NIÑO/A:
    - Edad: ${params.age} años.
    - Tipo de día: ${params.dayType}.
    - Nivel de apoyo necesario: ${params.supportLevel} (esto determina la complejidad de los pasos).
    
    REGLAS DE ACCESIBILIDAD:
    1. Usa lenguaje simple, directo y en primera persona o infinitivo.
    2. Si el apoyo es "alto", desglosa las actividades en pasos muy pequeños y concretos.
    3. Si el tipo de día es "casa", enfócate exclusivamente en actividades del hogar: autonomía (vestirse, higiene), tareas domésticas simples, juego libre en casa y descanso.
    4. Devuelve SOLAMENTE un Array JSON válido.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Genera una rutina de ${params.dayType} para un niño de ${params.age} años con nivel de apoyo ${params.supportLevel}. Detalles extra: ${params.additionalInfo || 'Ninguno'}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Nombre de la actividad" },
              arasaacKeyword: { type: Type.STRING, description: "Palabra clave para el pictograma" },
              iconName: { type: Type.STRING, description: "Icono de respaldo" },
              category: { type: Type.STRING, description: "Categoría de la actividad" },
              period: { type: Type.STRING, description: "morning, afternoon o evening" },
              time: { type: Type.STRING, description: "HH:MM" },
              description: { type: Type.STRING, description: "Explicación muy breve" }
            },
            required: ["label", "category", "iconName", "arasaacKeyword", "period", "time"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se recibió contenido de la IA.");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en generateRoutine:", error);
    throw error;
  }
};