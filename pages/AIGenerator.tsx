
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Sun, Sunset, Moon, Send, Eraser, PlusCircle, MessageSquareText, HelpCircle, Calendar } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';

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
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [translatedPics, setTranslatedPics] = useState<PictogramData[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getLocalDateKey());
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');

  const aistudio = (window as any).aistudio;

  const handleTranslate = async () => {
    if (!inputText.trim() || loading) return;

    // Gestión de API Key
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
                  label: kw,
                  arasaacId: results[0]._id,
                  category: Category.HOME,
                  bgColor: 'bg-white border-2 border-brand-primary/20'
              } as PictogramData;
          }
          return null;
      }));

      setTranslatedPics(pics.filter(p => p !== null) as PictogramData[]);
    } catch (e) {
      console.error(e);
      alert("No se pudo realizar la traducción en este momento.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    inputText && setInputText('');
    setTranslatedPics([]);
  };

  const handleAddToSchedule = () => {
    if (translatedPics.length === 0) return;

    const newActivities: Activity[] = translatedPics.map((pic, idx) => {
        addPictogram(pic);
        return {
            id: crypto.randomUUID(),
            pictogramId: pic.id,
            customLabel: pic.label,
            time: "", // Sin hora fija para bloques de traducción
            period: selectedPeriod,
            isDone: false
        };
    });

    setSchedule(prev => ({
        ...prev,
        [selectedDayKey]: [...(prev[selectedDayKey] || []), ...newActivities]
    }));

    alert("¡Pictogramas añadidos a tu agenda!");
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
        <p className="text-slate-500 max-w-lg mx-auto">Escribe cualquier frase y la IA la convertirá automáticamente en pictogramas para tu agenda.</p>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 space-y-4">
        <div className="relative">
            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe aquí, ej: 'Mañana quiero ir al parque a jugar con mamá'..."
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl h-32 focus:border-brand-primary outline-none resize-none text-xl font-medium text-slate-700 placeholder:text-slate-300 transition-all"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                    onClick={handleClear}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Limpiar"
                >
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

      {/* Translation Result */}
      {translatedPics.length > 0 && (
          <div className="space-y-6 animate-in zoom-in-95">
              <div className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl overflow-x-auto">
                  <div className="flex items-center gap-6 min-w-max pb-4">
                      {translatedPics.map((pic, idx) => (
                          <div key={pic.id} className="flex flex-col items-center gap-3 animate-in slide-in-from-left" style={{ animationDelay: `${idx * 100}ms` }}>
                              <div className="w-24 h-24 bg-slate-50 border-2 border-indigo-50 rounded-2xl flex items-center justify-center p-2 shadow-sm">
                                  <img src={getArasaacImageUrl(pic.arasaacId!)} alt={pic.label} className="w-full h-full object-contain" />
                              </div>
                              <span className="text-sm font-black text-slate-600 uppercase tracking-wide">{pic.label}</span>
                              {idx < translatedPics.length - 1 && (
                                  <div className="absolute -right-4 top-10 text-slate-200" aria-hidden="true">
                                      <ArrowRight size={16} />
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              {/* Integration Controls */}
              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-indigo-800 pb-4">
                      <PlusCircle className="text-indigo-400" />
                      <h3 className="text-xl font-bold">¿Quieres añadir esta frase a tu agenda?</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                          {/* Added Calendar import from lucide-react to fix missing name error */}
                          <label className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2"><Calendar size={14} /> Seleccionar Día</label>
                          <div className="flex flex-wrap gap-2">
                              {weekDates.map(date => {
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
                          <label className="text-xs font-black uppercase text-indigo-300 flex items-center gap-2"><Sunset size={14} /> Momento</label>
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
                      Integrar Frase en Agenda <ArrowRight size={24} />
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
                      <h4 className="font-bold text-blue-900">¿Cómo funciona?</h4>
                      <p className="text-sm text-blue-700 mt-1">Escribe lo que quieras hacer hoy. La IA entiende el contexto y busca los pictogramas correctos.</p>
                  </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl h-fit"><HelpCircle /></div>
                  <div>
                      <h4 className="font-bold text-amber-900">Ejemplos útiles</h4>
                      <p className="text-sm text-amber-700 mt-1">Prueba con: "A las cinco voy a clases de pintura" o "Tengo que lavarme los dientes después de comer".</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
