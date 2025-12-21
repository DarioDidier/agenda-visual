
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, Activity, PictogramData, TimePeriod } from '../types';
import { PictogramCard } from '../components/PictogramCard';
import { Plus, ChevronLeft, ChevronRight, Grid, List, Trash2, CalendarDays, FileText, Loader2, Sparkles, Book, Sun, Sunset, Moon, X, AlertTriangle } from 'lucide-react';
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

const spanishDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const spanishMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ScheduleView: React.FC = () => {
  const { 
    schedule, mode, pictograms, clearDayActivities, deleteActivity,
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

  // Estados para el Modal de Confirmación de Borrado
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dayKey: string; dayName: string } | null>(null);

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
    if (dateKey < todayKey) return;
    setEditingDateKey(dateKey);
    setIsSelectorOpen(true);
  };

  const handleOpenDeleteModal = (dayKey: string, dayName: string) => {
      setDeleteModal({ isOpen: true, dayKey, dayName });
  };

  const confirmDeleteDay = () => {
      if (deleteModal) {
          clearDayActivities(deleteModal.dayKey);
          announce(`Rutina del ${deleteModal.dayName} eliminada.`);
          setDeleteModal(null);
      }
  };

  const handleExportPDF = async (dayKey: string, dateObj: Date) => {
    const activities = schedule[dayKey] || [];
    if (activities.length === 0) return;
    setGeneratingPdfFor(dayKey);
    try {
        const title = `${spanishDays[dateObj.getDay()]} ${dateObj.getDate()} de ${spanishMonths[dateObj.getMonth()]}`;
        await exportScheduleToPDF(title, activities, pictograms);
    } catch (e) {
        announce("Error al generar PDF.");
    } finally {
        setGeneratingPdfFor(null);
    }
  };

  const getPictogram = (id: string) => pictograms.find(p => p.id === id) || pictograms[0];

  // --- MODO NIÑO ---
  if (mode === UserMode.CHILD) {
    const displayDate = currentChildDayDate || new Date();
    const dayActivities = (schedule[currentChildDayKey] || []).filter(a => (a.period || 'morning') === childActivePeriod);
    
    return (
      <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className="p-4 bg-slate-50 rounded-2xl shadow-sm disabled:opacity-20 active:scale-90 transition-all"
            >
                <ChevronLeft size={40} className="text-brand-primary" />
            </button>
            <div className="text-center">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                    {spanishDays[displayDate.getDay()]} {displayDate.getDate()}
                </h2>
                <p className="text-slate-400 font-bold uppercase text-sm tracking-widest">{spanishMonths[displayDate.getMonth()]}</p>
            </div>
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
                disabled={selectedDayIndex === 6}
                className="p-4 bg-slate-50 rounded-2xl shadow-sm disabled:opacity-20 active:scale-90 transition-all"
            >
                <ChevronRight size={40} className="text-brand-primary" />
            </button>
        </div>

        <nav className="flex p-2 bg-slate-200/50 rounded-3xl mx-2 gap-2">
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((p) => {
                 const isActive = childActivePeriod === p;
                 return (
                    <button
                        key={p}
                        onClick={() => setChildActivePeriod(p)}
                        className={`flex-1 flex flex-col items-center py-4 rounded-2xl transition-all ${isActive ? 'bg-white shadow-lg scale-105 z-10' : 'opacity-40 hover:opacity-60'}`}
                    >
                        {p === 'morning' ? <Sun className="text-yellow-500" size={32} /> : p === 'afternoon' ? <Sunset className="text-orange-500" size={32} /> : <Moon className="text-indigo-500" size={32} />}
                        <span className={`text-sm font-black mt-1 uppercase ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                            {p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}
                        </span>
                    </button>
                 );
            })}
        </nav>

        <div className="flex-1 overflow-y-auto pb-24 px-2">
             {dayActivities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                     <CalendarDays size={80} className="opacity-20 mb-4" />
                     <p className="text-2xl font-black">¡Momento de descanso!</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {dayActivities.map((activity) => (
                        <PictogramCard 
                            key={activity.id}
                            activity={activity} 
                            pictogram={getPictogram(activity.pictogramId)} 
                            day={currentChildDayKey}
                        />
                    ))}
                 </div>
             )}
        </div>
      </div>
    );
  }

  // --- MODO ADULTO ---
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      <header className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 shadow-inner">
                <button onClick={() => changeWeek(-1)} className="p-3 hover:bg-white rounded-xl transition-all">
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <button onClick={goToToday} className="px-6 py-2 text-sm font-black text-slate-700 hover:text-brand-primary transition-colors uppercase">ESTA SEMANA</button>
                <button onClick={() => changeWeek(1)} className="p-3 hover:bg-white rounded-xl transition-all">
                    <ChevronRight size={24} className="text-slate-600" />
                </button>
              </div>
              <h2 className="text-2xl font-black text-slate-800 border-l-4 border-brand-primary pl-4 uppercase">
                  {spanishMonths[weekDates[0].getMonth()]} {weekDates[0].getFullYear()}
              </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
               <Link to="/ai" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                   <Sparkles size={20} /> ASISTENTE AI
               </Link>
               <button onClick={() => setIsLibraryOpen(true)} className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                   <Book size={20} /> BIBLIOTECA
               </button>
               <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button onClick={() => setViewFormat('grid')} className={`p-2.5 rounded-xl transition-all ${viewFormat === 'grid' ? 'bg-white shadow-md text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Grid size={20} />
                    </button>
                    <button onClick={() => setViewFormat('linear')} className={`p-2.5 rounded-xl transition-all ${viewFormat === 'linear' ? 'bg-white shadow-md text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                        <List size={20} />
                    </button>
               </div>
          </div>
      </header>

      <div className={`${viewFormat === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 items-start' : 'flex flex-col gap-8'}`}>
        {weekDates.map((dateObj) => {
            const dayKey = getDateKey(dateObj);
            const isToday = dayKey === todayKey;
            const isPast = dayKey < todayKey;
            const dayActivities = schedule[dayKey] || [];
            const dayName = spanishDays[dateObj.getDay()];

            return (
            <section key={dayKey} className={`bg-white rounded-3xl border shadow-sm flex flex-col relative transition-all duration-300 ${isToday ? 'ring-4 ring-brand-primary ring-offset-4' : 'hover:border-slate-300'} ${isPast ? 'opacity-70 bg-slate-50/50 grayscale-[0.3]' : ''}`}>
                <div className={`p-4 flex justify-between items-center rounded-t-3xl border-b ${isToday ? 'bg-brand-primary/5' : 'bg-slate-50/30'}`}>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{dayName}</span>
                        <span className="text-xl font-black text-slate-800">{dateObj.getDate()}</span>
                    </div>
                    <div className="flex gap-1">
                        {/* Botón de borrar restringido a Hoy o Futuro */}
                        {!isPast && dayActivities.length > 0 && (
                            <button 
                                onClick={() => handleOpenDeleteModal(dayKey, dayName)} 
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                                title="Borrar rutina completa"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button onClick={() => handleExportPDF(dayKey, dateObj)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Exportar PDF">
                            {generatingPdfFor === dayKey ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        </button>
                        {!isPast && (
                            <button onClick={() => handleAddActivity(dayKey)} className="p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-sm" title="Añadir actividad">
                                <Plus size={20} />
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="p-4 space-y-3 min-h-[120px]">
                    {dayActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                            <Plus size={32} className="text-slate-400" />
                        </div>
                    ) : (
                        dayActivities.map((activity) => (
                            <PictogramCard 
                                key={activity.id}
                                activity={activity} 
                                pictogram={getPictogram(activity.pictogramId)}
                                onDelete={!isPast ? () => deleteActivity(dayKey, activity.id) : undefined}
                            />
                        ))
                    )}
                </div>
            </section>
        )})}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {deleteModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
              <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full text-center border-4 border-red-50 animate-in zoom-in-95 duration-200">
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">¿Borrar rutina?</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                      Estás a punto de borrar todas las actividades del <strong>{deleteModal.dayName}</strong>. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={confirmDeleteDay}
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
                      >
                          Borrrar Todo
                      </button>
                      <button 
                        onClick={() => setDeleteModal(null)}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 active:scale-95 transition-all"
                      >
                          Cancelar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isLibraryOpen && <RoutineLibraryModal onClose={() => setIsLibraryOpen(false)} />}
      {isSelectorOpen && editingDateKey && (
          <PictogramSelectorModal 
            onSelect={(pic) => {
                const newActivity: Activity = {
                    id: crypto.randomUUID(),
                    pictogramId: pic.id,
                    customLabel: pic.label,
                    time: "09:00",
                    period: 'morning',
                    isDone: false
                };
                useApp().setSchedule(prev => ({
                    ...prev,
                    [editingDateKey]: [...(prev[editingDateKey] || []), newActivity]
                }));
                setIsSelectorOpen(false);
            }} 
            onClose={() => setIsSelectorOpen(false)} 
          />
      )}
    </div>
  );
};
