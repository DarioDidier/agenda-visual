
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Sun, Sunset, Moon, Check, Printer, Loader2, Clock, Pencil, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { speakText } from '../services/speechService';
import { exportScheduleToPDF } from '../services/pdfService';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface EasyDraftPic extends PictogramData {
    time: string;
}

export const EasyCreator: React.FC = () => {
  const { addPictogram, setSchedule, pictograms } = useApp();
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftPics, setDraftPics] = useState<EasyDraftPic[]>([]);
  const [selectedDay, setSelectedDay] = useState(getDateKey(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const todayKey = useMemo(() => getDateKey(new Date()), []);
  
  // Generar los próximos 7 días para botones rápidos
  const quickDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    speakText("Buscando dibujos para tu rutina");
    try {
      const keywords = await translateTextToKeywords(inputText);
      const results = await Promise.all(keywords.map(async (kw) => {
        const res = await searchArasaac(kw);
        if (res && res.length > 0) {
          return {
            id: `easy-${crypto.randomUUID()}`,
            label: kw.toUpperCase(),
            arasaacId: res[0]._id,
            category: Category.HOME,
            bgColor: 'bg-white',
            time: selectedPeriod === 'morning' ? '09:00' : selectedPeriod === 'afternoon' ? '16:00' : '20:00'
          } as EasyDraftPic;
        }
        return null;
      }));
      const validPics = results.filter(p => p !== null) as EasyDraftPic[];
      setDraftPics(validPics);
      if (validPics.length > 0) {
          setStep(2);
      } else {
          speakText("No encontré dibujos para eso. Intenta con otras palabras.");
      }
    } catch (e) {
      speakText("Hubo un problema. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    const newActivities: Activity[] = draftPics.map(pic => {
      addPictogram(pic);
      return {
        id: crypto.randomUUID(),
        pictogramId: pic.id,
        customLabel: pic.label,
        period: selectedPeriod,
        isDone: false,
        time: pic.time
      };
    });

    setSchedule(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), ...newActivities]
    }));

    speakText("¡Guardado correctamente!");
    setStep(1);
    setInputText('');
    setDraftPics([]);
  };

  const handleExportToday = async () => {
    const activities = draftPics.length > 0 ? draftPics.map(p => ({ pictogramId: p.id, customLabel: p.label } as Activity)) : [];
    if (activities.length === 0) {
        speakText("Primero crea una rutina.");
        return;
    }
    speakText("Preparando para imprimir.");
    await exportScheduleToPDF("Mi Rutina Nueva", activities, [...pictograms, ...draftPics]);
  };

  const updateDraftPic = (index: number, updates: Partial<EasyDraftPic>) => {
      setDraftPics(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const getDayLabel = (dateKey: string) => {
      if (dateKey === todayKey) return "Hoy";
      const parts = dateKey.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return `${spanishDays[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32">
      {/* Indicador de pasos visual */}
      <div className="flex justify-between items-center px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-4 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-brand-primary' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* PASO 1: ENTRADA AI */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">¿Qué vamos a hacer?</h2>
            <p className="text-slate-500 font-bold text-lg">Escribe o usa el dictado de voz</p>
          </div>
          
          <div className="bg-white p-6 rounded-[40px] shadow-2xl border-4 border-slate-100 ring-8 ring-slate-50">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: Ir al médico y luego a la plaza..."
              className="w-full h-48 text-3xl font-bold p-4 bg-slate-50 border-none rounded-3xl resize-none outline-none text-slate-700 placeholder:text-slate-200"
            />
          </div>

          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="w-full py-10 bg-brand-primary text-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:bg-brand-secondary border-b-[8px] border-brand-secondary"
          >
            {loading ? <Loader2 className="animate-spin" size={64} /> : <Sparkles size={64} />}
            <span className="text-3xl font-black uppercase">BUSCAR DIBUJOS</span>
          </button>
        </div>
      )}

      {/* PASO 2: REVISIÓN Y MOMENTO */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800">¿Cómo lo haremos?</h2>
            <p className="text-slate-500 font-bold text-lg">Revisa los dibujos y la hora</p>
          </div>

          <div className="flex gap-4 overflow-x-auto p-6 bg-white rounded-[40px] border-4 border-indigo-50 shadow-xl min-h-[220px] scrollbar-hide">
            {draftPics.map((p, i) => (
              <div key={i} className="shrink-0 flex flex-col gap-3 items-center group relative">
                  <button 
                    onClick={() => { setEditingIndex(i); speakText("Cambiando dibujo"); }}
                    className="w-32 h-32 bg-slate-50 rounded-[32px] p-4 flex items-center justify-center border-4 border-indigo-100 shadow-sm group-hover:border-brand-primary group-hover:bg-white transition-all relative"
                  >
                    <img src={getArasaacImageUrl(p.arasaacId!)} className="w-full h-full object-contain" alt={p.label} />
                    <div className="absolute -top-3 -right-3 bg-brand-primary text-white p-3 rounded-full shadow-lg border-4 border-white">
                        <Pencil size={20} />
                    </div>
                  </button>
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border-2 border-slate-200">
                      <Clock size={16} className="text-slate-400" />
                      <input 
                        type="time" 
                        value={p.time} 
                        onChange={(e) => updateDraftPic(i, { time: e.target.value })}
                        className="bg-transparent text-lg font-black outline-none w-20 text-slate-700"
                      />
                  </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
              <label className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Momento del día</label>
              <div className="grid grid-cols-3 gap-4">
                {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
                  <button 
                    key={p}
                    onClick={() => { setSelectedPeriod(p); speakText(p === 'morning' ? "Mañana" : p === 'afternoon' ? "Tarde" : "Noche"); }}
                    className={`py-10 rounded-[40px] border-4 flex flex-col items-center gap-2 transition-all ${selectedPeriod === p ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    {p === 'morning' ? <Sun size={48} /> : p === 'afternoon' ? <Sunset size={48} /> : <Moon size={48} />}
                    <span className="text-xl font-black uppercase">{p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}</span>
                  </button>
                ))}
              </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="flex-1 py-8 bg-slate-100 text-slate-500 rounded-[40px] font-black text-2xl active:scale-95 transition-all">ATRÁS</button>
            <button onClick={() => { setStep(3); speakText("Elige el día"); }} className="flex-[2] py-8 bg-brand-primary text-white rounded-[40px] font-black text-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                SIGUIENTE <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: DÍA Y FINALIZAR */}
      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800">¿Qué día lo haremos?</h2>
            <p className="text-slate-500 font-bold text-lg">Toca un día o elige uno del calendario</p>
          </div>

          {/* Botones rápidos de la semana */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickDates.map(date => {
              const key = getDateKey(date);
              const isSelected = selectedDay === key;
              return (
                <button 
                  key={key}
                  onClick={() => { setSelectedDay(key); speakText(getDayLabel(key)); }}
                  className={`py-8 rounded-[35px] border-4 flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  <span className="text-sm font-black uppercase">{spanishDays[date.getDay()]}</span>
                  <span className="text-4xl font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* Selector de calendario para cualquier día futuro */}
          <div className="bg-white p-6 rounded-[40px] border-4 border-indigo-50 shadow-lg space-y-4">
              <label className="flex items-center gap-3 text-slate-500 font-black uppercase text-sm tracking-widest justify-center">
                  <CalendarIcon size={20} /> O elige otra fecha:
              </label>
              <input 
                  type="date"
                  min={todayKey}
                  value={selectedDay}
                  onChange={(e) => { 
                      setSelectedDay(e.target.value); 
                      speakText("Día cambiado");
                  }}
                  className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[30px] text-3xl font-black text-center text-slate-700 outline-none focus:border-brand-primary transition-all cursor-pointer"
              />
          </div>

          <div className="space-y-4 pt-6">
            <button 
              onClick={handleFinish}
              className="w-full py-12 bg-green-500 text-white rounded-[60px] shadow-2xl flex items-center justify-center gap-8 active:scale-95 transition-all hover:bg-green-600 border-b-[12px] border-green-700"
            >
              <div className="bg-white/20 p-4 rounded-full shadow-inner">
                  <Check size={56} strokeWidth={4} />
              </div>
              <span className="text-5xl font-black uppercase tracking-tighter">GUARDAR TODO</span>
            </button>

            <button 
              onClick={handleExportToday}
              className="w-full py-8 bg-white text-brand-primary border-4 border-brand-primary/20 rounded-[45px] flex items-center justify-center gap-4 font-black text-2xl hover:bg-brand-primary/5 transition-all"
            >
              <Printer size={32} /> IMPRIMIR EN PAPEL
            </button>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-6 text-slate-400 font-black uppercase text-sm tracking-[0.3em] hover:text-slate-600 active:scale-90 transition-all">
              Volver a las fotos
          </button>
        </div>
      )}

      {editingIndex !== null && (
          <PictogramSelectorModal 
            onSelect={(newPic) => {
                updateDraftPic(editingIndex, { arasaacId: newPic.arasaacId, label: newPic.label });
                setEditingIndex(null);
                speakText("Dibujo cambiado");
            }} 
            onClose={() => setEditingIndex(null)} 
          />
      )}
    </div>
  );
};
