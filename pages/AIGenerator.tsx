
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Edit2, Calendar as CalendarIcon, AlertCircle, ChevronDown, Sun, Sunset, Moon, Wand2, Key } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

// Se elimina el bloque declare global que causaba conflicto con la definición existente de AIStudio en el entorno.
// En su lugar, se accede a window.aistudio mediante aserción de tipo 'any' dentro del componente.

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
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [apiKeySelected, setApiKeySelected] = useState(true);
  
  const todayKey = getLocalDateKey();
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Acceso seguro a la API de selección de llaves usando casting a any para evitar conflictos de tipos globales
  const aistudio = (window as any).aistudio;

  useEffect(() => {
    const checkApiKey = async () => {
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkApiKey();
  }, [aistudio]);

  const handleOpenKeySelector = async () => {
    if (aistudio) {
      await aistudio.openSelectKey();
      // Se asume éxito tras abrir el selector según las directrices para mitigar condiciones de carrera
      setApiKeySelected(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Verificar si se requiere selección de API Key
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        await handleOpenKeySelector();
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
            console.warn("No se encontró imagen para", item.arasaacKeyword);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedItems(enhancedItems);
    } catch (e: any) {
      console.error(e);
      // Resetear estado si la entidad no se encuentra (posible llave inválida o expirada)
      if (e.message?.includes('API key is missing') || e.message?.includes('not found')) {
        setApiKeySelected(false);
        alert('Es necesario seleccionar una API Key válida para usar la IA. Por favor, utiliza el botón "Configurar API Key".');
      } else {
        alert(`Lo sentimos, hubo un problema al generar la rutina: ${e.message || 'Error de conexión'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemPictogram = (pic: PictogramData) => {
      if (editingItemIndex === null) return;
      const updatedItems = [...generatedItems];
      const item = updatedItems[editingItemIndex];
      updatedItems[editingItemIndex] = {
          ...item,
          arasaacId: pic.arasaacId,
          iconName: pic.iconName,
          label: pic.label 
      };
      setGeneratedItems(updatedItems);
      setEditingItemIndex(null);
  };

  const handleApply = () => {
    if (generatedItems.length === 0 || !selectedDayKey) return;
    if (selectedDayKey < todayKey) {
        alert("Por favor selecciona una fecha de hoy en adelante.");
        return;
    }

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
    alert(`¡Rutina aplicada con éxito para el ${getDayDetails(selectedDayKey).fullDate}!`);
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

  const getPeriodIcon = (period: string) => {
      switch(period) {
          case 'afternoon': return <Sunset size={16} className="text-orange-500" />;
          case 'evening': return <Moon size={16} className="text-purple-500" />;
          default: return <Sun size={16} className="text-yellow-500" />;
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-200 shadow-sm">
            <Wand2 size={16} /> Modo Sencillo
        </div>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            Asistente Mágico (IA)
        </h2>
        <p className="text-slate-500 leading-relaxed">
            Dile a la IA qué rutina necesitas crear (ej: "Rutina de mañana para ir al cole", "Pasos para lavarse las manos"). Ella buscará los pictogramas y organizará los tiempos por ti.
        </p>
      </div>

      {!apiKeySelected && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl flex flex-col items-center gap-4 animate-in zoom-in-95">
          <Key className="text-red-500" size={40} />
          <div className="text-center">
            <h3 className="font-bold text-red-800">Se requiere una API Key</h3>
            <p className="text-red-600 text-sm">Para usar las funciones de IA, debes seleccionar una clave de API de un proyecto con facturación habilitada.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs underline text-red-500 block mt-1">Ver documentación de facturación</a>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg"
          >
            Configurar API Key
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-5">
        <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">¿Qué rutina quieres crear?</label>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Rutina para vestirse solo por la mañana..."
                className="w-full p-4 border-2 border-slate-100 rounded-2xl h-32 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none resize-none bg-slate-50 text-slate-800 text-lg transition-all"
            />
        </div>
        
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
                {['Ducharse', 'Ir al colegio', 'Tarea'].map(suggestion => (
                    <button 
                        key={suggestion}
                        onClick={() => setPrompt(`Crear rutina para ${suggestion.toLowerCase()}`)}
                        className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-primary/30 active:scale-95 transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generar
            </button>
        </div>
      </div>

      {generatedItems.length > 0 && (
          <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-indigo-900">Resultado Sugerido:</h3>
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Toca un item para cambiar su imagen</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
                {generatedItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setEditingItemIndex(idx)}
                        className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:ring-2 hover:ring-brand-primary transition-all group"
                    >
                        <div className="p-1 bg-slate-50 rounded-xl h-14 w-14 flex items-center justify-center overflow-hidden relative border">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.label} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.iconName} size={24} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.label}</p>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-indigo-100 px-2 py-0.5 rounded-md text-indigo-600">
                                    {getPeriodIcon(item.period || 'morning')}
                                    {item.period === 'morning' ? 'Mañana' : item.period === 'afternoon' ? 'Tarde' : 'Noche'}
                                </span>
                            </div>
                        </div>
                        {item.time && <span className="text-sm font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border">{item.time}</span>}
                    </div>
                ))}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <p className="text-sm font-bold text-slate-700">¿Para qué día de la semana es esta rutina?</p>
                
                <div className="flex flex-wrap gap-2">
                    {weekDates.map(date => {
                        const key = getLocalDateKey(date);
                        const isSelected = selectedDayKey === key;
                        const details = getDayDetails(key);
                        return (
                            <button 
                                key={key}
                                onClick={() => setSelectedDayKey(key)}
                                className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-brand-primary bg-blue-50 text-brand-primary ring-4 ring-blue-50' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <span className="text-[10px] font-black uppercase">{details.dayName}</span>
                                <span className="text-lg font-bold">{date.getDate()}</span>
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={handleApply}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
                >
                    Confirmar y Guardar Agenda
                    <ArrowRight size={20} />
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
