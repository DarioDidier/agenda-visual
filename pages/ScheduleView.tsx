
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, Activity, PictogramData, TimePeriod } from '../types';
import { PictogramCard } from '../components/PictogramCard';
import { Plus, ChevronLeft, ChevronRight, Grid, List, Trash2, CalendarDays, FileText, Loader2, Sparkles, Book, Sun, Sunset, Moon, X, AlertTriangle, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';
import { RoutineLibraryModal } from '../components/RoutineLibraryModal';
import { exportScheduleToPDF } from '../services/pdfService';
import { CongratulationModal } from '../components/CongratulationModal';
import { RewardConfigModal } from '../components/RewardConfigModal';
import { speakText } from '../services/speechService';

const generateSafeId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

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
    goToToday, changeWeek, weekDates, settings, rewards, redeemReward, setReward
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

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dayKey: string; dayName: string } | null>(null);

  // Congratulation Logic
  const [showCongratulation, setShowCongratulation] = useState<{isOpen: boolean, label: string, emoji: string, imageUrl?: string} | null>(null);

  // Reward Config Logic for Adult Mode
  const [rewardConfigTarget, setRewardConfigTarget] = useState<{ dayKey: string, period: TimePeriod } | null>(null);

  const isHighContrast = settings.highContrast;
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

  // Check for period completion whenever schedule changes
  useEffect(() => {
      if (mode === UserMode.CHILD) {
          const displayDate = currentChildDayDate || new Date();
          const dayKey = getDateKey(displayDate);
          const periodActivities = (schedule[dayKey] || []).filter(a => (a.period || 'morning') === childActivePeriod);
          
          if (periodActivities.length > 0 && periodActivities.every(a => a.isDone)) {
              const rewardKey = `${dayKey}-${childActivePeriod}`;
              const reward = rewards[rewardKey];
              
              if (reward && !reward.isRedeemed) {
                  redeemReward(dayKey, childActivePeriod);
                  setShowCongratulation({
                      isOpen: true,
                      label: reward.label,
                      emoji: reward.emoji,
                      imageUrl: reward.imageUrl
                  });
              }
          }
      }
  }, [schedule, childActivePeriod, currentChildDayDate, mode, rewards, redeemReward]);

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

  const handleSaveReward = (label: string, emoji: string, imageUrl?: string) => {
      if (rewardConfigTarget) {
          // Double check to prevent accidental saves to past dates
          if (rewardConfigTarget.dayKey < todayKey) {
              alert("No se pueden modificar premios de días pasados.");
              return;
          }
          setReward(rewardConfigTarget.dayKey, rewardConfigTarget.period, label, emoji, imageUrl);
          setRewardConfigTarget(null);
          speakText("Premio configurado");
      }
  };

  if (mode === UserMode.CHILD) {
    const displayDate = currentChildDayDate || new Date();
    const dayKey = getDateKey(displayDate);
    const dayActivities = (schedule[dayKey] || []).filter(a => (a.period || 'morning') === childActivePeriod);
    
    return (
      <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto w-full">
        <div className={`flex items-center justify-between p-4 rounded-3xl shadow-sm border ${isHighContrast ? 'bg-black border-cyan-400' : 'bg-white border-slate-100'}`}>
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className={`p-4 rounded-2xl shadow-sm disabled:opacity-20 active:scale-90 transition-all ${isHighContrast ? 'bg-white text-black' : 'bg-slate-50 text-brand-primary'}`}
            >
                <ChevronLeft size={40} />
            </button>
            <div className="text-center">
                <h2 className={`text-4xl font-black tracking-tight ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>
                    {spanishDays[displayDate.getDay()]} {displayDate.getDate()}
                </h2>
                <p className={`font-bold uppercase text-sm tracking-widest ${isHighContrast ? 'text-cyan-300' : 'text-slate-400'}`}>{spanishMonths[displayDate.getMonth()]}</p>
            </div>
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
                disabled={selectedDayIndex === 6}
                className={`p-4 rounded-2xl shadow-sm disabled:opacity-20 active:scale-90 transition-all ${isHighContrast ? 'bg-white text-black' : 'bg-slate-50 text-brand-primary'}`}
            >
                <ChevronRight size={40} />
            </button>
        </div>

        <nav className={`flex p-2 rounded-3xl mx-2 gap-2 ${isHighContrast ? 'bg-white/10' : 'bg-slate-200/50'}`}>
            {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map((p) => {
                 const isActive = childActivePeriod === p;
                 const rewardKey = `${dayKey}-${p}`;
                 const hasReward = !!rewards[rewardKey];
                 const isRedeemed = rewards[rewardKey]?.isRedeemed;

                 return (
                    <button
                        key={p}
                        onClick={() => setChildActivePeriod(p)}
                        className={`flex-1 flex flex-col items-center py-4 rounded-2xl transition-all relative ${isActive ? 'bg-white shadow-lg scale-105 z-10' : 'opacity-40 hover:opacity-60'}`}
                    >
                        {p === 'morning' ? <Sun className="text-yellow-500" size={32} /> : p === 'afternoon' ? <Sunset className="text-orange-500" size={32} /> : <Moon className="text-indigo-500" size={32} />}
                        <span className={`text-sm font-black mt-1 uppercase ${isActive ? 'text-slate-800' : (isHighContrast ? 'text-white' : 'text-slate-500')}`}>
                            {p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche'}
                        </span>
                        {hasReward && (
                            <div className={`absolute top-1 right-1 ${isRedeemed ? 'text-green-500' : 'text-pink-400'}`}>
                                <Gift size={16} fill={isRedeemed ? "currentColor" : "none"} />
                            </div>
                        )}
                    </button>
                 );
            })}
        </nav>

        <div className="flex-1 overflow-y-auto pb-24 px-2">
             {dayActivities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                     <CalendarDays size={80} className={`${isHighContrast ? 'text-white' : 'text-slate-400'} mb-4`} />
                     <p className={`text-2xl font-black ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>¡Momento de descanso!</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {dayActivities.map((activity) => (
                        <PictogramCard 
                            key={activity.id}
                            activity={activity} 
                            pictogram={getPictogram(activity.pictogramId)} 
                            day={dayKey}
                        />
                    ))}
                 </div>
             )}
        </div>

        {showCongratulation?.isOpen && (
            <CongratulationModal 
                message={`¡Has terminado! Tu premio es: ${showCongratulation.label}`}
                rewardEmoji={showCongratulation.emoji}
                rewardImageUrl={showCongratulation.imageUrl}
                onClose={() => setShowCongratulation(null)}
            />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      <header className={`p-6 rounded-3xl shadow-sm border flex flex-col xl:flex-row xl:items-center justify-between gap-6 ${isHighContrast ? 'bg-black border-cyan-400' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-6">
              <div className={`flex items-center rounded-2xl p-1 shadow-inner ${isHighContrast ? 'bg-white/10' : 'bg-slate-100'}`}>
                <button onClick={() => changeWeek(-1)} className={`p-3 rounded-xl transition-all ${isHighContrast ? 'hover:bg-white/20 text-white' : 'hover:bg-white text-slate-600'}`}>
                    <ChevronLeft size={24} />
                </button>
                <button onClick={goToToday} className={`px-6 py-2 text-sm font-black transition-colors uppercase ${isHighContrast ? 'text-white hover:text-cyan-300' : 'text-slate-700 hover:text-brand-primary'}`}>ESTA SEMANA</button>
                <button onClick={() => changeWeek(1)} className={`p-3 rounded-xl transition-all ${isHighContrast ? 'hover:bg-white/20 text-white' : 'hover:bg-white text-slate-600'}`}>
                    <ChevronRight size={24} />
                </button>
              </div>
              <h2 className={`text-2xl font-black border-l-4 border-brand-primary pl-4 uppercase ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>
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
               <div className={`flex p-1.5 rounded-2xl border ${isHighContrast ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200'}`}>
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
            <section key={dayKey} className={`rounded-3xl border shadow-sm flex flex-col relative transition-all duration-300 ${isHighContrast ? 'bg-black border-white' : 'bg-white border-slate-100'} ${isToday ? 'ring-4 ring-brand-primary ring-offset-4' : 'hover:border-slate-300'} ${isPast ? 'opacity-70 bg-slate-50/50 grayscale-[0.3]' : ''}`}>
                <div className={`p-4 flex justify-between items-center rounded-t-3xl border-b ${isToday ? 'bg-brand-primary/5' : (isHighContrast ? 'bg-white/5' : 'bg-slate-50/30')}`}>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isHighContrast ? 'text-cyan-300' : 'text-slate-400'}`}>{dayName}</span>
                        <span className={`text-xl font-black ${isHighContrast ? 'text-white' : 'text-slate-800'}`}>{dateObj.getDate()}</span>
                    </div>
                    <div className="flex gap-1">
                        {!isPast && dayActivities.length > 0 && (
                            <button 
                                onClick={() => handleOpenDeleteModal(dayKey, dayName)} 
                                className={`p-2 transition-all ${isHighContrast ? 'text-red-400 hover:text-red-600' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'} rounded-xl`} 
                                title="Borrar rutina completa"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button onClick={() => handleExportPDF(dayKey, dateObj)} className={`p-2 rounded-xl transition-all ${isHighContrast ? 'text-cyan-400 hover:text-white' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`} title="Exportar PDF">
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
                    {/* Adult Mode Reward Configuration Row */}
                    <div className={`flex items-center justify-around p-2 mb-2 rounded-2xl border-2 border-dashed ${isHighContrast ? 'border-white/20' : 'border-slate-100 bg-slate-50/50'}`}>
                        {(['morning', 'afternoon', 'evening'] as TimePeriod[]).map(p => {
                            const hasReward = !!rewards[`${dayKey}-${p}`];
                            return (
                                <button 
                                    key={p}
                                    onClick={() => !isPast && setRewardConfigTarget({ dayKey, period: p })}
                                    disabled={isPast}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${!isPast ? 'hover:bg-white active:scale-90' : 'opacity-40 cursor-not-allowed'} ${hasReward ? 'text-pink-500 font-black' : 'text-slate-300'}`}
                                    title={isPast ? "No se pueden editar premios pasados" : `Configurar premio para la ${p === 'morning' ? 'mañana' : p === 'afternoon' ? 'tarde' : 'noche'}`}
                                >
                                    <Gift size={18} fill={hasReward ? "currentColor" : "none"} />
                                    <span className="text-[8px] uppercase">{p === 'morning' ? 'Mañ' : p === 'afternoon' ? 'Tar' : 'Noc'}</span>
                                </button>
                            );
                        })}
                    </div>

                    {dayActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-20">
                            <Plus size={32} className={isHighContrast ? 'text-white' : 'text-slate-400'} />
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

      {deleteModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
              <div className="bg-white rounded-[32px] shadow-2xl p-8 max-sm w-full text-center border-4 border-red-50 animate-in zoom-in-95 duration-200">
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
                          Borrar Todo
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
                    id: generateSafeId(),
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

      {rewardConfigTarget && (
          <RewardConfigModal 
            period={rewardConfigTarget.period}
            initialLabel={rewards[`${rewardConfigTarget.dayKey}-${rewardConfigTarget.period}`]?.label}
            initialEmoji={rewards[`${rewardConfigTarget.dayKey}-${rewardConfigTarget.period}`]?.emoji}
            initialImageUrl={rewards[`${rewardConfigTarget.dayKey}-${rewardConfigTarget.period}`]?.imageUrl}
            onSave={handleSaveReward}
            onClose={() => setRewardConfigTarget(null)}
          />
      )}
    </div>
  );
};
