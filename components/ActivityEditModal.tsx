import React, { useState } from 'react';
import { Activity, PictogramData, TimePeriod } from '../types';
import { X, Clock, Type, Image as ImageIcon, Sun, Sunset, Moon } from 'lucide-react';
import { PictogramSelectorModal } from './PictogramSelectorModal';
import { useApp } from '../context/AppContext';
import { PictogramIcon } from './PictogramIcon';
import { getArasaacImageUrl } from '../services/arasaacService';

interface Props {
  activity: Activity;
  onSave: (updates: Partial<Activity>) => void;
  onClose: () => void;
  onChangePictogram?: () => void; // Optional hook
}

export const ActivityEditModal: React.FC<Props> = ({ activity, onSave, onClose }) => {
  const { pictograms } = useApp();
  const [time, setTime] = useState(activity.time || '');
  const [customLabel, setCustomLabel] = useState(activity.customLabel || '');
  const [period, setPeriod] = useState<TimePeriod>(activity.period || 'morning');
  
  const [showSelector, setShowSelector] = useState(false);
  const [tempPictogramId, setTempPictogramId] = useState(activity.pictogramId);

  const currentPictogram = pictograms.find(p => p.id === tempPictogramId);

  const handleSave = () => {
    onSave({ time, customLabel, pictogramId: tempPictogramId, period });
    onClose();
  };

  const handlePictogramSelect = (pic: PictogramData) => {
      setTempPictogramId(pic.id);
      // Auto update label if it was empty or default
      if (!customLabel || (currentPictogram && customLabel === currentPictogram.label)) {
          setCustomLabel(pic.label);
      }
      setShowSelector(false);
  };

  if (showSelector) {
      return <PictogramSelectorModal onSelect={handlePictogramSelect} onClose={() => setShowSelector(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-xl text-slate-800">Editar Actividad</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X /></button>
        </div>

        <div className="space-y-4">
            {/* Pictogram Preview & Change */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                    {currentPictogram && currentPictogram.arasaacId ? (
                        <img src={getArasaacImageUrl(currentPictogram.arasaacId)} alt="" className="w-12 h-12 object-contain" />
                    ) : (
                        <PictogramIcon name={currentPictogram?.iconName || 'Circle'} size={32} />
                    )}
                </div>
                <div>
                    <button 
                        onClick={() => setShowSelector(true)}
                        className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:underline"
                    >
                        <ImageIcon size={16} /> Cambiar Pictograma
                    </button>
                    <p className="text-xs text-slate-500 mt-1">Busca en ARASAAC o librería</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Momento del Día</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setPeriod('morning')}
                        className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${period === 'morning' ? 'bg-white shadow text-yellow-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Sun size={20} />
                        <span className="text-xs font-bold">Mañana</span>
                    </button>
                    <button 
                         onClick={() => setPeriod('afternoon')}
                         className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${period === 'afternoon' ? 'bg-white shadow text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Sunset size={20} />
                        <span className="text-xs font-bold">Tarde</span>
                    </button>
                    <button 
                         onClick={() => setPeriod('evening')}
                         className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${period === 'evening' ? 'bg-white shadow text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Moon size={20} />
                        <span className="text-xs font-bold">Noche</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Clock size={16} /> Horario
                    </label>
                    <input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 bg-white text-slate-900 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Type size={16} /> Etiqueta
                    </label>
                    <input 
                        type="text" 
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="w-full p-3 bg-white text-slate-900 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                </div>
            </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow hover:bg-brand-secondary">
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};