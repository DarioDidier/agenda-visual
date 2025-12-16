
// Mantener referencia global para evitar que el Garbage Collector de Android/Chrome
// elimine el objeto antes de que termine de hablar.
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // 1. Cancelar cualquier audio previo
  window.speechSynthesis.cancel();

  // 2. Crear nueva instancia
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Guardar referencia global
  currentUtterance = utterance;

  utterance.lang = 'es-ES'; 
  utterance.rate = 0.9; 
  utterance.pitch = 1.0;

  // 3. Selección de voz mejorada para Android/iOS
  const voices = window.speechSynthesis.getVoices();
  
  // Intentar buscar 'Paulina' (común en Android/Google) o cualquier voz en español
  const spanishVoice = voices.find(v => 
      v.name.includes('Paulina') || 
      (v.lang.includes('es') && v.name.includes('Google')) ||
      v.lang.includes('es')
  );

  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  // Limpiar referencia al terminar
  utterance.onend = () => {
    currentUtterance = null;
  };

  utterance.onerror = (e) => {
    console.error("Speech error", e);
    currentUtterance = null;
  };

  // 4. Ejecutar
  window.speechSynthesis.speak(utterance);
};

// Precargar voces (Android a veces las carga asíncronamente)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
