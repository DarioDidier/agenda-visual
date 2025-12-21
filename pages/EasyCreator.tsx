
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Sun, Sunset, Moon, Check, Printer, Loader2, Clock, Pencil, Calendar as CalendarIcon, ChevronRight, Trash2, Plus, PartyPopper } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { speakText } from '../services/speechService';
import { exportScheduleToPDF } from '../services/pdfService';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

// Generador de ID seguro para evitar errores en navegadores que no soportan crypto.randomUUID
const generateSafeId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

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
  const [showSuccess, setShowSuccess] = useState(false);

  const todayKey = useMemo(() => getDateKey(new Date()), []);
  
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
    speakText("Buscando dibujos");
    try {
      const keywords = await translateTextToKeywords(inputText);
      const results = await Promise.all(keywords.map(async (kw) => {
        try {
            const res = await searchArasaac(kw);
            if (res && res.length > 0) {
              return {
                id: `easy-${generateSafeId()}`,
                label: kw.toUpperCase(),
                arasaacId: res[0]._id,
                category: Category.HOME,
                bgColor: 'bg-white',
                time: selectedPeriod === 'morning' ? '09:00' : selectedPeriod === 'afternoon' ? '16:00' : '20:00'
              } as EasyDraftPic;
            }
        } catch (e) { console.error(e); }
        return null;
      }));
      const validPics = results.filter(p => p !== null) as EasyDraftPic[];
      setDraftPics(validPics);
      if (validPics.length > 0) {
          setStep(2);
      } else {
          speakText("No encontré dibujos. Intenta con otras palabras.");
      }
    } catch (e) {
      speakText("Error al buscar.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    try {
        if (draftPics.length === 0) return;

        const newActivities: Activity[] = draftPics.map(pic => {
          addPictogram(pic);
          return {
            id: generateSafeId(),
            pictogramId: pic.id,
            customLabel: pic.label,
            period: selectedPeriod,
            isDone: false,
            time: pic.time || '00:00'
          };
        });

        setSchedule(prev => {
            const currentDayActivities = prev[selectedDay] || [];
            return {
                ...prev,
                [selectedDay]: [...currentDayActivities, ...newActivities]
            };
        });

        speakText("¡Agenda guardada con éxito!");
        setShowSuccess(true);
        
        // Pequeña pausa para mostrar el éxito antes de resetear
        setTimeout(() => {
            setShowSuccess(false);
            setStep(1);
            setInputText('');
            setDraftPics([]);
        }, 2000);
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Ocurrió un error al guardar. Por favor, intenta de nuevo.");
    }
  };

  const handleExportToday = async () => {
    const activities = draftPics.length > 0 ? draftPics.map(p => ({ pictogramId: p.id, customLabel: p.label } as Activity)) : [];
    if (activities.length === 0) {
        speakText("No hay nada para imprimir.");
        return;
    }
    speakText("Preparando papel.");
    await exportScheduleToPDF("Mi Nueva Rutina", activities, [...pictograms, ...draftPics]);
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

  // Pantalla de éxito momentánea
  if (showSuccess) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-40 h-40 bg-green-100 text-green-500 rounded-full flex items-center justify-center shadow-2xl border-8 border-green-50">
                  <PartyPopper size={80} />
              </div>
              <h2 className="text-5xl font-black text-slate-800 text-center">¡GUARDADO!</h2>
              <p className="text-2xl font-bold text-slate-400">Tu rutina está lista</p>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Pasos visuales */}
      <div className="flex justify-between items-center px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-4 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-brand-primary' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* PASO 1: ¿QUÉ HAREMOS? */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">¿Qué vamos a hacer?</h2>
            <p className="text-slate-500 font-bold text-lg">Escribe lo que quieras hacer hoy</p>
          </div>
          
          <div className="bg-white p-6 rounded-[50px] shadow-2xl border-4 border-slate-100 ring-8 ring-slate-50">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: Desayuno y luego ir al parque..."
              className="w-full h-48 text-3xl font-bold p-4 bg-slate-50 border-none rounded-3xl resize-none outline-none text-slate-700 placeholder:text-slate-200"
            />
          </div>

          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="w-full py-12 bg-brand-primary text-white rounded-[50px] shadow-2xl flex flex-col items-center justify-center gap-4 active:scale-95 transition-all hover:bg-brand-secondary border-b-[10px] border-brand-secondary"
          >
            {loading ? <Loader2 className="animate-spin" size={70} /> : <Sparkles size={70} />}
            <span className="text-4xl font-black uppercase tracking-wide">BUSCAR DIBUJOS</span>
          </button>
        </div>
      )}

      {/* PASO 2: ¿CUÁNDO LO HARÁS? (EDICIÓN) */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800">¿Cuándo lo harás?</h2>
            <p className="text-slate-500 font-bold text-lg">Revisa los dibujos y la hora</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {draftPics.map((p, i) => (
              <div key={i} className="bg-white p-6 rounded-[40px] border-4 border-indigo-50 shadow-lg flex items-center gap-6 group">
                  <button 
                    onClick={() => { setEditingIndex(i); speakText("Cambiando imagen"); }}
                    className={`w-32 h-32 rounded-[35px] flex items-center justify-center border-4 relative shrink-0 active:scale-90 transition-transform overflow-hidden ${p.customImageUrl ? 'border-brand-primary' : 'bg-slate-50 border-indigo-100'}`}
                  >
                    {p.customImageUrl ? (
                        <img src={p.customImageUrl} className="w-full h-full object-cover" alt={p.label} />
                    ) : (
                        <img src={getArasaacImageUrl(p.arasaacId!)} className="w-full h-full object-contain p-4" alt={p.label} />
                    )}
                    <div className="absolute -top-3 -right-3 bg-brand-primary text-white p-3 rounded-full shadow-lg border-4 border-white">
                        <Pencil size={20} />
                    </div>
                  </button>
                  
                  <div className="flex-1 space-y-4">
                      <div className="flex flex-col">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1">Actividad</label>
                          <input 
                            type="text" 
                            value={p.label}
                            onChange={(e) => updateDraftPic(i, { label: e.target.value.toUpperCase() })}
                            className="text-2xl font-black text-slate-800 bg-slate-50 px-4 py-2 rounded-2xl border-2 border-transparent focus:border-brand-primary outline-none"
                          />
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                              <Clock size={24} />
                          </div>
                          <input 
                            type="time" 
                            value={p.time} 
                            onChange={(e) => updateDraftPic(i, { time: e.target.value })}
                            className="text-3xl font-black text-indigo-700 bg-transparent outline-none w-full"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={() => setDraftPics(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-4 text-red-200 hover:text-red-500 transition-colors"
                  >
                      <Trash2 size={24} />
                  </button>
              </div>
            ))}
            
            <button 
                onClick={() => setStep(1)}
                className="w-full py-6 border-4 border-dashed border-slate-200 rounded-[40px] text-slate-400 flex items-center justify-center gap-2 font-black hover:bg-slate-50 transition-all"
            >
                <Plus size={24} /> AGREGAR MÁS
            </button>
          </div>

          <div className="space-y-4">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest block text-center">Momento del día</label>
              <div className="grid grid-cols-3 gap-4">
                {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
                  <button 
                    key={p}
                    onClick={() => { setSelectedPeriod(p); speakText(p === 'morning' ? "Mañana" : p === 'afternoon' ? "Tarde" : "Noche"); }}
                    className={`py-12 rounded-[45px] border-4 flex flex-col items-center gap-2 transition-all ${selectedPeriod === p ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    {p === 'morning' ? <Sun size={50} /> : p === 'afternoon' ? <Sunset size={50} /> : <Moon size={50} />}
                    <span className="text-xl font-black uppercase">{p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}</span>
                  </button>
                ))}
              </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(1)} className="flex-1 py-8 bg-slate-100 text-slate-500 rounded-[40px] font-black text-2xl active:scale-95 transition-all">VOLVER</button>
            <button onClick={() => { setStep(3); speakText("Elige el día"); }} className="flex-[2] py-8 bg-brand-primary text-white rounded-[40px] font-black text-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                CONTINUAR <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: ¿QUÉ DÍA? */}
      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-800">¿Qué día lo haremos?</h2>
            <p className="text-slate-500 font-bold text-lg">Toca un día de la lista</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickDates.map(date => {
              const key = getDateKey(date);
              const isSelected = selectedDay === key;
              return (
                <button 
                  key={key}
                  onClick={() => { setSelectedDay(key); speakText(getDayLabel(key)); }}
                  className={`py-10 rounded-[40px] border-4 flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-2xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  <span className="text-sm font-black uppercase">{spanishDays[date.getDay()]}</span>
                  <span className="text-4xl font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white p-8 rounded-[50px] border-4 border-indigo-50 shadow-xl space-y-4">
              <label className="flex items-center gap-3 text-slate-500 font-black uppercase text-sm tracking-widest justify-center">
                  <CalendarIcon size={20} /> Elegir otra fecha:
              </label>
              <input 
                  type="date"
                  min={todayKey}
                  value={selectedDay}
                  onChange={(e) => { 
                      setSelectedDay(e.target.value); 
                      speakText("Cambiado");
                  }}
                  className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[35px] text-4xl font-black text-center text-slate-700 outline-none focus:border-brand-primary transition-all cursor-pointer"
              />
          </div>

          <div className="space-y-4 pt-10">
            <button 
              onClick={handleFinish}
              className="w-full py-14 bg-green-500 text-white rounded-[70px] shadow-2xl flex items-center justify-center gap-8 active:scale-95 transition-all hover:bg-green-600 border-b-[15px] border-green-700"
            >
              <div className="bg-white/20 p-5 rounded-full shadow-inner">
                  <Check size={64} strokeWidth={5} />
              </div>
              <span className="text-5xl font-black uppercase tracking-tighter">GUARDAR TODO</span>
            </button>

            <button 
              onClick={handleExportToday}
              className="w-full py-8 bg-white text-brand-primary border-4 border-brand-primary/20 rounded-[50px] flex items-center justify-center gap-4 font-black text-2xl hover:bg-brand-primary/5 transition-all"
            >
              <Printer size={32} /> IMPRIMIR EN PAPEL
            </button>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-6 text-slate-400 font-black uppercase text-sm tracking-[0.4em] hover:text-slate-600 active:scale-90 transition-all">
              Volver a editar dibujos
          </button>
        </div>
      )}

      {editingIndex !== null && (
          <PictogramSelectorModal 
            onSelect={(newPic) => {
                updateDraftPic(editingIndex, { 
                    arasaacId: newPic.arasaacId, 
                    label: newPic.label, 
                    customImageUrl: newPic.customImageUrl 
                });
                setEditingIndex(null);
                speakText("Imagen cambiada");
            }} 
            onClose={() => setEditingIndex(null)} 
          />
      )}
    </div>
  );
};
