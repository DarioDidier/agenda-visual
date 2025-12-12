import React, { useState } from 'react';
import { DAYS_ORDER } from '../constants';
import { X, Copy, ArrowRight } from 'lucide-react';

interface Props {
  sourceDay: string;
  onCopy: (targetDay: string) => void;
  onClose: () => void;
}

export const CopyDayModal: React.FC<Props> = ({ sourceDay, onCopy, onClose }) => {
  const [targetDay, setTargetDay] = useState(DAYS_ORDER.find(d => d !== sourceDay) || DAYS_ORDER[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <Copy size={20} /> Copiar Rutina
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>

        <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-medium text-slate-700">
                <span className="bg-slate-100 px-3 py-1 rounded-lg">{sourceDay}</span>
                <ArrowRight className="text-slate-400" />
                <select 
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value)}
                    className="border rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    {DAYS_ORDER.filter(d => d !== sourceDay).map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>
            
            <p className="text-sm text-slate-500 text-center">
                Esto agregará todas las actividades del <strong>{sourceDay}</strong> al final de la lista del <strong>{targetDay}</strong>.
            </p>
        </div>

        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button 
                onClick={() => { onCopy(targetDay); onClose(); }} 
                className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow hover:bg-brand-secondary"
            >
                Copiar
            </button>
        </div>
      </div>
    </div>
  );
};
