import React, { useEffect } from 'react';
import { Trophy, Star, PartyPopper, X } from 'lucide-react';
import { speakText } from '../services/speechService';

interface Props {
  onClose: () => void;
}

export const CongratulationModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    // Play sound and speak immediately on mount
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'); // Simple sound or fallback
    audio.play().catch(() => {}); // Catch error if interaction needed first
    
    setTimeout(() => {
        speakText("¡Felicidades! Has completado todas tus tareas. ¡Eres genial!");
    }, 500);

    // Auto close after 5 seconds
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border-8 border-yellow-300 relative transform animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Confetti / Decorations Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-10 left-10 text-red-500 animate-bounce delay-100"><Star size={40} fill="currentColor" /></div>
            <div className="absolute top-20 right-10 text-blue-500 animate-bounce delay-300"><Star size={30} fill="currentColor" /></div>
            <div className="absolute bottom-10 left-20 text-green-500 animate-bounce delay-200"><Star size={50} fill="currentColor" /></div>
            <div className="absolute bottom-20 right-20 text-purple-500 animate-bounce delay-500"><Star size={35} fill="currentColor" /></div>
        </div>

        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 z-10"
        >
            <X size={24} />
        </button>

        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-75"></div>
                <div className="bg-yellow-100 p-8 rounded-full border-4 border-yellow-400 shadow-xl">
                    <Trophy size={80} className="text-yellow-600 drop-shadow-md" />
                </div>
                <div className="absolute -top-2 -right-4 text-brand-secondary rotate-12">
                    <PartyPopper size={48} />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-4xl font-extrabold text-brand-primary tracking-tight">
                    ¡Excelente Trabajo!
                </h2>
                <p className="text-xl text-slate-600 font-medium">
                    Has terminado todo por hoy.
                </p>
            </div>

            <div className="flex gap-2">
                <Star className="text-yellow-400" fill="currentColor" size={32} />
                <Star className="text-yellow-400" fill="currentColor" size={32} />
                <Star className="text-yellow-400" fill="currentColor" size={32} />
                <Star className="text-yellow-400" fill="currentColor" size={32} />
                <Star className="text-yellow-400" fill="currentColor" size={32} />
            </div>

            <button 
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-brand-primary text-white text-xl font-bold rounded-full shadow-lg hover:bg-brand-secondary transition-transform active:scale-95"
            >
                ¡Gracias!
            </button>
        </div>
      </div>
    </div>
  );
};
