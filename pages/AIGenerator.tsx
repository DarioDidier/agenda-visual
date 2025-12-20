import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Sun, Sunset, Moon, Wand2, Key, Baby, Calendar, HeartPulse, MessageSquareQuote, Info } from 'lucide-react';
import { generateRoutine, RoutineParams } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod, SupportLevel, DayType } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

const getLocalDateKey = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const spanishMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule, weekDates } = useApp();
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [apiKeySelected, setApiKeySelected] = useState(true);
  
  // Estados del Formulario
  const [age, setAge] = useState<number>(6);
  const [dayType, setDayType] = useState<DayType>(DayType.HOME); // Por defecto "Casa"
  const [supportLevel, setSupportLevel] = useState<SupportLevel>(SupportLevel.MEDIUM);
  const [extraInfo, setExtraInfo] = useState('');

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
    if (loading) return;
    
    // Verificación de API Key siguiendo lineamientos de la plataforma
    if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
            // Si no hay llave, abrimos el selector y procedemos de inmediato (mitigación de carrera)
            await aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    }

    setLoading(true);
    setGeneratedItems([]);
    
    try {
      const params: RoutineParams = {
        age,
        dayType,
        supportLevel,
        additionalInfo: extraInfo
      };

      // Llamamos al servicio (instancia GoogleGenAI internamente)
      const items = await generateRoutine(params);
      
      const enhancedItems = await Promise.all(items.map(async (item) => {
        let arasaacId = undefined;
        if (item.arasaacKeyword) {
          try {
            const results = await searchArasaac(item.arasaacKeyword);
            if (results && results.length > 0) {
              arasaacId = results[0]._id;
            }
          } catch (e) {
            console.warn("No se encontró pictograma para:", item.arasaacKeyword);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedItems(enhancedItems);
    } catch (e: any) {
      console.error("Error al generar rutina:", e);
      // Si falla por falta de llave o error de entidad, pedimos re-seleccionar
      if (e.message?.includes('API key') || e.message?.includes('not found')) {
        setApiKeySelected(false);
        if (aistudio) await aistudio.openSelectKey();
      } else {
        alert(`Error: ${e.message || 'No se pudo conectar con el asistente.'}`);
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
    setExtraInfo('');
    alert(`¡Rutina aplicada correctamente!`);
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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-1.5 rounded-full text-sm font-bold border border-brand-primary/20">
            <Sparkles size={16} /> Motor Inteligente Gratuito
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Asistente de Rutinas</h2>
        <p className="text-slate-500">Crea rutinas mágicas y adaptadas para cada día.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Edad */}
            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Baby size={14} /> Edad</label>
                <div className="flex items-center gap-3">
                    <input 
                        type="range" min="3" max="15" value={age} 
                        onChange={(e) => setAge(parseInt(e.target.value))}
                        className="flex-1 accent-brand-primary"
                    />
                    <span className="font-bold text-lg text-brand-primary w-8">{age}</span>
                </div>
            </div>

            {/* Tipo de día */}
            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Calendar size={14} /> Tipo de Día</label>
                <select 
                    value={dayType} onChange={(e) => setDayType(e.target.value as DayType)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary"
                >
                    <option value={DayType.HOME}>Casa</option>
                    <option value={DayType.SCHOOL}>Escuela</option>
                    <option value={DayType.WEEKEND}>Fin de semana</option>
                    <option value={DayType.VACATION}>Vacaciones</option>
                </select>
            </div>

            {/* Nivel de Apoyo */}
            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><HeartPulse size={14} /> Apoyo</label>
                <select 
                    value={supportLevel} onChange={(e) => setSupportLevel(e.target.value as SupportLevel)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary"
                >
                    <option value={SupportLevel.LOW}>Bajo</option>
                    <option value={SupportLevel.MEDIUM}>Medio</option>
                    <option value={SupportLevel.HIGH}>Alto (Pasos breves)</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><MessageSquareQuote size={14} /> Detalles adicionales (Opcional)</label>
            <textarea 
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Ej: Incluir lavarse las manos antes de comer, juego libre por la tarde..."
                className="w-full p-4 border rounded-2xl h-24 focus:border-brand-primary outline-none resize-none bg-slate-50 text-slate-800 text-sm"
            />
        </div>
        
        <div className="pt-2">
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-brand-primary/20 active:scale-95 transition-all text-lg"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                {loading ? 'Consultando a la IA...' : 'Crear Rutina Automáticamente'}
            </button>
            {!apiKeySelected && (
                <p className="text-[10px] text-red-500 mt-2 text-center font-bold">
                    Se requiere configurar una API Key de Google Cloud (Pago por uso o capa gratuita).
                </p>
            )}
        </div>
      </div>

      {generatedItems.length > 0 && (
          <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={18} /> Sugerencia Generada
                </h3>
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Toca un paso para cambiar la imagen</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {generatedItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setEditingItemIndex(idx)}
                        className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:ring-2 hover:ring-brand-primary group transition-all"
                    >
                        <div className="p-1 bg-slate-50 rounded-xl h-16 w-16 flex items-center justify-center overflow-hidden border group-hover:bg-indigo-50 transition-colors">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.label} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.iconName} size={28} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 italic">{item.description}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase bg-indigo-100 px-2 py-0.5 rounded text-indigo-600 flex items-center gap-1">
                                    {item.period === 'morning' ? <Sun size={10} /> : item.period === 'afternoon' ? <Sunset size={10} /> : <Moon size={10} />}
                                    {item.period === 'morning' ? 'Mañana' : item.period === 'afternoon' ? 'Tarde' : 'Noche'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <p className="text-sm font-bold text-slate-700">Asignar a mi Agenda:</p>
                <div className="flex flex-wrap gap-2">
                    {weekDates.map(date => {
                        const key = getLocalDateKey(date);
                        const isSelected = selectedDayKey === key;
                        const details = getDayDetails(key);
                        return (
                            <button 
                                key={key}
                                onClick={() => setSelectedDayKey(key)}
                                className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <span className="text-[10px] font-black uppercase">{details.dayName}</span>
                                <span className="text-lg font-bold">{date.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
                <button 
                    onClick={handleApply}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
                >
                    Integrar en mi Agenda Visual <ArrowRight size={20} />
                </button>
            </div>
          </div>
      )}

      {!apiKeySelected && (
          <div className="mt-8 bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex flex-col items-center gap-4 text-center">
              <Key className="text-amber-500" size={32} />
              <div>
                  <h3 className="font-bold text-amber-900">Configuración de IA necesaria</h3>
                  <p className="text-amber-700 text-sm mt-1">Para habilitar el asistente automático, debes seleccionar un proyecto con facturación habilitada o usar la capa gratuita de Google AI Studio.</p>
              </div>
              <button 
                  onClick={handleOpenKeySelector}
                  className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
              >
                  Vincular API Key
              </button>
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