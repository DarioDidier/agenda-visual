import { GoogleGenAI, Type } from "@google/genai";

export const translateTextToKeywords = async (text: string): Promise<string[]> => {
  if (!text || text.trim().length < 2) return [];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `Eres un experto en comunicación aumentativa y alternativa (CAA).
    Tu tarea es recibir una frase en lenguaje natural y devolver una lista de palabras clave que representen los conceptos esenciales para buscar pictogramas de ARASAAC.
    
    REGLAS:
    1. Extrae solo sustantivos, verbos, adjetivos y conceptos espaciales/temporales importantes.
    2. Convierte verbos a infinitivo (ej: "comiendo" -> "comer").
    3. Normaliza a singular (ej: "manzanas" -> "manzana").
    4. Mantén el orden lógico de la frase.
    5. Devuelve EXCLUSIVAMENTE un Array JSON de strings.
    
    Ejemplo: "Quiero ir a jugar al parque con mi mamá" -> ["querer", "ir", "jugar", "parque", "mamá"]`;

    const response = await ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Error en PictoTraductor AI:", error);
    // Fallback simple: separar por espacios si la IA falla
    return text.split(/\s+/).filter(w => w.length > 2);
  }
};