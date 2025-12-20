
import { GoogleGenAI, Type } from "@google/genai";
import { Category, SupportLevel, DayType } from "../types";

export interface RoutineParams {
  age: number;
  dayType: DayType;
  supportLevel: SupportLevel;
  additionalInfo?: string;
}

export const generateRoutine = async (params: RoutineParams): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Usamos el modelo Flash para máxima velocidad y eficiencia de costos
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `Eres un asistente especializado en crear rutinas visuales accesibles para niños y niñas, utilizando pictogramas y horarios, con un enfoque profundo en autismo (TEA) y neurodivergencia.
    
    Tu objetivo es crear rutinas predecibles, claras y funcionales que reduzcan la ansiedad y fomenten la autonomía.
    
    REGLAS DE GENERACIÓN:
    1. Lenguaje simple, concreto y positivo.
    2. Actividades claras y predecibles.
    3. Para nivel de apoyo "alto", desglosa tareas en pasos muy pequeños.
    4. Cada actividad debe tener un horario (HH:MM), un pictograma (keyword), una descripción corta y una categoría.
    5. Devuelve un objeto JSON con la estructura: { "dia": string, "rutina": Array }.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Crea una rutina de ${params.dayType} para un niño/a de ${params.age} años con nivel de apoyo ${params.supportLevel}. Info extra: ${params.additionalInfo || 'Ninguna'}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dia: { type: Type.STRING, description: "Día de la semana de la rutina" },
            rutina: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hora: { type: Type.STRING, description: "Formato HH:MM" },
                  actividad: { type: Type.STRING, description: "Nombre simple de la tarea" },
                  pictograma: { type: Type.STRING, description: "Palabra clave para buscar imagen (ARASAAC)" },
                  descripcion: { type: Type.STRING, description: "Explicación breve y clara" },
                  categoria: { type: Type.STRING, description: "Categoría de la actividad" },
                  periodo: { type: Type.STRING, description: "morning, afternoon o evening" },
                  icono_lucide: { type: Type.STRING, description: "Nombre de icono de Lucide (ej: Bath, Coffee, Utensils)" }
                },
                required: ["hora", "actividad", "pictograma", "descripcion", "categoria", "periodo", "icono_lucide"]
              }
            }
          },
          required: ["dia", "rutina"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se pudo obtener la rutina.");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en el Asistente Mágico:", error);
    throw error;
  }
};
