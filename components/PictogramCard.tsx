
import React from 'react';
import { PictogramData, Activity, UserMode } from '../types';
import { useApp } from '../context/AppContext';
import { PictogramIcon } from './PictogramIcon';
import { speakText } from '../services/speechService';
import { getArasaacImageUrl } from '../services/arasaacService';
import { Check, Trash2, ArrowUp, ArrowDown, Pencil } from 'lucide-react';

interface Props {
  activity: Activity;
  pictogram: PictogramData;
  day?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const PictogramCard: React.FC<Props> = ({ 
  activity, 
  pictogram, 
  day, 
  onDelete,
  onEdit, 
  onMoveUp, 
  onMoveDown 
}) => {
  const { mode, settings, toggleActivityDone } = useApp();
  const { highContrast, showText } = settings;

  const labelText = activity.customLabel || pictogram.label;
  const statusText = activity.isDone ? 'Completado' : 'Pendiente';
  const timeText = activity.time ? `a las ${activity.time}` : '';

  const handleClick = () => {
    if (settings.voiceEnabled && settings.autoSpeak) {
      speakText(labelText);
    }
  };

  const handleDoneToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (day) {
        if (!activity.isDone) {
            if(settings.voiceEnabled) speakText(`¡Muy bien! ${labelText} terminado.`);
        }
        toggleActivityDone(day, activity.id);
    }
  };

  const handleAction = (e: React.MouseEvent | React.KeyboardEvent, action?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (action) action();
  };

  // En alto contraste usamos blanco puro o negro puro con bordes gruesos
  const cardBg = highContrast 
    ? (activity.isDone ? 'bg-black border-4 border-white' : 'bg-white border-4 border-cyan-400') 
    : (activity.isDone ? 'bg-green-100 border-green-300' : pictogram.bgColor);

  const textColor = highContrast 
    ? (activity.isDone ? 'text-white' : 'text-black') 
    : 'text-slate-800';

  const renderImage = () => {
    // En alto contraste, si hay imagen, la mostramos pero con un fondo neutro para asegurar visibilidad
    const imgWrapperClass = highContrast ? "bg-white rounded-lg p-1" : "";
    
    if (pictogram.customImageUrl) {
        return (
          <div className={imgWrapperClass}>
            <img src={pictogram.customImageUrl} alt="" aria-hidden="true" className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-lg" />
          </div>
        );
    } else if (pictogram.arasaacId) {
        return (
          <div className={imgWrapperClass}>
            <img src={getArasaacImageUrl(pictogram.arasaacId)} alt="" aria-hidden="true" className="h-20 w-20 md:h-24 md:w-24 object-contain" />
          </div>
        );
    } else {
        return <PictogramIcon 
                name={pictogram.iconName || 'HelpCircle'} 
                size={mode === UserMode.CHILD ? 64 : 40} 
                className={`${textColor}`} 
             />;
    }
  };

  if (mode === UserMode.CHILD) {
    return (
      <button 
        onClick={handleClick}
        aria-label={`${labelText}. ${statusText}. ${timeText}`}
        aria-pressed={activity.isDone}
        className={`
          relative flex flex-col items-center justify-between p-2 rounded-2xl shadow-sm transition-all duration-300
          ${cardBg} h-48 w-full active:scale-95 cursor-pointer
          ${activity.isDone ? 'opacity-60 grayscale' : ''}
          border-b-8 group
        `}
      >
        {activity.time && (
          <span className={`text-xs font-black ${highContrast ? 'bg-black text-cyan-300 px-2' : 'bg-white/50 text-slate-600'} rounded-lg mb-1`}>
            {activity.time}
          </span>
        )}
        <div className="flex-1 flex items-center justify-center w-full">
           {renderImage()}
        </div>
        {showText && (
          <span className={`text-center font-black leading-tight text-lg ${textColor} mt-2 line-clamp-2 uppercase tracking-tighter`}>
            {labelText}
          </span>
        )}
        {day && (
          <div 
            onClick={handleDoneToggle}
            className={`absolute top-2 right-2 p-3 rounded-full ${activity.isDone ? 'bg-green-500 text-white' : 'bg-white/80 text-gray-400'} shadow-md z-20 border-2 border-white`}
          >
            <Check size={28} strokeWidth={4} aria-hidden="true" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-between p-2 rounded-2xl shadow-sm transition-all duration-300
        ${cardBg} h-40 w-full border-b-4 group
      `}
      role="region"
      aria-label={`Actividad: ${labelText}`}
    >
      {activity.time && (
        <span className={`text-[10px] font-black ${highContrast ? 'bg-black text-cyan-300 px-1' : 'bg-white/50 text-slate-600'} rounded px-2 mb-1`}>
          {activity.time}
        </span>
      )}
      <div className="flex-1 flex items-center justify-center w-full" onClick={handleClick}>
         {renderImage()}
      </div>
      {showText && (
        <span className={`text-center font-black leading-tight text-xs ${textColor} mt-2 line-clamp-2 uppercase tracking-tight`}>
          {labelText}
        </span>
      )}

      {/* Controles Modo Adulto */}
      <div className="absolute -top-3 -right-2 z-50 flex flex-col gap-1">
          {onDelete && (
              <button 
                  onClick={(e) => handleAction(e, onDelete)} 
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-red-600 transition-colors"
                  aria-label={`Eliminar ${labelText}`}
              >
                  <Trash2 size={16} aria-hidden="true" />
              </button>
          )}
      </div>
      
      <div className="absolute top-1 left-1 z-40">
          {onEdit && (
              <button 
                  onClick={(e) => handleAction(e, onEdit)} 
                  className="p-1.5 bg-white text-blue-600 rounded-full border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors"
                  aria-label={`Editar ${labelText}`}
              >
                  <Pencil size={14} aria-hidden="true" />
              </button>
          )}
      </div>
      
      {onMoveUp && onMoveDown && (
          <div className="absolute bottom-1 right-1 flex flex-row gap-1 z-40">
              <button 
                  onClick={(e) => handleAction(e, onMoveUp)} 
                  className="p-1 bg-white/80 text-slate-600 rounded-full border shadow-sm hover:bg-white transition-colors"
                  aria-label={`Mover hacia arriba`}
              >
                  <ArrowUp size={14} aria-hidden="true" />
              </button>
              <button 
                  onClick={(e) => handleAction(e, onMoveDown)} 
                  className="p-1 bg-white/80 text-slate-600 rounded-full border shadow-sm hover:bg-white transition-colors"
                  aria-label={`Mover hacia abajo`}
              >
                  <ArrowDown size={14} aria-hidden="true" />
              </button>
          </div>
      )}
    </div>
  );
};
