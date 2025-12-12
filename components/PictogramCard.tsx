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

  const handleClick = () => {
    // Only speak on click if in Child mode or if not clicking controls in Adult mode
    if (settings.voiceEnabled && settings.autoSpeak) {
      const textToSpeak = activity.customLabel || pictogram.label;
      speakText(textToSpeak);
    }
  };

  const handleDoneToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (day) {
        if (!activity.isDone) {
            if(settings.voiceEnabled) speakText(`¡Muy bien! ${activity.customLabel || pictogram.label} terminado.`);
        }
        toggleActivityDone(day, activity.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to card click
    if (onDelete) onDelete();
  };

  const handleEditClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdit) onEdit();
  };

  const cardBg = highContrast 
    ? (activity.isDone ? 'bg-black border-4 border-white' : 'bg-white border-4 border-black') 
    : (activity.isDone ? 'bg-green-100 border-green-300' : pictogram.bgColor);

  const textColor = highContrast 
    ? (activity.isDone ? 'text-white' : 'text-black') 
    : 'text-slate-800';

  const renderImage = () => {
    if (pictogram.customImageUrl) {
        return <img src={pictogram.customImageUrl} alt={pictogram.label} className="h-16 w-16 object-cover rounded-lg" />;
    } else if (pictogram.arasaacId) {
        return <img src={getArasaacImageUrl(pictogram.arasaacId)} alt={pictogram.label} className="h-20 w-20 object-contain" />;
    } else {
        return <PictogramIcon 
                name={pictogram.iconName || 'HelpCircle'} 
                size={mode === UserMode.CHILD ? 64 : 40} 
                className={`${textColor}`} 
             />;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-between p-2 rounded-2xl shadow-sm transition-all duration-300
        ${cardBg}
        ${mode === UserMode.CHILD ? 'h-48 w-full active:scale-95 cursor-pointer' : 'h-40 w-full'}
        ${activity.isDone && mode === UserMode.CHILD ? 'opacity-60 grayscale' : ''}
        border-b-4 group
      `}
    >
      {/* Time Label */}
      {activity.time && (
        <span className={`text-xs font-bold ${highContrast ? 'bg-black text-white px-1' : 'bg-white/50 text-slate-600'} rounded px-2 mb-1`}>
          {activity.time}
        </span>
      )}

      {/* Image/Icon */}
      <div className="flex-1 flex items-center justify-center w-full">
         {renderImage()}
      </div>

      {/* Text Label */}
      {showText && (
        <span className={`text-center font-bold leading-tight ${mode === UserMode.CHILD ? 'text-lg' : 'text-sm'} ${textColor} mt-2 line-clamp-2`}>
          {activity.customLabel || pictogram.label}
        </span>
      )}

      {/* Interaction Layer - Child */}
      {mode === UserMode.CHILD && day && (
        <button 
          onClick={handleDoneToggle}
          className={`absolute top-2 right-2 p-3 rounded-full ${activity.isDone ? 'bg-green-500 text-white' : 'bg-white/80 text-gray-400 hover:bg-green-200'} shadow-md transition-colors z-20`}
          aria-label={activity.isDone ? "Marcar como pendiente" : "Marcar como hecho"}
        >
          <Check size={28} strokeWidth={4} />
        </button>
      )}

      {/* Interaction Layer - Adult (Edit Controls) - High Z-Index ensuring clickability */}
      {mode === UserMode.ADULT && (
        <>
            <div className="absolute -top-3 -right-2 z-50">
                {onDelete && (
                    <button 
                        onClick={handleDelete} 
                        className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md border-2 border-white transform active:scale-95 transition-all cursor-pointer" 
                        title="Eliminar actividad"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            
            <div className="absolute top-1 left-1 z-40">
                {onEdit && (
                    <button onClick={handleEditClick} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 shadow-sm border border-blue-200 cursor-pointer" title="Editar">
                        <Pencil size={14} />
                    </button>
                )}
            </div>
            
            {onMoveUp && onMoveDown && (
                <div className="absolute bottom-1 right-1 flex flex-row gap-1 z-40">
                    <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 bg-white/80 text-slate-600 rounded-full hover:bg-white shadow-sm border cursor-pointer">
                        <ArrowUp size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 bg-white/80 text-slate-600 rounded-full hover:bg-white shadow-sm border cursor-pointer">
                        <ArrowDown size={14} />
                    </button>
                </div>
            )}
        </>
      )}
    </div>
  );
};
