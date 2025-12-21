
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Sun, Sunset, Moon, Send, Eraser, PlusCircle, MessageSquareText, HelpCircle, Calendar, Pencil, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

const getLocalDateKey = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const spanishMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface EditablePic extends PictogramData {
    time: string;
}

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule, weekDates } = useApp();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [translatedPics, setTranslatedPics] = useState<EditablePic[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getLocalDateKey());
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const todayKey = getLocalDateKey();
  const aistudio = (window as any).aistudio;

  // Filtrar fechas para mostrar solo hoy y futuro
  const futureDates = weekDates.filter(date => getLocalDateKey(date) >= todayKey);

  const handleTranslate = async () => {
    if (!inputText.trim() || loading) return;

    if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) await aistudio.openSelectKey();
    }

    setLoading(true);
    try {
      const keywords = await translateTextToKeywords(inputText);
      
      const pics = await Promise.all(keywords.map(async (kw) => {
          const results = await searchArasaac(kw);
          if (results && results.length > 0) {
              return {
                  id: `ai-${crypto.randomUUID()}`,
                  label: kw.toUpperCase(),
                  arasaacId: results[0]._id,
                  category: Category.HOME,
                  bgColor: 'bg-white border-2 border-brand-primary/20',
                  time: "" 
              } as EditablePic;
          }
          return null;
      }));

      setTranslatedPics(pics.filter(p => p !== null) as EditablePic[]);
    } catch (e) {
      console.error(e);
      alert("No se pudo realizar la traducción.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedPics([]);
  };

  const updatePicTime = (index: number, time: string) => {
      const newList = [...translatedPics];
      newList[index] = { ...newList[index], time };
      setTranslatedPics(newList);
  };

  const removePic = (index: number) => {
      setTranslatedPics(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePictogram = (newPic: PictogramData) => {
      if (editingIndex === null) return;
      const newList = [...translatedPics];
      newList[editingIndex] = { 
          ...newList[editingIndex], 
          arasaacId: newPic.arasaacId, 
          label: newPic.label,
          iconName: newPic.iconName 
      };
      setTranslatedPics(newList);
      setEditingIndex(null);
  };

  const handleAddToSchedule = () => {
    if (translatedPics.length === 0) return;

    if (selectedDayKey < todayKey) {
        alert("Por seguridad, solo puedes añadir actividades al día de hoy o fechas futuras.");
        return;
    }

    const newActivities: Activity[] = translatedPics.map((pic) => {
        addPictogram(pic);
        return {
            id: crypto.randomUUID(),
            pictogramId: pic.id,
            customLabel: pic.label,
            time: pic.time,
            period: selectedPeriod,
            isDone: false
        };
    });

    setSchedule(prev => {
        const existing = prev[selectedDayKey] || [];
        const combined = [...existing, ...newActivities];
        // Ordenar por hora si hay horas definidas
        combined.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        return { ...prev, [selectedDayKey]: combined };
    });

    alert("¡Pictogramas personalizados añadidos a tu agenda!");
    handleClear();
  };

  const getDayDetails = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    return { dayName: spanishDays[d.getDay()], dayNum: d.getDate() };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-200">
            <Sparkles size={16} /> PictoTraductor Inteligente
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Asistente AI</h2>
        <p className="text-slate-500 max-w-lg mx-auto">Escribe una frase y personaliza cada pictograma antes de guardarlo en tu agenda.</p>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-4">
        <div className="relative">
            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ej: 'Hoy quiero ir a la piscina a las cinco con papá'..."
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl h-32 focus:border-brand-primary outline-none resize-none text-xl font-medium text-slate-700 placeholder:text-slate-300 transition-all"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Limpiar">
                    <Eraser size={24} />
                </button>
                <button 
                    onClick={handleTranslate}
                    disabled={loading || !inputText.trim()}
                    className="bg-brand-primary text-white p-3 rounded-xl shadow-lg shadow-brand-primary/30 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </button>
            </div>
        </div>
      </div>

      {/* Translation Result and Customization */}
      {translatedPics.length > 0 && (
          <div className="space-y-6 animate-in zoom-in-95">
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-xl">
                  <h3 className="text-sm font-black text-indigo-900 uppercase mb-4 flex items-center gap-2">
                      <Pencil size={14} /> Paso 1: Personaliza tu secuencia
                  </h3>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4 px-2">
                      {translatedPics.map((pic, idx) => (
                          <div key={pic.id} className="relative flex flex-col items-center gap-2 group min-w-[120px]">
                              <div className="relative w-24 h-24 bg-slate-50 border-2 border-indigo-50 rounded-2xl flex items-center justify-center p-2 shadow-sm group-hover:border-brand-primary transition-all">
                                  <img src={getArasaacImageUrl(pic.arasaacId!)} alt={pic.label} className="w-full h-full object-contain" />
                                  <button 
                                    onClick={() => setEditingIndex(idx)}
                                    className="absolute -top-2 -right-2 bg-white text-brand-primary p-1.5 rounded-full shadow-md border border-indigo-100 hover:bg-brand-primary hover:text-white transition-all"
                                    title="Cambiar imagen"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button 
                                    onClick={() => removePic(idx)}
                                    className="absolute -bottom-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-red-100 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                              </div>
                              <input 
                                type="text"
                                value={pic.label}
                                onChange={(e) => {
                                    const newList = [...translatedPics];
                                    newList[idx].label = e.target.value.toUpperCase();
                                    setTranslatedPics(newList);
                                }}
                                className="text-[10px] font-black text-center text-slate-600 uppercase w-full bg-transparent border-none outline-none focus:text-brand-primary"
                              />
                              <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                  <Clock size={10} className="text-indigo-400" />
                                  <input 
                                    type="time"
                                    value={pic.time}
                                    onChange={(e) => updatePicTime(idx, e.target.value)}
                                    className="bg-transparent text-[10px] font-bold text-indigo-700 outline-none w-14"
                                  />
                              </div>
                              {idx < translatedPics.length - 1 && (
                                  <div className="absolute -right-3 top-10 text-slate-200">
                                      <ArrowRight size={14} />
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              {/* Integration Controls */}
              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-indigo-800 pb-4">
                      <CheckCircle2 className="text-green-400" />
                      <h3 className="text-xl font-bold">Paso 2: ¿Dónde quieres añadir esta frase?</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                          <label className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2"><Calendar size={14} /> Seleccionar Día (Hoy o Futuro)</label>
                          <div className="flex flex-wrap gap-2">
                              {futureDates.map(date => {
                                  const key = getLocalDateKey(date);
                                  const isSelected = selectedDayKey === key;
                                  const details = getDayDetails(key);
                                  return (
                                      <button 
                                          key={key} 
                                          onClick={() => setSelectedDayKey(key)}
                                          className={`px-4 py-2 rounded-xl border-2 transition-all flex flex-col items-center min-w-[70px] ${isSelected ? 'border-white bg-white text-indigo-900 shadow-lg' : 'border-indigo-800 text-indigo-400 hover:border-indigo-600'}`}
                                      >
                                          <span className="text-[10px] font-black uppercase">{details.dayName.slice(0,3)}</span>
                                          <span className="text-lg font-bold">{details.dayNum}</span>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2"><Sunset size={14} /> Momento del Día</label>
                          <div className="flex bg-indigo-950 p-1 rounded-2xl border border-indigo-800">
                              {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
                                  <button 
                                      key={p}
                                      onClick={() => setSelectedPeriod(p)}
                                      className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedPeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-500'}`}
                                  >
                                      {p === 'morning' ? <Sun size={18} /> : p === 'afternoon' ? <Sunset size={18} /> : <Moon size={18} />}
                                      <span className="text-[10px] font-bold uppercase">{p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={handleAddToSchedule}
                      className="w-full py-5 bg-white text-indigo-900 rounded-2xl text-xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-indigo-50"
                  >
                      Integrar en mi Agenda Visual <ArrowRight size={24} />
                  </button>
              </div>
          </div>
      )}

      {/* Help / Empty State */}
      {!translatedPics.length && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl h-fit"><MessageSquareText /></div>
                  <div>
                      <h4 className="font-bold text-blue-900">Escribe con libertad</h4>
                      <p className="text-sm text-blue-700 mt-1">La IA filtrará conectores y se quedará con los conceptos visuales clave para tu agenda.</p>
                  </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl h-fit"><HelpCircle /></div>
                  <div>
                      <h4 className="font-bold text-amber-900">Protección de Datos</h4>
                      <p className="text-sm text-amber-700 mt-1">Solo puedes añadir frases a partir de hoy. Las rutinas pasadas se mantienen seguras como historial.</p>
                  </div>
              </div>
          </div>
      )}

      {editingIndex !== null && (
          <PictogramSelectorModal 
            onSelect={handleUpdatePictogram} 
            onClose={() => setEditingIndex(null)} 
          />
      )}
    </div>
  );
};
