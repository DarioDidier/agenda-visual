
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
      alert("Error en la traducción.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setInputText(''); setTranslatedPics([]); };

  const handleAddToSchedule = () => {
    if (translatedPics.length === 0) return;
    const newActivities: Activity[] = translatedPics.map((pic) => {
        addPictogram(pic);
        return { id: crypto.randomUUID(), pictogramId: pic.id, customLabel: pic.label, time: pic.time, period: selectedPeriod, isDone: false };
    });
    setSchedule(prev => {
        const combined = [...(prev[selectedDayKey] || []), ...newActivities];
        combined.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        return { ...prev, [selectedDayKey]: combined };
    });
    alert("¡Rutina integrada con éxito!");
    handleClear();
  };

  const getDayDetails = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    return { dayName: spanishDays[d.getDay()], dayNum: d.getDate() };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full text-sm font-black border border-indigo-200">
            <Sparkles size={20} className="animate-pulse" /> PICTOTRADUCTOR INTELIGENTE
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Asistente AI</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">Escribe frases naturales y deja que la inteligencia artificial encuentre la secuencia visual perfecta para tu agenda.</p>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl border-2 border-slate-100 space-y-6">
        <div className="relative">
            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ej: 'Mañana tengo fútbol a las seis después de la merienda'..."
                className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[30px] h-48 focus:border-brand-primary outline-none resize-none text-2xl font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
            />
            <div className="absolute bottom-6 right-6 flex gap-4">
                <button onClick={handleClear} className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Limpiar">
                    <Eraser size={28} />
                </button>
                <button 
                    onClick={handleTranslate}
                    disabled={loading || !inputText.trim()}
                    className="bg-brand-primary text-white px-8 py-4 rounded-2xl shadow-xl shadow-brand-primary/30 active:scale-95 transition-all disabled:opacity-50 font-black flex items-center gap-3 text-lg"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    {loading ? 'Traduciendo...' : 'Convertir'}
                </button>
            </div>
        </div>
      </div>

      {translatedPics.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
              <div className="xl:col-span-2 bg-white p-8 rounded-[40px] border-2 border-indigo-100 shadow-xl overflow-x-auto">
                  <h3 className="text-xs font-black text-indigo-900 uppercase mb-8 tracking-widest flex items-center gap-2">
                      <Pencil size={16} /> 1. Personaliza la secuencia
                  </h3>
                  <div className="flex items-center gap-8 min-w-max pb-6 px-2">
                      {translatedPics.map((pic, idx) => (
                          <div key={pic.id} className="relative flex flex-col items-center gap-4 group">
                              <div className="relative w-32 h-32 bg-slate-50 border-2 border-indigo-50 rounded-[28px] flex items-center justify-center p-4 shadow-sm group-hover:border-brand-primary group-hover:shadow-lg transition-all">
                                  <img src={getArasaacImageUrl(pic.arasaacId!)} alt={pic.label} className="w-full h-full object-contain" />
                                  <div className="absolute -top-3 -right-3 flex flex-col gap-2">
                                      <button onClick={() => setEditingIndex(idx)} className="bg-white text-brand-primary p-2 rounded-xl shadow-lg border border-indigo-50 hover:bg-brand-primary hover:text-white transition-all">
                                          <Pencil size={16} />
                                      </button>
                                      <button onClick={() => setTranslatedPics(prev => prev.filter((_, i) => i !== idx))} className="bg-white text-red-500 p-2 rounded-xl shadow-lg border border-red-50 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                              <input 
                                type="text"
                                value={pic.label}
                                onChange={(e) => {
                                    const newList = [...translatedPics];
                                    newList[idx].label = e.target.value.toUpperCase();
                                    setTranslatedPics(newList);
                                }}
                                className="text-xs font-black text-center text-slate-600 uppercase w-full bg-transparent border-none outline-none focus:text-brand-primary tracking-tighter"
                              />
                              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                                  <Clock size={14} className="text-indigo-400" />
                                  <input type="time" value={pic.time} onChange={(e) => {
                                      const newList = [...translatedPics];
                                      newList[idx].time = e.target.value;
                                      setTranslatedPics(newList);
                                  }} className="bg-transparent text-xs font-black text-indigo-700 outline-none w-16" />
                              </div>
                              {idx < translatedPics.length - 1 && (
                                  <div className="absolute -right-5 top-14 text-slate-200">
                                      <ArrowRight size={20} />
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                          <CheckCircle2 className="text-green-400" size={32} />
                          <h3 className="text-2xl font-black">2. Guardar</h3>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-3 block">Día de la agenda</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {futureDates.map(date => {
                                      const key = getLocalDateKey(date);
                                      const isSelected = selectedDayKey === key;
                                      const details = getDayDetails(key);
                                      return (
                                          <button 
                                              key={key} 
                                              onClick={() => setSelectedDayKey(key)}
                                              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center ${isSelected ? 'border-white bg-white text-slate-900 shadow-xl scale-105' : 'border-white/10 text-white/50 hover:border-white/30'}`}
                                          >
                                              <span className="text-[10px] font-black uppercase">{details.dayName.slice(0,3)}</span>
                                              <span className="text-xl font-black">{details.dayNum}</span>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>

                          <div>
                              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-3 block">Momento</label>
                              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                  {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
                                      <button 
                                          key={p}
                                          onClick={() => setSelectedPeriod(p)}
                                          className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all ${selectedPeriod === p ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                      >
                                          {p === 'morning' ? <Sun size={20} /> : p === 'afternoon' ? <Sunset size={20} /> : <Moon size={20} />}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={handleAddToSchedule}
                      className="w-full py-6 bg-brand-primary text-white rounded-3xl text-xl font-black flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all hover:bg-brand-secondary"
                  >
                      Añadir a Agenda <ArrowRight size={28} />
                  </button>
              </div>
          </div>
      )}

      {!translatedPics.length && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-indigo-50/50 p-10 rounded-[40px] border border-indigo-100 flex gap-6 items-start">
                  <div className="p-4 bg-white text-indigo-600 rounded-3xl shadow-sm"><MessageSquareText size={32} /></div>
                  <div>
                      <h4 className="text-xl font-black text-indigo-900">Lenguaje Natural</h4>
                      <p className="text-indigo-700/70 mt-2 font-medium">Escribe como hablas. El motor AI ignora palabras vacías y se enfoca en acciones, personas y lugares visuales.</p>
                  </div>
              </div>
              <div className="bg-amber-50/50 p-10 rounded-[40px] border border-amber-100 flex gap-6 items-start">
                  <div className="p-4 bg-white text-amber-600 rounded-3xl shadow-sm"><HelpCircle size={32} /></div>
                  <div>
                      <h4 className="text-xl font-black text-amber-900">Seguridad Predictiva</h4>
                      <p className="text-amber-700/70 mt-2 font-medium">Solo permite añadir rutinas a futuro para que los registros del pasado sirvan como historial inmutable.</p>
                  </div>
              </div>
          </div>
      )}

      {editingIndex !== null && (
          <PictogramSelectorModal 
            onSelect={(newPic) => {
                const newList = [...translatedPics];
                newList[editingIndex] = { ...newList[editingIndex], arasaacId: newPic.arasaacId, label: newPic.label, iconName: newPic.iconName };
                setTranslatedPics(newList);
                setEditingIndex(null);
            }} 
            onClose={() => setEditingIndex(null)} 
          />
      )}
    </div>
  );
};
