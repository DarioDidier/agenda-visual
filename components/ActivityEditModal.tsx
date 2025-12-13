import React, { useState } from 'react';
import { Activity, PictogramData } from '../types';
import { X, Clock, Type, Image as ImageIcon } from 'lucide-react';
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
  
  const [showSelector, setShowSelector] = useState(false);
  const [tempPictogramId, setTempPictogramId] = useState(activity.pictogramId);

  const currentPictogram = pictograms.find(p => p.id === tempPictogramId);

  const handleSave = () => {
    onSave({ time, customLabel, pictogramId: tempPictogramId });
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
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Clock size={16} /> Horario
                </label>
                <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none bg-white text-slate-900"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Type size={16} /> Etiqueta / Texto
                </label>
                <input 
                    type="text" 
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none bg-white text-slate-900"
                />
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