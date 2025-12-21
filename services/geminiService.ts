
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
    // Instanciamos justo antes de usar para obtener la API_KEY más reciente del entorno
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Modelo Flash: Gratuito, rápido y optimizado para JSON
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `Eres un asistente experto en accesibilidad cognitiva y autismo (TEA). 
    Tu misión es crear agendas visuales predecibles y claras para niños y niñas neurodivergentes.
    
    REGLAS DE ORO:
    1. Usa lenguaje simple, directo y positivo (ej: "Lavar las manos" en lugar de "No olvides lavarte").
    2. Divide las tareas en pasos muy pequeños si el nivel de apoyo es "alto".
    3. Si el tipo de día es "casa", enfócate en rutinas domésticas, juego libre y autonomía personal.
    4. Cada actividad debe tener: hora (HH:MM), actividad (nombre corto), pictograma (palabra clave para ARASAAC), descripción (instrucción breve) y categoría.
    5. Devuelve estrictamente un JSON con el formato: { "dia": string, "rutina": Array }.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Genera una rutina de ${params.dayType} para un niño/a de ${params.age} años con nivel de apoyo ${params.supportLevel}. Detalles extra: ${params.additionalInfo || 'Ninguno'}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dia: { type: Type.STRING, description: "Día de la semana" },
            rutina: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hora: { type: Type.STRING },
                  actividad: { type: Type.STRING },
                  pictograma: { type: Type.STRING, description: "Palabra clave para búsqueda de imagen" },
                  descripcion: { type: Type.STRING },
                  categoria: { type: Type.STRING },
                  periodo: { type: Type.STRING, description: "morning, afternoon o evening" },
                  icono_lucide: { type: Type.STRING, description: "Icono de Lucide (ej: Bath, Sun, Home)" }
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
    if (!text) throw new Error("La IA no devolvió contenido.");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en generateRoutine:", error);
    throw error;
  }
};
