import React, { useState, useRef } from 'react';
import { TimePeriod } from '../types';
import { X, Gift, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface Props {
  initialLabel?: string;
  initialEmoji?: string;
  initialImageUrl?: string;
  period: TimePeriod;
  onSave: (label: string, emoji: string, imageUrl?: string) => void;
  onClose: () => void;
}

const PRESET_EMOJIS = ['⭐', '🏆', '🍦', '🎮', '📺', '🧸', '🎨', '🚲', '🍕', '📱', '⚽', '🧩'];
const PRESET_LABELS = [
    'Ver TV 15 min',
    'Jugar Tablet',
    'Comer un helado',
    'Ir al parque',
    'Leer un cuento',
    'Jugar con juguetes',
    'Elegir la cena'
];

export const RewardConfigModal: React.FC<Props> = ({ initialLabel = '', initialEmoji = '⭐', initialImageUrl = '', period, onSave, onClose }) => {
  const [label, setLabel] = useState(initialLabel);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPeriodName = () => {
      switch(period) {
          case 'morning': return 'Mañana';
          case 'afternoon': return 'Tarde';
          case 'evening': return 'Noche';
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
            setImageUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <Gift className="text-pink-500" /> Premio de la {getPeriodName()}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>
        
        <div className="bg-pink-50 p-3 rounded-lg text-sm text-pink-800">
            Si el niño completa todas las tareas de la {getPeriodName().toLowerCase()}, verá este premio desbloqueado.
        </div>

        <div className="space-y-4">
             {/* Image Upload Section */}
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">1. Imagen del Premio (Opcional)</label>
                
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center relative shrink-0">
                        {imageUrl ? (
                            <div className="relative w-full h-full group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setImageUrl('')}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ) : (
                            <ImageIcon className="text-slate-400" />
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 bg-blue-50 text-brand-primary font-bold rounded-lg border border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                        >
                            <Upload size={18} /> Subir Foto
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            onClick={(e) => { (e.target as HTMLInputElement).value = '' }} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <p className="text-xs text-slate-500">
                            Sube una foto del juguete, comida o actividad real.
                        </p>
                    </div>
                </div>
            </div>

            {/* Emoji Fallback Section */}
            {!imageUrl && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">O elige un Icono</label>
                    <div className="grid grid-cols-6 gap-2">
                        {PRESET_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => setSelectedEmoji(emoji)}
                                className={`text-2xl p-2 rounded-lg hover:bg-slate-100 transition-all ${selectedEmoji === emoji ? 'bg-pink-100 ring-2 ring-pink-500 transform scale-110' : ''}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">2. ¿Cuál es el premio?</label>
                 <input 
                    type="text" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ej: Ver televisión"
                    className="w-full p-3 bg-white text-slate-900 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none mb-2"
                 />
                 <div className="flex flex-wrap gap-2">
                     {PRESET_LABELS.map(l => (
                         <button 
                            key={l} 
                            onClick={() => setLabel(l)}
                            className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 hover:bg-slate-200"
                         >
                             {l}
                         </button>
                     ))}
                 </div>
            </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button 
                onClick={() => onSave(label, selectedEmoji, imageUrl)} 
                disabled={!label}
                className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow hover:bg-pink-600 disabled:opacity-50"
            >
                Guardar Premio
            </button>
        </div>
      </div>
    </div>
  );
};