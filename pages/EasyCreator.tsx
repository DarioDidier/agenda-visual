
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Sun, Sunset, Moon, Check, Printer, Loader2, Clock, Pencil, Calendar as CalendarIcon, ChevronRight, Trash2, Plus, Eye, Type } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { speakText } from '../services/speechService';
import { exportScheduleToPDF } from '../services/pdfService';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

// Generador de ID robusto y compatible
const generateSafeId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

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
  const { addPictogram, setSchedule, pictograms, settings, updateSettings } = useApp();
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftPics, setDraftPics] = useState<EasyDraftPic[]>([]);
  const [selectedDay, setSelectedDay] = useState(getDateKey(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isHighContrast = settings.highContrast;
  const titleColor = isHighContrast ? 'text-white' : 'text-slate-800';
  const subtitleColor = isHighContrast ? 'text-cyan-300' : 'text-slate-500';

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
          speakText("No encontré dibujos.");
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

        // Clonar datos para evitar mutaciones de estado directo
        const activitiesToAdd: Activity[] = draftPics.map(pic => {
          addPictogram({ ...pic });
          return {
            id: generateSafeId(),
            pictogramId: pic.id,
            customLabel: pic.label,
            period: selectedPeriod,
            isDone: false,
            time: pic.time || '00:00'
          };
        });

        // Actualización de estado segura
        setSchedule(prev => {
            const currentSchedule = prev || {};
            const dayActivities = [...(currentSchedule[selectedDay] || []), ...activitiesToAdd];
            dayActivities.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            
            return {
                ...currentSchedule,
                [selectedDay]: dayActivities
            };
        });

        speakText("Guardado");
        setShowSuccess(true);
        
        // Reset controlado para evitar flickering o errores de estado
        setTimeout(() => {
            setShowSuccess(false);
            setStep(1);
            setInputText('');
            setDraftPics([]);
        }, 1500);
    } catch (error) {
        console.error("Fatal save error:", error);
        alert("Hubo un error al guardar. El almacenamiento del dispositivo podría estar lleno.");
    }
  };

  const handleExportToday = async () => {
    const activities = draftPics.length > 0 ? draftPics.map(p => ({ pictogramId: p.id, customLabel: p.label } as Activity)) : [];
    if (activities.length === 0) return;
    speakText("Imprimiendo");
    await exportScheduleToPDF("Mi Rutina", activities, [...pictograms, ...draftPics]);
  };

  const updateDraftPic = (index: number, updates: Partial<EasyDraftPic>) => {
      setDraftPics(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const toggleHighContrast = () => {
      updateSettings({ highContrast: !settings.highContrast });
      speakText(settings.highContrast ? "Modo normal activado" : "Modo alto contraste activado");
  };

  const cycleFontSize = () => {
      const sizes = [1, 1.25, 1.5, 0.8];
      const currentIndex = sizes.indexOf(settings.fontSize);
      const nextIndex = (currentIndex + 1) % sizes.length;
      const nextSize = sizes[nextIndex];
      updateSettings({ fontSize: nextSize });
      speakText(`Tamaño de letra al ${Math.round(nextSize * 100)} por ciento`);
  };

  if (showSuccess) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-300">
              <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl">
                  <Check size={48} strokeWidth={4} />
              </div>
              <h2 className={`text-3xl font-black uppercase tracking-tighter ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>¡GUARDADO!</h2>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500 relative min-h-[70vh]">
      <div className="flex justify-between items-center px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-4 flex-1 mx-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-brand-primary' : (isHighContrast ? 'bg-slate-800' : 'bg-slate-200')}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className={`text-4xl font-black tracking-tight ${titleColor}`}>¿Qué vamos a hacer?</h2>
            <p className={`font-bold text-lg ${subtitleColor}`}>Escribe tu plan para hoy</p>
          </div>
          
          <div className={`bg-white p-6 rounded-[50px] shadow-2xl border-4 ring-8 ${isHighContrast ? 'border-cyan-400 ring-cyan-900/30' : 'border-slate-100 ring-slate-50'}`}>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: Desayuno y parque..."
              className="w-full h-40 text-3xl font-bold p-4 bg-slate-50 border-none rounded-3xl resize-none outline-none text-slate-700 placeholder:text-slate-300"
            />
          </div>

          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="w-full py-10 bg-brand-primary text-white rounded-[50px] shadow-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:bg-brand-secondary border-b-8 border-brand-secondary"
          >
            {loading ? <Loader2 className="animate-spin" size={60} /> : <Sparkles size={60} />}
            <span className="text-3xl font-black uppercase">BUSCAR DIBUJOS</span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className={`text-4xl font-black ${titleColor}`}>¿Cuándo lo harás?</h2>
            <p className={`font-bold text-lg ${subtitleColor}`}>Revisa tus dibujos</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {draftPics.map((p, i) => (
              <div key={i} className={`bg-white p-6 rounded-[40px] border-4 shadow-lg flex items-center gap-6 ${isHighContrast ? 'border-cyan-400' : 'border-indigo-50'}`}>
                  <button 
                    onClick={() => { setEditingIndex(i); }}
                    className={`w-28 h-28 rounded-[35px] flex items-center justify-center border-4 relative shrink-0 active:scale-90 transition-transform overflow-hidden ${p.customImageUrl ? 'border-brand-primary' : 'bg-slate-50 border-indigo-100'}`}
                  >
                    {p.customImageUrl ? (
                        <img src={p.customImageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <img src={getArasaacImageUrl(p.arasaacId!)} className="w-full h-full object-contain p-4" alt="" />
                    )}
                    <div className="absolute -top-2 -right-2 bg-brand-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                        <Pencil size={16} />
                    </div>
                  </button>
                  
                  <div className="flex-1 space-y-3 min-w-0">
                      <input 
                        type="text" 
                        value={p.label}
                        onChange={(e) => updateDraftPic(i, { label: e.target.value.toUpperCase() })}
                        className="text-xl font-black text-slate-800 bg-slate-50 px-4 py-2 rounded-2xl border-none outline-none w-full truncate"
                      />
                      <div className="flex items-center gap-2">
                          <Clock size={20} className="text-indigo-400" />
                          <input 
                            type="time" 
                            value={p.time} 
                            onChange={(e) => updateDraftPic(i, { time: e.target.value })}
                            className="text-2xl font-black text-indigo-700 bg-transparent outline-none"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={() => setDraftPics(prev => prev.filter((_, idx) => idx !== i))}
                    className={`p-3 transition-colors ${isHighContrast ? 'text-red-400 hover:text-red-600' : 'text-red-200 hover:text-red-500'}`}
                  >
                      <Trash2 size={24} />
                  </button>
              </div>
            ))}
            
            <button 
                onClick={() => setStep(1)}
                className={`w-full py-6 border-4 border-dashed rounded-[40px] flex items-center justify-center gap-2 font-black transition-all ${isHighContrast ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            >
                <Plus size={24} /> AGREGAR MÁS
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
              <button 
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`py-8 rounded-[40px] border-4 flex flex-col items-center gap-1 transition-all ${selectedPeriod === p ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : (isHighContrast ? 'bg-black text-white border-white/20' : 'bg-white text-slate-400 border-slate-100')}`}
              >
                {p === 'morning' ? <Sun size={32} /> : p === 'afternoon' ? <Sunset size={32} /> : <Moon size={32} />}
                <span className="text-xs font-black uppercase">{p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(1)} className={`flex-1 py-6 rounded-[35px] font-black text-lg active:scale-95 transition-all ${isHighContrast ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>VOLVER</button>
            <button onClick={() => { setStep(3); }} className="flex-[2] py-6 bg-brand-primary text-white rounded-[35px] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                CONTINUAR <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <h2 className={`text-4xl font-black ${titleColor}`}>¿Qué día?</h2>
            <p className={`font-bold text-lg ${subtitleColor}`}>Selecciona la fecha</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickDates.map(date => {
              const key = getDateKey(date);
              const isSelected = selectedDay === key;
              return (
                <button 
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`py-6 rounded-[30px] border-4 flex flex-col items-center transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-lg scale-105' : (isHighContrast ? 'bg-black text-white border-white/20' : 'bg-white text-slate-400 border-slate-100')}`}
                >
                  <span className="text-[10px] font-black uppercase">{spanishDays[date.getDay()]}</span>
                  <span className="text-2xl font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className={`p-6 rounded-[40px] border-4 shadow-xl flex flex-col items-center gap-3 ${isHighContrast ? 'bg-black border-cyan-400' : 'bg-white border-indigo-50'}`}>
              <label className={`font-black uppercase text-xs tracking-widest flex items-center gap-2 ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>
                  <CalendarIcon size={16} /> O elige otra fecha
              </label>
              <input 
                  type="date"
                  min={todayKey}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`w-full p-4 rounded-2xl text-2xl font-black text-center outline-none focus:border-brand-primary ${isHighContrast ? 'bg-white text-black' : 'bg-slate-50 border-2 border-slate-100 text-slate-700'}`}
              />
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleFinish}
              className="w-full h-24 bg-green-500 text-white rounded-[45px] shadow-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-green-600 border-b-8 border-green-700 px-4"
            >
              <span className="text-xl sm:text-2xl font-black uppercase tracking-tight text-center w-full block">
                GUARDAR TODO
              </span>
            </button>

            <button 
              onClick={handleExportToday}
              className={`w-full py-6 rounded-[40px] flex items-center justify-center gap-3 font-black text-xl transition-all ${isHighContrast ? 'bg-white text-brand-primary' : 'bg-white text-brand-primary border-4 border-brand-primary/20 hover:bg-brand-primary/5'}`}
            >
              <Printer size={28} /> IMPRIMIR
            </button>
          </div>

          <button onClick={() => setStep(2)} className={`w-full py-4 font-black uppercase text-[10px] tracking-[0.3em] transition-all ${isHighContrast ? 'text-cyan-300 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              Volver a editar
          </button>
        </div>
      )}

      {/* Botones Flotantes de Accesibilidad */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-[99]">
          <button 
            onClick={toggleHighContrast}
            title="Alternar Alto Contraste"
            className={`w-20 h-20 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 flex items-center justify-center transition-all active:scale-90 animate-in zoom-in duration-300 ${isHighContrast ? 'bg-cyan-400 border-white text-black' : 'bg-slate-900 border-slate-700 text-white'}`}
          >
              <Eye size={36} strokeWidth={3} />
          </button>
          <button 
            onClick={cycleFontSize}
            title="Cambiar tamaño de texto"
            className={`w-20 h-20 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 flex items-center justify-center transition-all active:scale-90 animate-in zoom-in duration-300 delay-100 ${isHighContrast ? 'bg-white border-cyan-400 text-black' : 'bg-brand-primary border-white text-white'}`}
          >
              <Type size={36} strokeWidth={3} />
          </button>
      </div>

      {editingIndex !== null && (
          <PictogramSelectorModal 
            onSelect={(newPic) => {
                updateDraftPic(editingIndex, { 
                    arasaacId: newPic.arasaacId, 
                    label: newPic.label, 
                    customImageUrl: newPic.customImageUrl 
                });
                setEditingIndex(null);
            }} 
            onClose={() => setEditingIndex(null)} 
          />
      )}
    </div>
  );
};
