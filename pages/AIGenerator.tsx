import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Loader2, ArrowRight, Edit2 } from 'lucide-react';
import { generateRoutine } from '../services/geminiService';
import { searchArasaac, getArasaacImageUrl } from '../services/arasaacService';
import { Activity, PictogramData, DayOfWeek, Category } from '../types';
import { PictogramIcon } from '../components/PictogramIcon';
import { DAYS_ORDER } from '../constants';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';

export const AIGenerator: React.FC = () => {
  const { addPictogram, setSchedule, schedule } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(DayOfWeek.MONDAY);
  
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
    } catch (e) {
      console.error(e);
      alert("Hubo un error generando la rutina. Intenta de nuevo.");
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

  const handleApply = () => {
    if (generatedItems.length === 0) return;

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
            isDone: false
        };
    });

    setSchedule(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), ...newActivities]
    }));
    
    // Clear
    setGeneratedItems([]);
    setPrompt('');
    alert(`¡Rutina agregada al ${selectedDay}!`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-500" />
            Asistente Mágico
        </h2>
        <p className="text-slate-500">
            Describe una rutina (ej: "Pasos para ir al baño", "Rutina de mañana antes del colegio") y la Inteligencia Artificial buscará los pictogramas de ARASAAC por ti.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-4">
        <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Crear una rutina para calmarse cuando está enojado..."
            className="w-full p-4 border rounded-xl h-32 focus:ring-2 focus:ring-brand-primary outline-none resize-none"
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
                            <div className="flex gap-2">
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 rounded-full">{item.category}</span>
                                {item.arasaacKeyword && <span className="text-xs text-slate-400 italic">Clave: {item.arasaacKeyword}</span>}
                            </div>
                        </div>
                        {item.time && <span className="text-xs font-mono font-bold text-slate-400">{item.time}</span>}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl">
                <span className="text-sm font-bold text-purple-800">Agregar al día:</span>
                <select 
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border-none bg-white rounded px-3 py-1 font-bold text-slate-700 focus:ring-0"
                >
                    {DAYS_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button 
                    onClick={handleApply}
                    className="ml-auto bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-purple-700"
                >
                    Guardar <ArrowRight size={16} />
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
