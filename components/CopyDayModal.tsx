import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, ArrowRight } from 'lucide-react';

interface Props {
  sourceDay: string; // ISO Date Key
  onCopy: (targetDay: string) => void;
  onClose: () => void;
}

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const getDateKey = (d: Date) => d.toISOString().split('T')[0];

export const CopyDayModal: React.FC<Props> = ({ sourceDay, onCopy, onClose }) => {
  const { weekDates } = useApp();
  const todayKey = getDateKey(new Date());

  // Filter out the source day AND past days
  const availableTargetDates = weekDates.filter(d => {
      const k = getDateKey(d);
      return k !== sourceDay && k >= todayKey;
  });
  
  const [targetDay, setTargetDay] = useState(
      availableTargetDates.length > 0 ? getDateKey(availableTargetDates[0]) : ''
  );

  const formatLabel = (dateKey: string) => {
      if (!dateKey) return '';
      const parts = dateKey.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      return `${spanishDays[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <Copy size={20} /> Copiar Rutina
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>

        {availableTargetDates.length > 0 ? (
            <>
                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between text-lg font-medium text-slate-700">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-base">{formatLabel(sourceDay)}</span>
                        <ArrowRight className="text-slate-400" />
                        <select 
                            value={targetDay}
                            onChange={(e) => setTargetDay(e.target.value)}
                            className="border rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-brand-primary outline-none text-base"
                        >
                            {availableTargetDates.map(d => {
                                const k = getDateKey(d);
                                return <option key={k} value={k}>{formatLabel(k)}</option>;
                            })}
                        </select>
                    </div>
                    
                    <p className="text-sm text-slate-500 text-center">
                        Esto agregará todas las actividades del <strong>{formatLabel(sourceDay)}</strong> al final de la lista del <strong>{formatLabel(targetDay)}</strong>.
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button 
                        onClick={() => { if(targetDay) onCopy(targetDay); onClose(); }} 
                        className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow hover:bg-brand-secondary"
                    >
                        Copiar
                    </button>
                </div>
            </>
        ) : (
            <div className="py-6 text-center">
                <p className="text-slate-500">No hay días futuros disponibles en la semana actual para copiar.</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 text-brand-primary font-bold hover:bg-blue-50 rounded-lg">Cerrar</button>
            </div>
        )}
      </div>
    </div>
  );
};