import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Sun, Sunset, Moon, Wand2, Key, Info } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

const getLocalDateKey = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const spanishMonths = ['Enero', 'Febrero', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule, weekDates } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [apiKeySelected, setApiKeySelected] = useState(true);
  
  const todayKey = getLocalDateKey();
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const aistudio = (window as any).aistudio;

  useEffect(() => {
    const checkKey = async () => {
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkKey();
  }, [aistudio]);

  const handleOpenKeySelector = async () => {
    if (aistudio) {
      await aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        await handleOpenKeySelector();
        return; // Detener para que el usuario seleccione la clave
    }

    setLoading(true);
    setGeneratedItems([]);
    
    try {
      const items = await generateRoutine(prompt);
      const enhancedItems = await Promise.all(items.map(async (item) => {
        let arasaacId = undefined;
        if (item.arasaacKeyword) {
          try {
            const results = await searchArasaac(item.arasaacKeyword);
            if (results && results.length > 0) {
              arasaacId = results[0]._id;
            }
          } catch (e) {
            console.warn("No pictograma:", item.arasaacKeyword);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedItems(enhancedItems);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('API key') || e.message?.includes('not found')) {
        setApiKeySelected(false);
      } else {
        alert(`Error al generar la rutina: ${e.message || 'Error de conexión'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemPictogram = (pic: PictogramData) => {
      if (editingItemIndex === null) return;
      const updatedItems = [...generatedItems];
      updatedItems[editingItemIndex] = {
          ...updatedItems[editingItemIndex],
          arasaacId: pic.arasaacId,
          iconName: pic.iconName,
          label: pic.label 
      };
      setGeneratedItems(updatedItems);
      setEditingItemIndex(null);
  };

  const handleApply = () => {
    if (generatedItems.length === 0 || !selectedDayKey) return;
    
    const newActivities: Activity[] = generatedItems.map(item => {
        const newPic: PictogramData = {
            id: crypto.randomUUID(),
            label: item.label,
            iconName: item.iconName,
            arasaacId: item.arasaacId,
            category: item.category as Category,
            bgColor: 'bg-white border-2 border-indigo-200'
        };
        addPictogram(newPic);

        return {
            id: crypto.randomUUID(),
            pictogramId: newPic.id,
            customLabel: item.label,
            time: item.time || '00:00',
            period: (item.period as TimePeriod) || 'morning',
            isDone: false
        };
    });

    setSchedule(prev => ({
        ...prev,
        [selectedDayKey]: [...(prev[selectedDayKey] || []), ...newActivities]
    }));
    
    setGeneratedItems([]);
    setPrompt('');
    alert(`¡Rutina guardada con éxito!`);
  };

  const getDayDetails = (dateStr: string) => {
      if (!dateStr) return { dayName: '', fullDate: '' };
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      return {
          dayName: spanishDays[d.getDay()],
          fullDate: `${d.getDate()} de ${spanishMonths[d.getMonth()]}`
      };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-200">
            <Wand2 size={16} /> Modo Sencillo
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Asistente Mágico (IA)</h2>
        <p className="text-slate-500">Dile a la IA qué rutina necesitas crear.</p>
      </div>

      {!apiKeySelected && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-3xl flex flex-col items-center gap-4 text-center">
          <Key className="text-indigo-500" size={32} />
          <div>
            <h3 className="font-bold text-indigo-900">Configuración Requerida</h3>
            <p className="text-indigo-700 text-sm mt-1">Para usar el asistente, debes conectar tu cuenta de Google AI.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs underline text-indigo-400 block mt-2">¿Por qué es necesario?</a>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform"
          >
            Configurar Conexión Mágica
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-5">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">¿Qué rutina quieres crear?</label>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Rutina de mañana para el cole..."
                className="w-full p-4 border-2 border-slate-100 rounded-2xl h-32 focus:border-brand-primary outline-none resize-none bg-slate-50 text-slate-800 text-lg"
            />
        </div>
        
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
                {['Ducharse', 'Ir al cole'].map(suggestion => (
                    <button 
                        key={suggestion}
                        onClick={() => setPrompt(`Crear rutina para ${suggestion.toLowerCase()}`)}
                        className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full hover:bg-slate-200"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95 transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generar
            </button>
        </div>
      </div>

      {generatedItems.length > 0 && (
          <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-indigo-900">Pasos Sugeridos:</h3>
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Toca para cambiar imagen</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {generatedItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setEditingItemIndex(idx)}
                        className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:ring-2 hover:ring-brand-primary"
                    >
                        <div className="p-1 bg-slate-50 rounded-xl h-14 w-14 flex items-center justify-center overflow-hidden border">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.label} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.iconName} size={24} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.label}</p>
                            <span className="text-[10px] font-black uppercase bg-indigo-100 px-2 py-0.5 rounded text-indigo-600">
                                {item.period === 'morning' ? 'Mañana' : item.period === 'afternoon' ? 'Tarde' : 'Noche'}
                            </span>
                        </div>
                        <span className="text-sm font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{item.time}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <p className="text-sm font-bold text-slate-700">Día de la semana:</p>
                <div className="flex flex-wrap gap-2">
                    {weekDates.map(date => {
                        const key = getLocalDateKey(date);
                        const isSelected = selectedDayKey === key;
                        const details = getDayDetails(key);
                        return (
                            <button 
                                key={key}
                                onClick={() => setSelectedDayKey(key)}
                                className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-slate-100 text-slate-400'}`}
                            >
                                <span className="text-[10px] font-black uppercase">{details.dayName}</span>
                                <span className="text-lg font-bold">{date.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
                <button 
                    onClick={handleApply}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                    Guardar en mi Agenda <ArrowRight size={20} />
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