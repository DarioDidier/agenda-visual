
import React, { useEffect } from 'react';
import { Trophy, Star, PartyPopper, X, Gift } from 'lucide-react';
import { speakText } from '../services/speechService';
import { useApp } from '../context/AppContext';

interface Props {
  onClose: () => void;
  title?: string;
  message?: string;
  rewardEmoji?: string;
  rewardImageUrl?: string;
}

export const CongratulationModal: React.FC<Props> = ({ 
  onClose, 
  title = "¡Excelente Trabajo!", 
  message = "Has terminado todo por hoy.",
  rewardEmoji = "⭐",
  rewardImageUrl
}) => {
  const { settings } = useApp();
  const isHighContrast = settings.highContrast;

  useEffect(() => {
    // Play sound and speak immediately on mount
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'); // Simple sound or fallback
    audio.play().catch(() => {}); // Catch error if interaction needed first
    
    setTimeout(() => {
        if (settings.voiceEnabled) speakText(message);
    }, 500);

    // Auto close after 10 seconds to give time to see the reward
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose, message, settings.voiceEnabled]);

  const cardBg = isHighContrast ? 'bg-black border-white' : 'bg-white border-yellow-300';
  const textColor = isHighContrast ? 'text-white' : 'text-slate-800';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className={`rounded-[40px] shadow-2xl p-8 max-w-lg w-full text-center border-8 relative transform animate-in zoom-in-95 duration-300 overflow-hidden ${cardBg}`}>
        
        {/* Confetti / Decorations Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-10 left-10 text-red-500 animate-bounce delay-100"><Star size={40} fill="currentColor" /></div>
            <div className="absolute top-20 right-10 text-blue-500 animate-bounce delay-300"><Star size={30} fill="currentColor" /></div>
            <div className="absolute bottom-10 left-20 text-green-500 animate-bounce delay-200"><Star size={50} fill="currentColor" /></div>
            <div className="absolute bottom-20 right-20 text-purple-500 animate-bounce delay-500"><Star size={35} fill="currentColor" /></div>
        </div>

        <button 
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full z-10 ${isHighContrast ? 'bg-white text-black' : 'bg-slate-100 text-slate-500'}`}
        >
            <X size={24} />
        </button>

        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-75"></div>
                <div className={`p-8 rounded-full border-4 shadow-xl ${isHighContrast ? 'bg-white border-white' : 'bg-yellow-100 border-yellow-400'}`}>
                    <Trophy size={80} className="text-yellow-600 drop-shadow-md" />
                </div>
                <div className="absolute -top-2 -right-4 text-brand-secondary rotate-12">
                    <PartyPopper size={48} />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className={`text-4xl font-black uppercase tracking-tight ${isHighContrast ? 'text-white' : 'text-brand-primary'}`}>
                    {title}
                </h2>
                <p className={`text-xl font-bold leading-relaxed ${isHighContrast ? 'text-cyan-300' : 'text-slate-600'}`}>
                    {message}
                </p>
            </div>

            {/* Displaying the Unlocked Reward */}
            <div className={`w-full p-6 rounded-[35px] border-4 flex flex-col items-center gap-4 ${isHighContrast ? 'bg-white border-cyan-400' : 'bg-pink-50 border-pink-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <Gift className="text-pink-500" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-600">Premio Ganado</span>
                </div>
                
                {rewardImageUrl ? (
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                        <img src={rewardImageUrl} alt="Tu premio" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="text-7xl mb-2 animate-bounce">
                        {rewardEmoji}
                    </div>
                )}
                
                <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">{message.split(': ')[1] || '¡TU PREMIO!'}</p>
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
                className="mt-4 px-10 py-5 bg-green-500 text-white text-2xl font-black rounded-[25px] shadow-2xl hover:bg-green-600 transition-transform active:scale-95 border-b-8 border-green-700 uppercase"
            >
                ¡GRACIAS!
            </button>
        </div>
      </div>
    </div>
  );
};
