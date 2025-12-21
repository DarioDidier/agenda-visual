
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, Sun, Sunset, Moon, Calendar, Check, Trash2, Printer, Loader2, ArrowRight, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { translateTextToKeywords } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { speakText } from '../services/speechService';
import { exportScheduleToPDF } from '../services/pdfService';

const getDateKey = (d: Date) => d.toISOString().split('T')[0];
const spanishDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const EasyCreator: React.FC = () => {
  const { addPictogram, setSchedule, weekDates, pictograms } = useApp();
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftPics, setDraftPics] = useState<PictogramData[]>([]);
  const [selectedDay, setSelectedDay] = useState(getDateKey(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');

  const todayKey = getDateKey(new Date());
  const futureDates = weekDates.filter(d => getDateKey(d) >= todayKey);

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
            bgColor: 'bg-white'
          } as PictogramData;
        }
        return null;
      }));
      const validPics = results.filter(p => p !== null) as PictogramData[];
      setDraftPics(validPics);
      if (validPics.length > 0) setStep(2);
    } catch (e) {
      speakText("No pude encontrar los dibujos. Intenta de nuevo.");
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
        time: selectedPeriod === 'morning' ? '09:00' : selectedPeriod === 'afternoon' ? '16:00' : '20:00'
      };
    });

    setSchedule(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), ...newActivities]
    }));

    speakText("¡Listo! Guardado en tu agenda.");
    setStep(1);
    setInputText('');
    setDraftPics([]);
  };

  const handleExportToday = async () => {
    const activities = draftPics.length > 0 ? draftPics.map(p => ({ pictogramId: p.id, customLabel: p.label } as Activity)) : [];
    if (activities.length === 0) {
        speakText("Primero crea una rutina para poder imprimirla.");
        return;
    }
    speakText("Preparando papel para imprimir.");
    await exportScheduleToPDF("Mi Rutina Nueva", activities, [...pictograms, ...draftPics]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      {/* Indicador de pasos visual */}
      <div className="flex justify-between items-center px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-4 flex-1 mx-1 rounded-full ${step >= i ? 'bg-brand-primary' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* PASO 1: ENTRADA AI */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800">¿Qué vas a hacer?</h2>
            <p className="text-slate-500 font-bold">Cuéntame tu plan con voz o teclado</p>
          </div>
          
          <div className="bg-white p-6 rounded-[40px] shadow-xl border-4 border-slate-100">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: Mañana ir al médico y luego a la plaza..."
              className="w-full h-40 text-2xl font-bold p-4 bg-slate-50 border-none rounded-3xl resize-none outline-none text-slate-700"
            />
          </div>

          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="w-full py-8 bg-brand-primary text-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={48} /> : <Sparkles size={48} />}
            <span className="text-2xl font-black">BUSCAR DIBUJOS</span>
          </button>
        </div>
      )}

      {/* PASO 2: REVISIÓN Y MOMENTO */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-800">¿Cuándo lo harás?</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto p-4 bg-white rounded-[40px] border-4 border-indigo-50 shadow-lg">
            {draftPics.map((p, i) => (
              <div key={i} className="shrink-0 w-24 h-24 bg-slate-50 rounded-2xl p-2 flex items-center justify-center border-2 border-indigo-100">
                <img src={getArasaacImageUrl(p.arasaacId!)} className="w-full h-full object-contain" alt={p.label} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
              <button 
                key={p}
                onClick={() => { setSelectedPeriod(p); speakText(p === 'morning' ? "Mañana" : p === 'afternoon' ? "Tarde" : "Noche"); }}
                className={`py-8 rounded-[40px] border-4 flex flex-col items-center gap-2 transition-all ${selectedPeriod === p ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                {p === 'morning' ? <Sun size={40} /> : p === 'afternoon' ? <Sunset size={40} /> : <Moon size={40} />}
                <span className="text-lg font-black uppercase">{p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[30px] font-black text-xl">ATRÁS</button>
            <button onClick={() => setStep(3)} className="flex-[2] py-6 bg-brand-primary text-white rounded-[30px] font-black text-xl shadow-lg">CONTINUAR</button>
          </div>
        </div>
      )}

      {/* PASO 3: DÍA Y FINALIZAR */}
      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-800">¿Qué día?</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {futureDates.slice(0, 4).map(date => {
              const key = getDateKey(date);
              const isSelected = selectedDay === key;
              return (
                <button 
                  key={key}
                  onClick={() => { setSelectedDay(key); speakText(`${spanishDays[date.getDay()]} ${date.getDate()}`); }}
                  className={`py-6 rounded-[30px] border-4 flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  <span className="text-sm font-black uppercase">{spanishDays[date.getDay()]}</span>
                  <span className="text-3xl font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleFinish}
              className="w-full py-8 bg-green-500 text-white rounded-[40px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
            >
              <Check size={48} />
              <span className="text-3xl font-black uppercase">GUARDAR TODO</span>
            </button>

            <button 
              onClick={handleExportToday}
              className="w-full py-6 bg-white text-brand-primary border-4 border-brand-primary/20 rounded-[40px] flex items-center justify-center gap-3 font-black text-xl hover:bg-brand-primary/5 transition-all"
            >
              <Printer size={24} /> IMPRIMIR EN PAPEL
            </button>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-4 text-slate-400 font-bold">Volver a cambiar momento</button>
        </div>
      )}
    </div>
  );
};
