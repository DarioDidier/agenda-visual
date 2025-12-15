import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Edit2, Calendar as CalendarIcon, AlertCircle, ChevronDown, Sun, Sunset, Moon } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, Category, TimePeriod } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

// Helper to get formatted date string in LOCAL time (YYYY-MM-DD)
// This fixes issues where toISOString() (UTC) might block 'today' depending on timezone
const getLocalDateKey = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const spanishMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  
  const todayKey = getLocalDateKey();

  // Default to today
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedItems([]);
    
    try {
      // 1. Get the structure from Gemini
      const items = await generateRoutine(prompt);
      
      // 2. Enhance with ARASAAC images
      const enhancedItems = await Promise.all(items.map(async (item) => {
        let arasaacId = undefined;
        if (item.arasaacKeyword) {
          try {
            const results = await searchArasaac(item.arasaacKeyword);
            if (results && results.length > 0) {
              // Prefer exact matches or the first one
              arasaacId = results[0]._id;
            }
          } catch (e) {
            console.warn("Could not find arasaac image for", item.arasaacKeyword);
          }
        }
        return { ...item, arasaacId };
      }));

      setGeneratedItems(enhancedItems);
    } catch (e: any) {
      console.error(e);
      alert(`Error al generar: ${e.message || 'Verifica tu conexión o API Key'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemPictogram = (pic: PictogramData) => {
      if (editingItemIndex === null) return;
      
      const updatedItems = [...generatedItems];
      const item = updatedItems[editingItemIndex];
      
      // Update item with new pictogram data
      updatedItems[editingItemIndex] = {
          ...item,
          arasaacId: pic.arasaacId,
          iconName: pic.iconName,
          label: pic.label // Optionally update label? Maybe better to keep context label but swap icon.
      };
      
      setGeneratedItems(updatedItems);
      setEditingItemIndex(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Strict check to prevent typing past dates if browser allows it
      if (val && val < todayKey) {
          alert("Por favor, selecciona una fecha desde el día de hoy en adelante.");
          setSelectedDayKey(todayKey);
          return;
      }
      setSelectedDayKey(val);
  };

  const handleApply = () => {
    if (generatedItems.length === 0 || !selectedDayKey) return;

    // Validate date is not in the past (basic check)
    if (selectedDayKey < todayKey) {
        alert("Por favor selecciona una fecha de hoy en adelante.");
        return;
    }

    const newActivities: Activity[] = generatedItems.map(item => {
        // Create a pictogram entry for it first
        const newPic: PictogramData = {
            id: crypto.randomUUID(),
            label: item.label,
            iconName: item.iconName,
            arasaacId: item.arasaacId,
            category: item.category as Category,
            bgColor: 'bg-white border-2 border-indigo-200' // Default generated color
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
    
    // Clear
    setGeneratedItems([]);
    setPrompt('');
    alert(`¡Rutina agregada exitosamente para el ${selectedDayKey}!`);
  };

  const getDayDetails = (dateStr: string) => {
      if (!dateStr) return { dayName: '', fullDate: '' };
      const parts = dateStr.split('-');
      // Note: Month is 0-indexed in JS Date
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      return {
          dayName: spanishDays[d.getDay()],
          fullDate: `${d.getDate()} de ${spanishMonths[d.getMonth()]}`
      };
  };

  const dateDetails = getDayDetails(selectedDayKey);

  const getPeriodIcon = (period: string) => {
      switch(period) {
          case 'afternoon': return <Sunset size={16} className="text-orange-500" />;
          case 'evening': return <Moon size={16} className="text-purple-500" />;
          default: return <Sun size={16} className="text-yellow-500" />;
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-500" />
            Asistente Mágico
        </h2>
        <p className="text-slate-500">
            Describe una rutina (ej: "Pasos para ir al baño", "Rutina de mañana antes del colegio") y la Inteligencia Artificial buscará los pictogramas de ARASAAC por ti y los organizará por momento del día.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-4">
        <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Crear una rutina para calmarse cuando está enojado..."
            className="w-full p-4 border rounded-xl h-32 focus:ring-2 focus:ring-brand-primary outline-none resize-none bg-white text-slate-800 shadow-inner text-lg"
        />
        
        <div className="flex justify-end">
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generar Rutina
            </button>
        </div>
      </div>

      {/* Results Preview */}
      {generatedItems.length > 0 && (
          <div className="bg-pastel-purple p-6 rounded-2xl border border-purple-200 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-purple-900 mb-4">Vista Previa (Toca para editar iconos):</h3>
            <div className="space-y-3 mb-6">
                {generatedItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setEditingItemIndex(idx)}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:border-brand-primary border-2 border-transparent transition-all group"
                        title="Haz clic para cambiar el pictograma"
                    >
                        <div className="p-2 bg-purple-100 rounded-lg h-16 w-16 flex items-center justify-center overflow-hidden relative">
                            {item.arasaacId ? (
                                <img src={getArasaacImageUrl(item.arasaacId)} alt={item.label} className="object-contain w-full h-full" />
                            ) : (
                                <PictogramIcon name={item.iconName} size={24} />
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{item.label}</p>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                                    {getPeriodIcon(item.period || 'morning')}
                                    {item.period === 'morning' ? 'Mañana' : item.period === 'afternoon' ? 'Tarde' : 'Noche'}
                                </span>
                                {item.arasaacKeyword && <span className="text-xs text-slate-400 italic">Clave: {item.arasaacKeyword}</span>}
                            </div>
                        </div>
                        {item.time && <span className="text-xs font-mono font-bold text-slate-400">{item.time}</span>}
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/60 p-4 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex flex-col w-full md:w-auto flex-1 gap-2">
                    <label className="flex items-center gap-2 mb-1 cursor-pointer" htmlFor="routine-date-picker">
                        <CalendarIcon className="text-purple-600" size={20} />
                        <span className="text-sm font-bold text-purple-900 whitespace-nowrap">
                            Elige la fecha (Calendario):
                        </span>
                    </label>
                    
                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Calendar Input Wrapper */}
                            <div className="relative group w-full md:w-auto">
                                <input
                                    id="routine-date-picker"
                                    type="date"
                                    min={todayKey}
                                    value={selectedDayKey}
                                    onChange={handleDateChange}
                                    className="pl-10 pr-10 py-3 border-2 border-purple-100 bg-white rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-sm outline-none cursor-pointer w-full md:min-w-[200px] appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    required
                                />
                                <CalendarIcon size={18} className="absolute left-3 top-3.5 text-purple-500 pointer-events-none" />
                                <ChevronDown size={20} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            {dateDetails.dayName && (
                                <div className="bg-purple-100 text-purple-800 px-4 py-3 rounded-xl font-bold text-sm border border-purple-200 capitalize shadow-sm">
                                    {dateDetails.dayName}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <AlertCircle size={14} className="text-slate-400" />
                            <p className="text-xs text-slate-500 font-medium">
                                Selecciona hoy o una fecha futura.
                            </p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handleApply}
                    className="w-full md:w-auto bg-purple-600 text-white px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-transform active:scale-95 whitespace-nowrap"
                >
                    <span>Guardar para el <span className="underline decoration-purple-400 decoration-2">{dateDetails.fullDate}</span></span>
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