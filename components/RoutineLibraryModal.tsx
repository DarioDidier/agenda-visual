import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, SavedRoutine, TimePeriod, PictogramData } from '../types';
import { X, Book, Download, Upload, Trash2, PlusCircle, Check, Share2, Sun, Sunset, Moon, Plus, ArrowUp, ArrowDown, Clock, ChevronDown, FileJson, FileUp } from 'lucide-react';
import { PictogramIcon } from './PictogramIcon';
import { PictogramSelectorModal } from './PictogramSelectorModal';
import { getArasaacImageUrl } from '../services/arasaacService';

interface Props {
  onClose: () => void;
  currentDayKey?: string; // Optional context for creating from current day
}

type Tab = 'LIBRARY' | 'CREATE' | 'IMPORT';

export const RoutineLibraryModal: React.FC<Props> = ({ onClose, currentDayKey }) => {
  const { savedRoutines, saveRoutineToLibrary, importRoutineToLibrary, deleteRoutineFromLibrary, applyRoutineToDay, pictograms } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('LIBRARY');
  
  // Create State
  const [createName, setCreateName] = useState('');
  const [draftActivities, setDraftActivities] = useState<Activity[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // Import State
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply State
  const [targetDay, setTargetDay] = useState(currentDayKey || new Date().toISOString().split('T')[0]);
  const [targetPeriod, setTargetPeriod] = useState<TimePeriod>('morning');
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  // Download Success State
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  // Helper to get pictogram info for preview
  const getPic = (id: string, localRequired?: any[]) => {
      // Look in main library first, then in the required array (for display during import preview potentially)
      const found = pictograms.find(p => p.id === id) || localRequired?.find((p: any) => p.id === id);
      return found;
  };

  // --- Create Handlers ---

  const handleAddPictogram = (pic: PictogramData) => {
      const newActivity: Activity = {
          id: crypto.randomUUID(),
          pictogramId: pic.id,
          customLabel: pic.label,
          isDone: false,
          period: 'morning', // Default placeholder
          time: ''
      };
      setDraftActivities([...draftActivities, newActivity]);
      setIsSelectorOpen(false);
  };

  const handleRemoveDraft = (index: number) => {
      const newList = [...draftActivities];
      newList.splice(index, 1);
      setDraftActivities(newList);
  };

  const handleMoveDraft = (index: number, direction: 'up' | 'down') => {
      const newList = [...draftActivities];
      if (direction === 'up' && index > 0) {
          [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      } else if (direction === 'down' && index < newList.length - 1) {
          [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
      }
      setDraftActivities(newList);
  };

  const handleUpdateDraftTime = (index: number, time: string) => {
      const newList = [...draftActivities];
      newList[index] = { ...newList[index], time };
      setDraftActivities(newList);
  };

  const handleSaveRoutine = () => {
      if (!createName.trim()) {
          alert("Por favor, escribe un nombre para la rutina.");
          return;
      }
      if (draftActivities.length === 0) {
          alert("Agrega al menos una actividad o pictograma a la rutina.");
          return;
      }

      saveRoutineToLibrary(createName, `Creada manualmente`, draftActivities);
      alert("¡Rutina creada y guardada con éxito!");
      
      // Reset
      setCreateName('');
      setDraftActivities([]);
      setActiveTab('LIBRARY');
  };

  // --- Export/Import/Apply Handlers ---

  const handleShare = async (routine: SavedRoutine) => {
      const json = JSON.stringify(routine);
      const encoded = btoa(unescape(encodeURIComponent(json))); // Simple Base64 encode for easy copy
      
      const shareData = {
          title: `Rutina: ${routine.name}`,
          text: encoded,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
              return;
          } catch (err) {
              console.log("Share cancelled");
          }
      }
      
      try {
          await navigator.clipboard.writeText(encoded);
          alert("Código copiado al portapapeles (versión texto).");
      } catch (e) {
          prompt("Copia este código:", encoded);
      }
  };

  const handleDownloadFile = (routine: SavedRoutine) => {
      const json = JSON.stringify(routine, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize filename
      const safeName = routine.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `rutina_${safeName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success modal
      setShowDownloadSuccess(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              // Attempt to parse JSON
              const routineData: SavedRoutine = JSON.parse(text);

              // Basic validation
              if (!routineData.activities || !Array.isArray(routineData.activities)) {
                  throw new Error("El archivo no contiene una estructura de rutina válida.");
              }

              importRoutineToLibrary(routineData);
              alert(`¡Rutina "${routineData.name}" importada exitosamente!`);
              setActiveTab('LIBRARY');
              setImportError('');
          } catch (error) {
              console.error(error);
              setImportError("Error al leer el archivo. Asegúrate de que es un archivo .json válido generado por esta aplicación.");
          }
      };
      reader.readAsText(file);
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApply = (routineId: string) => {
      applyRoutineToDay(routineId, targetDay, targetPeriod);
      alert("Rutina aplicada y ordenada cronológicamente.");
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Book className="text-brand-primary" />
                 <h2 className="text-xl font-bold text-slate-800">Biblioteca de Rutinas</h2>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
            <button 
                onClick={() => setActiveTab('LIBRARY')} 
                className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 border-b-2 ${activeTab === 'LIBRARY' ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <Book size={16} /> Mis Rutinas
            </button>
            <button 
                onClick={() => setActiveTab('CREATE')} 
                className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 border-b-2 ${activeTab === 'CREATE' ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <PlusCircle size={16} /> Crear Nueva
            </button>
            <button 
                onClick={() => setActiveTab('IMPORT')} 
                className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 border-b-2 ${activeTab === 'IMPORT' ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <Download size={16} /> Importar
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            
            {/* --- TAB: LIBRARY --- */}
            {activeTab === 'LIBRARY' && (
                <div className="space-y-4">
                    {savedRoutines.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <Book size={48} className="mx-auto mb-2" />
                            <p>No tienes rutinas guardadas.</p>
                        </div>
                    ) : (
                        savedRoutines.map(routine => (
                            <div key={routine.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{routine.name}</h3>
                                        <p className="text-xs text-slate-500">{routine.activities.length} actividades</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleDownloadFile(routine)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
                                            title="Descargar archivo"
                                        >
                                            <FileJson size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleShare(routine)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
                                            title="Compartir código"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteRoutineFromLibrary(routine.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setExpandedRoutineId(expandedRoutineId === routine.id ? null : routine.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${expandedRoutineId === routine.id ? 'bg-slate-100 text-slate-600' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
                                        >
                                            {expandedRoutineId === routine.id ? 'Cerrar' : 'Usar'}
                                        </button>
                                    </div>
                                </div>

                                {expandedRoutineId === routine.id && (
                                    <div className="p-4 bg-slate-50 animate-in slide-in-from-top-2">
                                        {/* Activity Preview */}
                                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                                            {routine.activities.map((act, i) => {
                                                const pic = getPic(act.pictogramId, routine.requiredPictograms);
                                                return (
                                                    <div key={i} className="flex-shrink-0 w-16 flex flex-col items-center">
                                                        <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center">
                                                             {pic?.arasaacId ? (
                                                                 <img src={getArasaacImageUrl(pic.arasaacId)} className="w-10 h-10 object-contain" />
                                                             ) : (
                                                                 <PictogramIcon name={pic?.iconName || 'Circle'} />
                                                             )}
                                                        </div>
                                                        <span className="text-[10px] text-center mt-1 truncate w-full">{act.customLabel || pic?.label}</span>
                                                        {act.time && <span className="text-[9px] font-mono bg-slate-100 px-1 rounded mt-0.5">{act.time}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Apply Controls */}
                                        <div className="flex flex-col sm:flex-row gap-3 items-end bg-white p-3 rounded-xl border">
                                            <div className="flex-1 w-full">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Aplicar a Fecha:</label>
                                                <div className="relative group mt-1">
                                                    <input 
                                                        type="date" 
                                                        value={targetDay}
                                                        onChange={(e) => setTargetDay(e.target.value)}
                                                        className="w-full p-2 pr-8 border rounded-lg text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                                                    />
                                                    <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="text-xs font-bold text-slate-500 uppercase">En momento:</label>
                                                <div className="flex bg-slate-100 rounded-lg mt-1 p-1">
                                                    {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => (
                                                        <button 
                                                            key={p}
                                                            onClick={() => setTargetPeriod(p)}
                                                            className={`flex-1 py-1 rounded-md flex justify-center ${targetPeriod === p ? 'bg-white shadow text-brand-primary' : 'text-slate-400'}`}
                                                        >
                                                            {p === 'morning' ? <Sun size={16} /> : p === 'afternoon' ? <Sunset size={16} /> : <Moon size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleApply(routine.id)}
                                                className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> Aplicar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- TAB: CREATE --- */}
            {activeTab === 'CREATE' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2">Diseñar Rutina</h4>
                        <p className="text-sm text-blue-700">
                            Crea una nueva secuencia de actividades seleccionando los pictogramas y definiendo sus horarios.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Rutina</label>
                            <input 
                                type="text" 
                                value={createName} 
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Ej: Rutina de Calma, Pasos para ir al baño..."
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none bg-white text-slate-900" 
                            />
                        </div>

                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Actividades ({draftActivities.length})</label>
                                <button 
                                    onClick={() => setIsSelectorOpen(true)}
                                    className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <Plus size={14} /> Agregar Pictograma
                                </button>
                             </div>

                             {draftActivities.length === 0 ? (
                                 <div 
                                    onClick={() => setIsSelectorOpen(true)}
                                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-brand-primary hover:text-brand-primary hover:bg-blue-50 transition-all"
                                 >
                                     <PlusCircle size={32} className="mb-2" />
                                     <p className="text-sm font-medium">Toca para agregar el primer paso</p>
                                 </div>
                             ) : (
                                 <div className="space-y-2">
                                     {draftActivities.map((act, index) => {
                                         const pic = getPic(act.pictogramId);
                                         return (
                                             <div key={act.id} className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm">
                                                 <span className="w-6 text-center font-bold text-slate-300 text-xs">{index + 1}</span>
                                                 <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border shrink-0">
                                                     {pic?.arasaacId ? (
                                                         <img src={getArasaacImageUrl(pic.arasaacId)} className="w-8 h-8 object-contain" />
                                                     ) : (
                                                         <PictogramIcon name={pic?.iconName || 'Circle'} size={20} />
                                                     )}
                                                 </div>
                                                 
                                                 <div className="flex-1 min-w-0">
                                                     <p className="font-bold text-slate-700 text-sm truncate">{act.customLabel}</p>
                                                     <div className="flex items-center gap-1 mt-1">
                                                         <Clock size={12} className="text-slate-400" />
                                                         <input 
                                                            type="time" 
                                                            value={act.time || ''}
                                                            onChange={(e) => handleUpdateDraftTime(index, e.target.value)}
                                                            className="text-xs border rounded px-1 py-0.5 bg-slate-50 focus:ring-1 focus:ring-brand-primary outline-none w-20"
                                                         />
                                                     </div>
                                                 </div>
                                                 
                                                 <div className="flex gap-1">
                                                     <button onClick={() => handleMoveDraft(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded disabled:opacity-30">
                                                         <ArrowUp size={16} />
                                                     </button>
                                                     <button onClick={() => handleMoveDraft(index, 'down')} disabled={index === draftActivities.length - 1} className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded disabled:opacity-30">
                                                         <ArrowDown size={16} />
                                                     </button>
                                                     <button onClick={() => handleRemoveDraft(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                         <Trash2 size={16} />
                                                     </button>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                     
                                     <button 
                                        onClick={() => setIsSelectorOpen(true)}
                                        className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-brand-primary hover:text-brand-primary text-sm font-bold flex items-center justify-center gap-2 mt-2"
                                     >
                                         <Plus size={16} /> Agregar otro paso
                                     </button>
                                 </div>
                             )}
                        </div>

                        <button 
                            onClick={handleSaveRoutine}
                            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            <SaveIcon /> Guardar Rutina
                        </button>
                    </div>
                </div>
            )}

            {/* --- TAB: IMPORT --- */}
            {activeTab === 'IMPORT' && (
                <div className="space-y-6">
                    <div className="text-center space-y-2 mb-2">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                            <Download size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800">Importar Archivo</h3>
                        <p className="text-sm text-slate-500 px-4">
                            Selecciona el archivo <strong>.json</strong> que te envió el especialista o descargaste en otro dispositivo.
                        </p>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-brand-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <FileUp size={48} className="text-slate-400 mb-4" />
                        <span className="font-bold text-brand-primary text-lg mb-1">Toca para seleccionar archivo</span>
                        <span className="text-xs text-slate-400">Archivos soportados: .json</span>
                        
                        <input 
                            type="file" 
                            accept=".json,application/json"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {importError && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            <p className="text-red-600 text-sm font-medium">{importError}</p>
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
      
      {isSelectorOpen && (
          <PictogramSelectorModal 
            onSelect={handleAddPictogram} 
            onClose={() => setIsSelectorOpen(false)} 
          />
      )}

      {/* Download Success Popup */}
      {showDownloadSuccess && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border-4 border-green-50 transform scale-100 animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Check size={32} strokeWidth={4} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">¡Descarga Exitosa!</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        El archivo de la rutina se ha guardado en tu dispositivo. <br/>
                        <span className="font-bold text-slate-700">Puedes compartir este archivo</span> por WhatsApp, Email o Drive para importarlo en otro dispositivo.
                    </p>
                    <button 
                        onClick={() => setShowDownloadSuccess(false)}
                        className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                        Entendido
                    </button>
                </div>
            </div>
       )}
    </div>
  );
};

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
