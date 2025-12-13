import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Edit2, Lock } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, DayOfWeek, Category } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { DAYS_ORDER } from '../constants';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';
import { CalendarNavigation } from '../components/CalendarNavigation';
import { getStartOfWeek, isDateInPast } from '../utils/dateUtils';

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule, schedule, selectedDate } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS_ORDER[0]);
  
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Calculate day status based on selected week
  const startOfWeek = getStartOfWeek(selectedDate);
  
  const getDayDate = (dayName: string) => {
      const index = DAYS_ORDER.indexOf(dayName as DayOfWeek);
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + index);
      return d;
  };

  const isDayLocked = (day: string) => isDateInPast(getDayDate(day));

  // Auto-select first valid day when date changes
  useEffect(() => {
      const firstValidDay = DAYS_ORDER.find(d => !isDayLocked(d));
      if (firstValidDay) {
          setSelectedDay(firstValidDay);
      } else {
          // If all days are past (viewing past week), keep default or first but logic will prevent save
          setSelectedDay(DAYS_ORDER[0]);
      }
  }, [selectedDate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedItems([]);
    
    try {
      // 1. Get the structure from Gemini
      const items = await generateRoutine(prompt);
      
      // 2. Enhance with ARASAAC images
      const enhancedItems = await Promise.all(items.map(async (item) => {
        let arasaacId = undefined;
        if (item.arasaacKeyword) {
          try {
            const results = await searchArasaac(item.arasaacKeyword);
            if (results && results.length > 0) {
              // Prefer exact matches or the first one
              arasaacId = results[0]._id;
            }
          } catch (e) {
            console.warn("Could not find arasaac image for", item.arasaacKeyword);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedItems(enhancedItems);
    } catch (e) {
      console.error(e);
      alert("Hubo un error generando la rutina. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemPictogram = (pic: PictogramData) => {
      if (editingItemIndex === null) return;
      
      const updatedItems = [...generatedItems];
      const item = updatedItems[editingItemIndex];
      
      // Update item with new pictogram data
      updatedItems[editingItemIndex] = {
          ...item,
          arasaacId: pic.arasaacId,
          iconName: pic.iconName,
          label: pic.label // Optionally update label? Maybe better to keep context label but swap icon.
      };
      
      setGeneratedItems(updatedItems);
      setEditingItemIndex(null);
  };

  const handleApply = () => {
    if (generatedItems.length === 0) return;

    if (isDayLocked(selectedDay)) {
        alert("No puedes guardar rutinas en días que ya han pasado. Por favor selecciona un día futuro o cambia la semana.");
        return;
    }

    const newActivities: Activity[] = generatedItems.map(item => {
        // Create a pictogram entry for it first
        const newPic: PictogramData = {
            id: crypto.randomUUID(),
            label: item.label,
            iconName: item.iconName,
            arasaacId: item.arasaacId,
            category: item.category as Category,
            bgColor: 'bg-white border-2 border-indigo-200' // Default generated color
        };
        addPictogram(newPic);

        return {
            id: crypto.randomUUID(),
            pictogramId: newPic.id,
            customLabel: item.label,
            time: item.time || '00:00',
            isDone: false
        };
    });

    setSchedule(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), ...newActivities]
    }));
    
    // Clear
    setGeneratedItems([]);
    setPrompt('');
    alert(`¡Rutina agregada al ${selectedDay}!`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header and Calendar Nav */}
      <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-500" />
                Asistente Mágico
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
                Describe una rutina y la IA creará los pictogramas. Selecciona la semana correcta abajo para guardar.
            </p>
          </div>
          <CalendarNavigation />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-4">
        <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Crear una rutina para calmarse cuando está enojado..."
            className="w-full p-4 border border-slate-300 rounded-xl h-32 focus:ring-2 focus:ring-brand-primary outline-none resize-none bg-white text-slate-900 placeholder:text-slate-400"
        />
        
        <div className="flex justify-end">
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 transition-all hover:bg-brand-secondary"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generar Rutina
            </button>
        </div>
      </div>

      {/* Results Preview */}
      {generatedItems.length > 0 && (
          <div className="bg-pastel-purple p-6 rounded-2xl border border-purple-200 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-purple-900 mb-4">Vista Previa (Toca para editar iconos):</h3>
            <div className="space-y-3 mb-6">
                {generatedItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setEditingItemIndex(idx)}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:border-brand-primary border-2 border-transparent transition-all group"
                        title="Haz clic para cambiar el pictograma"
                    >
                        <div className="p-2 bg-purple-100 rounded-lg h-16 w-16 flex items-center justify-center overflow-hidden relative">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.label} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.iconName} size={24} />
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{item.label}</p>
                            <div className="flex gap-2">
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 rounded-full">{item.category}</span>
                                {item.arasaacKeyword && <span className="text-xs text-slate-400 italic">Clave: {item.arasaacKeyword}</span>}
                            </div>
                        </div>
                        {item.time && <span className="text-xs font-mono font-bold text-slate-400">{item.time}</span>}
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-bold text-purple-800 whitespace-nowrap">Guardar en:</span>
                    <div className="relative w-full">
                        <select 
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="w-full appearance-none bg-white border border-purple-200 text-slate-900 rounded-lg pl-3 pr-8 py-2 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                        >
                            {DAYS_ORDER.map(d => {
                                const locked = isDayLocked(d);
                                return (
                                    <option key={d} value={d} disabled={locked} className={locked ? "text-slate-400" : "text-slate-900"}>
                                        {d} {locked ? '(Pasado)' : ''}
                                    </option>
                                )
                            })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-600">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                
                {isDayLocked(selectedDay) && (
                     <span className="text-xs text-red-500 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                        <Lock size={12} /> Día pasado
                     </span>
                )}

                <button 
                    onClick={handleApply}
                    disabled={isDayLocked(selectedDay)}
                    className="w-full sm:w-auto ml-auto bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                    Confirmar y Guardar <ArrowRight size={16} />
                </button>
            </div>
          </div>
      )}

      {editingItemIndex !== null && (
          <PictogramSelectorModal 
            onSelect={handleUpdateItemPictogram}
            onClose={() => setEditingItemIndex(null)}
          />
      )}
    </div>
  );
};