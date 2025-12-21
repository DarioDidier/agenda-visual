
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Sun, Sunset, Moon, Wand2, Key, Baby, Calendar, HeartPulse, MessageSquareQuote, Info, CheckCircle2 } from 'lucide-react';
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
  const [generatedData, setGeneratedData] = useState<{ dia: string, rutina: any[] } | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(true);
  
  // Estados del Formulario
  const [age, setAge] = useState<number>(6);
  const [dayType, setDayType] = useState<DayType>(DayType.HOME);
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
    
    // Mitigación de carrera: Abrir selector si no hay clave pero continuar
    if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await aistudio.openSelectKey();
            setApiKeySelected(true);
            // Continuamos sin detener el flujo
        }
    }

    setLoading(true);
    setGeneratedData(null);
    
    try {
      const params: RoutineParams = { age, dayType, supportLevel, additionalInfo: extraInfo };
      const result = await generateRoutine(params);
      
      const enhancedRoutine = await Promise.all(result.rutina.map(async (item: any) => {
        let arasaacId = undefined;
        if (item.pictograma) {
          try {
            const results = await searchArasaac(item.pictograma);
            if (results && results.length > 0) {
              arasaacId = results[0]._id;
            }
          } catch (e) {
            console.warn("No se encontró pictograma:", item.pictograma);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedData({ dia: result.dia, rutina: enhancedRoutine });
    } catch (e: any) {
      console.error("Error al generar:", e);
      if (e.message?.includes('API key') || e.message?.includes('not found')) {
        setApiKeySelected(false);
        if (aistudio) await aistudio.openSelectKey();
      } else {
        alert(`Error del motor inteligente: ${e.message || 'Error de conexión'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemPictogram = (pic: PictogramData) => {
      if (editingItemIndex === null || !generatedData) return;
      const updatedRoutine = [...generatedData.rutina];
      updatedRoutine[editingItemIndex] = {
          ...updatedRoutine[editingItemIndex],
          arasaacId: pic.arasaacId,
          icono_lucide: pic.iconName,
          actividad: pic.label 
      };
      setGeneratedData({ ...generatedData, rutina: updatedRoutine });
      setEditingItemIndex(null);
  };

  const handleApply = () => {
    if (!generatedData || !selectedDayKey) return;
    
    const newActivities: Activity[] = generatedData.rutina.map(item => {
        const newPic: PictogramData = {
            id: crypto.randomUUID(),
            label: item.actividad,
            iconName: item.icono_lucide,
            arasaacId: item.arasaacId,
            category: (item.categoria as Category) || Category.HOME,
            bgColor: 'bg-white border-2 border-indigo-200'
        };
        addPictogram(newPic);

        return {
            id: crypto.randomUUID(),
            pictogramId: newPic.id,
            customLabel: item.actividad,
            time: item.hora || '00:00',
            period: (item.periodo as TimePeriod) || 'morning',
            isDone: false,
            notes: item.descripcion
        };
    });

    setSchedule(prev => ({
        ...prev,
        [selectedDayKey]: [...(prev[selectedDayKey] || []), ...newActivities]
    }));
    
    setGeneratedData(null);
    setExtraInfo('');
    alert(`¡Rutina para el ${generatedData.dia} aplicada con éxito!`);
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
        <h2 className="text-3xl font-bold text-slate-800">Asistente Mágico de Rutinas</h2>
        <p className="text-slate-500">Genera agendas visuales claras y adaptadas en segundos.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Baby size={14} /> Edad</label>
                <div className="flex items-center gap-3">
                    <input type="range" min="3" max="15" value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="flex-1 accent-brand-primary" />
                    <span className="font-bold text-lg text-brand-primary w-8">{age}</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Calendar size={14} /> Tipo de Día</label>
                <select value={dayType} onChange={(e) => setDayType(e.target.value as DayType)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary">
                    <option value={DayType.HOME}>Casa</option>
                    <option value={DayType.SCHOOL}>Escuela</option>
                    <option value={DayType.WEEKEND}>Fin de semana</option>
                    <option value={DayType.VACATION}>Vacaciones</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><HeartPulse size={14} /> Apoyo</label>
                <select value={supportLevel} onChange={(e) => setSupportLevel(e.target.value as SupportLevel)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary">
                    <option value={SupportLevel.LOW}>Bajo</option>
                    <option value={SupportLevel.MEDIUM}>Medio</option>
                    <option value={SupportLevel.HIGH}>Alto (Pasos breves)</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><MessageSquareQuote size={14} /> Detalles específicos</label>
            <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="Ej: Incluir lavarse las manos antes de comer, evitar ruidos fuertes..." className="w-full p-4 border rounded-2xl h-24 focus:border-brand-primary outline-none resize-none bg-slate-50 text-slate-800 text-sm" />
        </div>
        
        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-brand-primary/20 active:scale-95 transition-all text-lg"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
            {loading ? 'Consultando al asistente...' : 'Crear Rutina Automáticamente'}
        </button>
      </div>

      {generatedData && (
          <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" size={18} /> Sugerencia para el {generatedData.dia}
                    </h3>
                    <p className="text-xs text-indigo-400">Toca un pictograma para cambiar su imagen si no te gusta.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {generatedData.rutina.map((item, idx) => (
                    <div key={idx} onClick={() => setEditingItemIndex(idx)} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:ring-2 hover:ring-brand-primary group transition-all">
                        <div className="p-1 bg-slate-50 rounded-xl h-16 w-16 flex items-center justify-center overflow-hidden border group-hover:bg-indigo-50 transition-colors">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.actividad} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.icono_lucide} size={28} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.actividad}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 italic">{item.descripcion}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase bg-indigo-100 px-2 py-0.5 rounded text-indigo-600 flex items-center gap-1">
                                    {item.periodo === 'morning' ? <Sun size={10} /> : item.periodo === 'afternoon' ? <Sunset size={10} /> : <Moon size={10} />}
                                    {item.periodo === 'morning' ? 'Mañana' : item.periodo === 'afternoon' ? 'Tarde' : 'Noche'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{item.hora}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 space-y-4">
                <p className="text-sm font-bold text-slate-700">Guardar en mi Agenda para el día:</p>
                <div className="flex flex-wrap gap-2">
                    {weekDates.map(date => {
                        const key = getLocalDateKey(date);
                        const isSelected = selectedDayKey === key;
                        const details = getDayDetails(key);
                        return (
                            <button key={key} onClick={() => setSelectedDayKey(key)} className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                <span className="text-[10px] font-black uppercase">{details.dayName}</span>
                                <span className="text-lg font-bold">{date.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
                <button onClick={handleApply} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
                    Integrar en mi Agenda Visual <ArrowRight size={20} />
                </button>
            </div>
          </div>
      )}

      {editingItemIndex !== null && (
          <PictogramSelectorModal onSelect={handleUpdateItemPictogram} onClose={() => setEditingItemIndex(null)} />
      )}
    </div>
  );
};
