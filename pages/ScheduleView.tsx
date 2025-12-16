import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, Activity, PictogramData, TimePeriod } from '../types';
import { PictogramCard } from '../components/PictogramCard';
import { Plus, ChevronLeft, ChevronRight, Grid, List, Copy, Trash2, CalendarDays, AlertTriangle, X, Calendar as CalendarIcon, ArrowLeftCircle, ArrowRightCircle, ChevronDown, Sun, Sunset, Moon, Gift, Lock, Book, FileText, Loader2 } from 'lucide-react';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';
import { ActivityEditModal } from '../components/ActivityEditModal';
import { CopyDayModal } from '../components/CopyDayModal';
import { CongratulationModal } from '../components/CongratulationModal';
import { RewardConfigModal } from '../components/RewardConfigModal';
import { RoutineLibraryModal } from '../components/RoutineLibraryModal';
import { speakText } from '../services/speechService';
import { exportScheduleToPDF } from '../services/pdfService';

// Helper for formatting date key (YYYY-MM-DD) in local time
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
    schedule, setSchedule, mode, pictograms, settings, updateActivity, deleteActivity, copyRoutine,
    rewards, setReward, redeemReward,
    currentDate, setCurrentDate, changeWeek, goToToday, weekDates 
  } = useApp();
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
     // For child mode, default to the index of today within the current week view
     const today = new Date().getDay(); // 0 is Sunday
     return today === 0 ? 6 : today - 1; // Map to 0-6 (Mon-Sun)
  });

  const [viewFormat, setViewFormat] = useState<'linear' | 'grid'>('grid');
  
  // Logic for congratulations
  const [congratsConfig, setCongratsConfig] = useState<{show: boolean, title: string, message: string} | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const [childActivePeriod, setChildActivePeriod] = useState<TimePeriod>('morning');
  
  // Modals state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingDateKey, setEditingDateKey] = useState<string | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<{dayKey: string, activity: Activity} | null>(null);
  const [copyingDateKey, setCopyingDateKey] = useState<string | null>(null);
  const [rewardConfig, setRewardConfig] = useState<{dayKey: string, period: TimePeriod} | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [generatingPdfFor, setGeneratingPdfFor] = useState<string | null>(null);

  // Deletion Confirmation State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE_ACTIVITY' | 'CLEAR_DAY';
    dayKey: string;
    activityId?: string;
  } | null>(null);

  // Logic to find "Current Selected Day" for Child Mode
  const currentChildDayDate = weekDates[selectedDayIndex];
  const currentChildDayKey = currentChildDayDate ? getDateKey(currentChildDayDate) : '';
  const todayKey = getDateKey(new Date());

  // Set default period based on current time when entering child mode
  useEffect(() => {
      if (mode === UserMode.CHILD) {
          const hours = new Date().getHours();
          if (hours >= 19) setChildActivePeriod('evening');
          else if (hours >= 13) setChildActivePeriod('afternoon');
          else setChildActivePeriod('morning');
      }
  }, [mode]);

  // Reset completed sections when day changes
  useEffect(() => {
    setCompletedSections(new Set());
  }, [currentChildDayKey]);

  // Logic to trigger congratulations in Child Mode (Specific Periods & Full Day)
  useEffect(() => {
    if (mode === UserMode.CHILD && currentChildDayKey) {
      const allActivities = schedule[currentChildDayKey] || [];
      if (allActivities.length === 0) return;

      const periods: TimePeriod[] = ['morning', 'afternoon', 'evening'];
      
      // 1. Check Full Day Completion
      const isDayDone = allActivities.every(a => a.isDone);
      if (isDayDone && !completedSections.has('DAY_COMPLETE')) {
          setCongratsConfig({
              show: true,
              title: "¡Día Completado!",
              message: "¡Felicidades! Has terminado todas las rutinas del día. Eres increíble."
          });
          setCompletedSections(prev => new Set(prev).add('DAY_COMPLETE').add('morning').add('afternoon').add('evening'));
          return; // Stop checking periods if day is done to avoid double popup
      }

      // 2. Check Individual Periods (Only if day not just marked complete)
      if (!isDayDone) {
          periods.forEach(p => {
              const pActs = allActivities.filter(a => a.period === p);
              if (pActs.length > 0) {
                  const isPeriodDone = pActs.every(a => a.isDone);
                  if (isPeriodDone && !completedSections.has(p)) {
                      let periodName = "mañana";
                      if (p === 'afternoon') periodName = "tarde";
                      if (p === 'evening') periodName = "noche";

                      setCongratsConfig({
                          show: true,
                          title: "¡Muy bien!",
                          message: `¡Felicidades! Terminaste las rutinas de la ${periodName}.`
                      });
                      setCompletedSections(prev => new Set(prev).add(p));
                  }
              }
          });
      }
    }
  }, [schedule, currentChildDayKey, mode, completedSections]);

  // Ensure Child Mode defaults to "Today" on mount/mode switch
  useEffect(() => {
      if (mode === UserMode.CHILD) {
          goToToday();
          const today = new Date().getDay();
          const idx = today === 0 ? 6 : today - 1;
          setSelectedDayIndex(idx);
      }
  }, [mode]);

  const handleAddActivity = (dateKey: string) => {
    setEditingDateKey(dateKey);
    setIsSelectorOpen(true);
  };

  const confirmAddActivity = (pic: PictogramData) => {
    if (!editingDateKey) return;
    
    // Default period based on existing items or simple guess
    const existing = schedule[editingDateKey] || [];
    const last = existing[existing.length - 1];
    const defaultPeriod = last?.period || 'morning';

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      pictogramId: pic.id,
      customLabel: pic.label,
      isDone: false,
      time: '09:00',
      period: defaultPeriod
    };

    setSchedule(prev => ({
      ...prev,
      [editingDateKey]: [...(prev[editingDateKey] || []), newActivity]
    }));
    setIsSelectorOpen(false);
    setActivityToEdit({ dayKey: editingDateKey, activity: newActivity });
  };

  const handleRequestDeleteActivity = (dayKey: string, activityId: string) => {
    setConfirmAction({ type: 'DELETE_ACTIVITY', dayKey, activityId });
  };
  
  const handleRequestClearDay = (dayKey: string) => {
      const count = schedule[dayKey]?.length || 0;
      if (count === 0) return;
      setConfirmAction({ type: 'CLEAR_DAY', dayKey });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'DELETE_ACTIVITY' && confirmAction.activityId) {
        deleteActivity(confirmAction.dayKey, confirmAction.activityId);
    } else if (confirmAction.type === 'CLEAR_DAY') {
        setSchedule(prev => ({ ...prev, [confirmAction.dayKey]: [] }));
    }
    setConfirmAction(null);
  };

  const moveActivity = (dayKey: string, index: number, direction: 'up' | 'down') => {
      setSchedule(prev => {
        const list = [...(prev[dayKey] || [])];
        if (direction === 'up' && index > 0) {
            [list[index - 1], list[index]] = [list[index], list[index - 1]];
        } else if (direction === 'down' && index < list.length - 1) {
            [list[index + 1], list[index]] = [list[index], list[index + 1]];
        }
        return { ...prev, [dayKey]: list };
      });
  };

  const handleUpdateActivity = (updates: Partial<Activity>) => {
      if (!activityToEdit) return;
      updateActivity(activityToEdit.dayKey, activityToEdit.activity.id, updates);
  };

  const handleExportPDF = async (dayKey: string, dateObj: Date) => {
    const activities = schedule[dayKey] || [];
    if (activities.length === 0) return;

    setGeneratingPdfFor(dayKey);
    try {
        const title = `${spanishDays[dateObj.getDay()]} ${dateObj.getDate()} de ${spanishMonths[dateObj.getMonth()]}`;
        await exportScheduleToPDF(title, activities, pictograms);
    } catch (e) {
        console.error(e);
        alert("Error al generar PDF. Intenta nuevamente.");
    } finally {
        setGeneratingPdfFor(null);
    }
  };

  const getPictogram = (id: string) => pictograms.find(p => p.id === id) || pictograms[0];

  const formatHeaderDate = (d: Date) => {
      return `${d.getDate()} de ${spanishMonths[d.getMonth()]}`;
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val) {
          const parts = val.split('-');
          const newD = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
          setCurrentDate(newD);
      }
  };

  const handleRewardSave = (label: string, emoji: string, imageUrl?: string) => {
      if (rewardConfig) {
          setReward(rewardConfig.dayKey, rewardConfig.period, label, emoji, imageUrl);
          setRewardConfig(null);
      }
  };

  const handleRewardRedeem = (dayKey: string, period: TimePeriod) => {
      redeemReward(dayKey, period);
      speakText("¡Premio canjeado! ¡Disfrútalo!");
      // We don't necessarily show the generic congrats modal here as the card itself updates, 
      // but we could if we wanted. For now, the visual feedback on the card is strong.
  };

  // --- CHILD MODE RENDER ---
  if (mode === UserMode.CHILD) {
    const displayDate = currentChildDayDate || new Date();
    const dayActivities = schedule[currentChildDayKey] || [];
    
    const filteredActivities = dayActivities.filter(a => (a.period || 'morning') === childActivePeriod);
    const progress = filteredActivities.length > 0 
        ? Math.round((filteredActivities.filter(a => a.isDone).length / filteredActivities.length) * 100) 
        : 0;
    
    const currentRewardKey = `${currentChildDayKey}-${childActivePeriod}`;
    const activeReward = rewards[currentRewardKey];
    const isPeriodComplete = filteredActivities.length > 0 && progress === 100;

    return (
      <div className="flex flex-col h-full space-y-4 relative">
        <div className="flex items-center justify-between mb-2">
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30 active:scale-95"
            >
                <ChevronLeft size={32} />
            </button>
            
            <div className="text-center">
                <h2 className={`text-3xl font-bold ${settings.highContrast ? 'text-black' : 'text-brand-primary'}`}>
                    {spanishDays[displayDate.getDay()]}
                </h2>
                <p className="text-slate-500 font-bold">{displayDate.getDate()} de {spanishMonths[displayDate.getMonth()]}</p>
            </div>

            <button 
                onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
                disabled={selectedDayIndex === 6}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30 active:scale-95"
            >
                <ChevronRight size={32} />
            </button>
        </div>

        {/* Period Tabs */}
        <div className="flex p-1 bg-slate-200 rounded-2xl mx-2">
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((p) => {
                 let icon = <Sun />;
                 let label = "Mañana";
                 let colorClass = "text-yellow-600";
                 if(p === 'afternoon') { icon = <Sunset />; label = "Tarde"; colorClass = "text-orange-600"; }
                 if(p === 'evening') { icon = <Moon />; label = "Noche"; colorClass = "text-purple-600"; }
                 
                 const isActive = childActivePeriod === p;
                 
                 return (
                    <button
                        key={p}
                        onClick={() => setChildActivePeriod(p)}
                        className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white shadow-md scale-100' : 'scale-95 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={isActive ? colorClass : 'text-slate-500'}>{icon}</div>
                        <span className={`text-sm font-bold mt-1 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
                    </button>
                 );
            })}
        </div>

        {/* Progress Bar */}
        {filteredActivities.length > 0 && (
             <div className="px-4">
                 <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-brand-primary transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                     />
                 </div>
             </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-20 px-2">
             {filteredActivities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                     <CalendarDays size={64} className="mb-4 opacity-50"/>
                     <p className="text-xl font-medium">No hay actividades para esta hora</p>
                 </div>
             ) : (
                 <div className="space-y-6 pb-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredActivities.map((activity) => (
                            <PictogramCard 
                                key={activity.id} 
                                activity={activity} 
                                pictogram={getPictogram(activity.pictogramId)} 
                                day={currentChildDayKey}
                            />
                        ))}
                     </div>
                     
                     {/* Reward Section */}
                     {activeReward && (
                         <div className="mt-8 animate-in slide-in-from-bottom-6 fade-in duration-500">
                             {isPeriodComplete ? (
                                 <button 
                                    onClick={() => !activeReward.isRedeemed && handleRewardRedeem(currentChildDayKey, childActivePeriod)}
                                    disabled={activeReward.isRedeemed}
                                    className={`w-full p-6 rounded-3xl border-4 ${activeReward.isRedeemed ? 'bg-slate-100 border-slate-300' : 'bg-pink-50 border-pink-300 animate-pulse hover:animate-none'} flex items-center justify-between shadow-xl transition-transform active:scale-95`}
                                 >
                                     <div className="flex items-center gap-4 w-full">
                                         <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl overflow-hidden shadow-sm">
                                            {activeReward.imageUrl ? (
                                                <img src={activeReward.imageUrl} alt="Premio" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-5xl">{activeReward.emoji}</span>
                                            )}
                                         </div>
                                         <div className="text-left flex-1 min-w-0">
                                             <h3 className="font-bold text-2xl text-slate-800">{activeReward.isRedeemed ? '¡Premio Canjeado!' : '¡Premio Desbloqueado!'}</h3>
                                             <p className="text-lg text-slate-600 font-medium truncate">{activeReward.label}</p>
                                         </div>
                                         {!activeReward.isRedeemed && <Gift size={40} className="text-pink-500 flex-shrink-0" />}
                                     </div>
                                 </button>
                             ) : (
                                 <div className="w-full p-4 rounded-3xl bg-slate-100 border-2 border-slate-200 flex items-center gap-4 opacity-70">
                                     <div className="p-3 bg-slate-200 rounded-full text-slate-400">
                                         <Lock size={24} />
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-lg text-slate-500">Premio por completar</h3>
                                         <p className="text-sm text-slate-400">Termina todas las tareas para ver el premio.</p>
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             )}
        </div>

        {congratsConfig && congratsConfig.show && (
            <CongratulationModal 
                title={congratsConfig.title}
                message={congratsConfig.message}
                onClose={() => setCongratsConfig(null)} 
            />
        )}
      </div>
    );
  }

  // --- ADULT MODE RENDER ---
  return (
    <div className="space-y-6">
      {/* Calendar & Navigation Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          
          <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                    <ArrowLeftCircle size={24} />
                </button>
                <button onClick={goToToday} className="px-4 py-1 text-sm font-bold text-slate-600 hover:text-brand-primary">
                    Hoy
                </button>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                    <ArrowRightCircle size={24} />
                </button>
              </div>

              <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CalendarIcon size={18} className="text-brand-primary" />
                      {formatHeaderDate(weekDates[0])} - {formatHeaderDate(weekDates[6])}
                  </h2>
                  <p className="text-xs text-slate-500">{weekDates[0].getFullYear()}</p>
              </div>
          </div>

          <div className="flex items-center gap-3">
               
               <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="bg-brand-secondary text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors shadow-sm"
                  title="Biblioteca de Rutinas"
               >
                   <Book size={18} />
                   <span className="hidden sm:inline">Biblioteca</span>
               </button>

               <div className="relative group">
                   <input 
                      type="date"
                      min={todayKey}
                      onChange={handleDateInput}
                      value={getDateKey(currentDate)}
                      className="pl-10 pr-10 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-slate-700 font-medium cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                   />
                   <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>

               <div className="flex bg-slate-100 p-1 rounded-lg border">
                    <button 
                        onClick={() => setViewFormat('grid')}
                        className={`p-2 rounded-md ${viewFormat === 'grid' ? 'bg-white shadow text-brand-primary' : 'text-slate-400'}`}
                        title="Vista Cuadrícula"
                    >
                        <Grid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewFormat('linear')}
                        className={`p-2 rounded-md ${viewFormat === 'linear' ? 'bg-white shadow text-brand-primary' : 'text-slate-400'}`}
                        title="Vista Lista"
                    >
                        <List size={18} />
                    </button>
               </div>
          </div>
      </div>

      {/* Week Grid */}
      <div className={`${viewFormat === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-8'}`}>
        {weekDates.map((dateObj) => {
            const dayKey = getDateKey(dateObj);
            const isToday = dayKey === todayKey;
            const isPast = dayKey < todayKey;
            const dayActivities = schedule[dayKey] || [];
            const isGeneratingThis = generatingPdfFor === dayKey;

            return (
            <div key={dayKey} className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col group/day relative ${isToday ? 'ring-2 ring-brand-primary ring-offset-2' : ''} ${isPast ? 'bg-slate-50 opacity-80' : ''}`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <div>
                        <h3 className="font-bold text-lg text-slate-700 capitalize">
                            {spanishDays[dateObj.getDay()]} <span className="text-brand-primary">{dateObj.getDate()}</span>
                        </h3>
                    </div>
                    
                    {!isPast && (
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover/day:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleExportPDF(dayKey, dateObj)}
                            disabled={dayActivities.length === 0 || isGeneratingThis}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            title="Exportar PDF para imprimir"
                        >
                            {isGeneratingThis ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        </button>
                        <button
                            onClick={() => setCopyingDateKey(dayKey)}
                            className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Copiar rutina"
                            disabled={dayActivities.length === 0}
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            onClick={() => handleRequestClearDay(dayKey)}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                            title="Borrar día"
                            disabled={dayActivities.length === 0}
                        >
                            <Trash2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleAddActivity(dayKey)}
                            className="ml-2 p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors shadow-sm"
                            title="Agregar Actividad"
                        >
                            <Plus size={18} />
                        </button>
                        </div>
                    )}
                </div>

                {/* Reward Configuration Buttons (Adult) */}
                {!isPast && (
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                        {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => {
                            const hasReward = !!rewards[`${dayKey}-${p}`];
                            let icon = <Sun size={12} />;
                            let bg = "bg-yellow-50 text-yellow-600 border-yellow-200";
                            if(p === 'afternoon') { icon = <Sunset size={12} />; bg = "bg-orange-50 text-orange-600 border-orange-200"; }
                            if(p === 'evening') { icon = <Moon size={12} />; bg = "bg-purple-50 text-purple-600 border-purple-200"; }
                            
                            return (
                                <button
                                    key={p}
                                    onClick={() => setRewardConfig({ dayKey, period: p })}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${bg} ${hasReward ? 'ring-1 ring-offset-1 ring-pink-400' : 'opacity-70 hover:opacity-100'}`}
                                    title={`Configurar premio de ${p}`}
                                >
                                    {icon}
                                    {hasReward && <Gift size={10} className="text-pink-500" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className={`space-y-3 min-h-[120px] ${viewFormat === 'linear' ? 'flex flex-row space-y-0 space-x-4 overflow-x-auto pb-4' : ''}`}>
                    {dayActivities.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 py-6 border-2 border-dashed border-slate-100 rounded-xl">
                            <span className="text-xs italic">Sin actividades</span>
                            {!isPast && (
                                <button 
                                    onClick={() => handleAddActivity(dayKey)}
                                    className="mt-2 text-xs font-bold text-brand-primary hover:underline"
                                >
                                    + Agregar
                                </button>
                            )}
                        </div>
                    )}
                    {dayActivities.map((activity, idx) => {
                        // Determine border color based on period
                        let borderColor = "border-transparent";
                        if (activity.period === 'morning') borderColor = "border-l-4 border-l-yellow-400";
                        else if (activity.period === 'afternoon') borderColor = "border-l-4 border-l-orange-400";
                        else if (activity.period === 'evening') borderColor = "border-l-4 border-l-purple-400";

                        return (
                            <div key={activity.id} className={`${viewFormat === 'linear' ? 'min-w-[150px]' : ''} ${borderColor} pl-1`}>
                                <PictogramCard 
                                    activity={activity} 
                                    pictogram={getPictogram(activity.pictogramId)}
                                    onDelete={!isPast ? () => handleRequestDeleteActivity(dayKey, activity.id) : undefined}
                                    onEdit={!isPast ? () => setActivityToEdit({ dayKey, activity }) : undefined}
                                    onMoveUp={!isPast ? () => moveActivity(dayKey, idx, 'up') : undefined}
                                    onMoveDown={!isPast ? () => moveActivity(dayKey, idx, 'down') : undefined}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        )})}
      </div>

      {isLibraryOpen && (
          <RoutineLibraryModal 
             onClose={() => setIsLibraryOpen(false)}
             currentDayKey={getDateKey(currentDate)} // Pass the currently selected single date in the header
          />
      )}

      {isSelectorOpen && (
          <PictogramSelectorModal 
            onSelect={confirmAddActivity} 
            onClose={() => setIsSelectorOpen(false)} 
          />
      )}

      {activityToEdit && (
          <ActivityEditModal
            activity={activityToEdit.activity}
            onClose={() => setActivityToEdit(null)}
            onSave={handleUpdateActivity}
            onChangePictogram={() => {
                setActivityToEdit(null);
                setEditingDateKey(activityToEdit.dayKey);
            }}
          />
      )}

      {copyingDateKey && (
        <CopyDayModal
          sourceDay={copyingDateKey}
          onClose={() => setCopyingDateKey(null)}
          onCopy={(targetDayKey) => copyRoutine(copyingDateKey, targetDayKey)}
        />
      )}

      {rewardConfig && (
          <RewardConfigModal 
            period={rewardConfig.period}
            initialLabel={rewards[`${rewardConfig.dayKey}-${rewardConfig.period}`]?.label}
            initialEmoji={rewards[`${rewardConfig.dayKey}-${rewardConfig.period}`]?.emoji}
            initialImageUrl={rewards[`${rewardConfig.dayKey}-${rewardConfig.period}`]?.imageUrl}
            onClose={() => setRewardConfig(null)}
            onSave={handleRewardSave}
          />
      )}

      {/* Delete Confirmation Modal */}
      {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-6 text-center border-4 border-slate-100 transform scale-100 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  
                  <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">¿Estás seguro?</h3>
                      <p className="text-slate-500">
                          {confirmAction.type === 'CLEAR_DAY' 
                              ? `Esto eliminará TODAS las actividades de este día.` 
                              : "Esta actividad se eliminará de la rutina."}
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                          onClick={() => setConfirmAction(null)}
                          className="py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                          <X size={20} /> Cancelar
                      </button>
                      <button 
                          onClick={executeConfirmAction}
                          className="py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                      >
                          <Trash2 size={20} /> Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};