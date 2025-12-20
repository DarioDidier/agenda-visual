import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, Activity, PictogramData, TimePeriod } from '../types';
import { PictogramCard } from '../components/PictogramCard';
import { Plus, ChevronLeft, ChevronRight, Grid, List, Copy, Trash2, CalendarDays, AlertTriangle, X, Calendar as CalendarIcon, ArrowLeftCircle, ArrowRightCircle, ChevronDown, Sun, Sunset, Moon, Gift, Lock, Book, FileText, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';
import { RoutineLibraryModal } from '../components/RoutineLibraryModal';
import { exportScheduleToPDF } from '../services/pdfService';

const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const spanishMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ScheduleView: React.FC = () => {
  const { 
    schedule, setSchedule, mode, pictograms, settings, deleteActivity,
    goToToday, changeWeek, weekDates 
  } = useApp();
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
     const today = new Date().getDay();
     return today === 0 ? 6 : today - 1;
  });

  const [viewFormat, setViewFormat] = useState<'linear' | 'grid'>('grid');
  const [childActivePeriod, setChildActivePeriod] = useState<TimePeriod>('morning');
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingDateKey, setEditingDateKey] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [generatingPdfFor, setGeneratingPdfFor] = useState<string | null>(null);

  const currentChildDayDate = weekDates[selectedDayIndex];
  const currentChildDayKey = currentChildDayDate ? getDateKey(currentChildDayDate) : '';
  const todayKey = getDateKey(new Date());

  const announce = (msg: string) => {
    const el = document.getElementById('accessibility-announcer');
    if (el) el.textContent = msg;
  };

  useEffect(() => {
    if (mode === UserMode.CHILD) {
        goToToday();
        const today = new Date().getDay();
        setSelectedDayIndex(today === 0 ? 6 : today - 1);
    }
  }, [mode]);

  const handleAddActivity = (dateKey: string) => {
    if (dateKey < todayKey) {
        announce("No se pueden agregar actividades a días que ya han pasado.");
        return;
    }
    setEditingDateKey(dateKey);
    setIsSelectorOpen(true);
  };

  const handleExportPDF = async (dayKey: string, dateObj: Date) => {
    const activities = schedule[dayKey] || [];
    if (activities.length === 0) return;
    setGeneratingPdfFor(dayKey);
    try {
        const title = `${spanishDays[dateObj.getDay()]} ${dateObj.getDate()} de ${spanishMonths[dateObj.getMonth()]}`;
        await exportScheduleToPDF(title, activities, pictograms);
        announce("PDF generado con éxito. Iniciando descarga.");
    } catch (e) {
        announce("Error al generar el PDF.");
    } finally {
        setGeneratingPdfFor(null);
    }
  };

  const getPictogram = (id: string) => pictograms.find(p => p.id === id) || pictograms[0];

  // --- CHILD MODE ---
  if (mode === UserMode.CHILD) {
    const displayDate = currentChildDayDate || new Date();
    const dayActivities = schedule[currentChildDayKey] || [];
    const filteredActivities = dayActivities.filter(a => (a.period || 'morning') === childActivePeriod);
    const progress = filteredActivities.length > 0 ? Math.round((filteredActivities.filter(a => a.isDone).length / filteredActivities.length) * 100) : 0;
    
    return (
      <div className="flex flex-col h-full space-y-4">
        <h1 className="sr-only">Agenda de {spanishDays[displayDate.getDay()]}</h1>
        <div className="flex items-center justify-between mb-2">
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30"
                aria-label="Ver día anterior"
            >
                <ChevronLeft size={32} aria-hidden="true" />
            </button>
            <div className="text-center" aria-live="polite">
                <h2 className={`text-3xl font-bold ${settings.highContrast ? 'text-black' : 'text-brand-primary'}`}>
                    {spanishDays[displayDate.getDay()]}
                </h2>
                <p className="text-slate-500 font-bold">{displayDate.getDate()} de {spanishMonths[displayDate.getMonth()]}</p>
            </div>
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
                disabled={selectedDayIndex === 6}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30"
                aria-label="Ver día siguiente"
            >
                <ChevronRight size={32} aria-hidden="true" />
            </button>
        </div>

        <nav className="flex p-1 bg-slate-200 rounded-2xl mx-2" aria-label="Momentos del día">
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((p) => {
                 let icon = <Sun aria-hidden="true" />;
                 let label = "Mañana";
                 if(p === 'afternoon') { icon = <Sunset aria-hidden="true" />; label = "Tarde"; }
                 if(p === 'evening') { icon = <Moon aria-hidden="true" />; label = "Noche"; }
                 const isActive = childActivePeriod === p;
                 return (
                    <button
                        key={p}
                        onClick={() => { setChildActivePeriod(p); announce(`Cambiado a rutinas de la ${label}`); }}
                        aria-pressed={isActive}
                        className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${isActive ? 'bg-white shadow-md' : 'opacity-60'}`}
                    >
                        <div className={isActive ? 'text-brand-primary' : 'text-slate-50'}>{icon}</div>
                        <span className={`text-sm font-bold mt-1 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
                    </button>
                 );
            })}
        </nav>

        {filteredActivities.length > 0 && (
             <div className="px-4" aria-hidden="true">
                 <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                 </div>
                 <p className="sr-only">Progreso de este momento: {progress} por ciento.</p>
             </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20 px-2" role="list">
             {filteredActivities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                     <p className="text-xl font-medium">No hay actividades ahora</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredActivities.map((activity) => (
                        <div key={activity.id} role="listitem">
                            <PictogramCard 
                                activity={activity} 
                                pictogram={getPictogram(activity.pictogramId)} 
                                day={currentChildDayKey}
                            />
                        </div>
                    ))}
                 </div>
             )}
        </div>
      </div>
    );
  }

  // --- ADULT MODE ---
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Gestión de Agenda Semanal</h1>
      <header className="bg-white p-4 rounded-2xl shadow-sm border md:flex md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
              <nav className="flex items-center bg-slate-100 rounded-xl p-1" aria-label="Navegación semanal">
                <button onClick={() => { changeWeek(-1); announce("Semana anterior"); }} className="p-2 hover:bg-white rounded-lg" aria-label="Ir a semana anterior">
                    <ArrowLeftCircle size={24} aria-hidden="true" />
                </button>
                <button onClick={goToToday} className="px-4 py-1 text-sm font-bold text-slate-600">Hoy</button>
                <button onClick={() => { changeWeek(1); announce("Semana siguiente"); }} className="p-2 hover:bg-white rounded-lg" aria-label="Ir a semana siguiente">
                    <ArrowRightCircle size={24} aria-hidden="true" />
                </button>
              </nav>
              <h2 className="text-lg font-bold text-slate-800" aria-live="polite">
                  Semana del {formatHeaderDate(weekDates[0])}
              </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
               <Link to="/ai" className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-amber-200 hover:bg-amber-200 transition-colors shadow-sm">
                   <Sparkles size={18} className="text-amber-500" /> Asistente Mágico (IA)
               </Link>
               <button onClick={() => setIsLibraryOpen(true)} className="bg-brand-secondary text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                   <Book size={18} aria-hidden="true" /> Biblioteca
               </button>
               <div className="flex bg-slate-100 p-1 rounded-lg border">
                    <button onClick={() => setViewFormat('grid')} className={`p-2 rounded-md ${viewFormat === 'grid' ? 'bg-white shadow text-brand-primary' : 'text-slate-400'}`} aria-label="Vista cuadrícula">
                        <Grid size={18} />
                    </button>
                    <button onClick={() => setViewFormat('linear')} className={`p-2 rounded-md ${viewFormat === 'linear' ? 'bg-white shadow text-brand-primary' : 'text-slate-400'}`} aria-label="Vista lista">
                        <List size={18} />
                    </button>
               </div>
          </div>
      </header>

      <div className={`${viewFormat === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col gap-8'}`}>
        {weekDates.map((dateObj) => {
            const dayKey = getDateKey(dateObj);
            const isToday = dayKey === todayKey;
            const isPast = dayKey < todayKey;
            const dayActivities = schedule[dayKey] || [];
            return (
            <section key={dayKey} className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col relative ${isToday ? 'ring-2 ring-brand-primary' : ''} ${isPast ? 'opacity-90 bg-slate-50/50' : ''}`} aria-labelledby={`heading-${dayKey}`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 id={`heading-${dayKey}`} className="font-bold text-lg text-slate-700 capitalize flex items-center gap-2">
                        {spanishDays[dateObj.getDay()]} <span className="text-brand-primary">{dateObj.getDate()}</span>
                        {isPast && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Historial</span>}
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={() => handleExportPDF(dayKey, dateObj)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" aria-label={`Exportar agenda del ${spanishDays[dateObj.getDay()]} a PDF`}>
                            {generatingPdfFor === dayKey ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        </button>
                        {!isPast && (
                            <button onClick={() => handleAddActivity(dayKey)} className="p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors" aria-label={`Agregar actividad al ${spanishDays[dateObj.getDay()]}`}>
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-3" role="list">
                    {dayActivities.length === 0 && <p className="text-slate-300 text-xs italic text-center py-4">Sin actividades</p>}
                    {dayActivities.map((activity) => (
                        <div key={activity.id} role="listitem">
                            <PictogramCard 
                                activity={activity} 
                                pictogram={getPictogram(activity.pictogramId)}
                                onDelete={!isPast ? () => { deleteActivity(dayKey, activity.id); announce("Actividad eliminada"); } : undefined}
                            />
                        </div>
                    ))}
                </div>
            </section>
        )})}
      </div>

      {isLibraryOpen && <RoutineLibraryModal onClose={() => setIsLibraryOpen(false)} />}
      {isSelectorOpen && <PictogramSelectorModal onSelect={(pic) => { /* logic inside selector */ setIsSelectorOpen(false); announce("Pictograma seleccionado"); }} onClose={() => setIsSelectorOpen(false)} />}
    </div>
  );
};

const formatHeaderDate = (d: Date) => `${d.getDate()} de ${spanishMonths[d.getMonth()]}`;