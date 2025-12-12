import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek, UserMode, Activity, PictogramData } from '../types';
import { DAYS_ORDER } from '../constants';
import { PictogramCard } from '../components/PictogramCard';
import { Plus, ChevronLeft, ChevronRight, Grid, List, Copy, Trash2, CalendarDays, AlertTriangle, X, Check } from 'lucide-react';
import { PictogramSelectorModal } from '../components/PictogramSelectorModal';
import { ActivityEditModal } from '../components/ActivityEditModal';
import { CopyDayModal } from '../components/CopyDayModal';
import { CongratulationModal } from '../components/CongratulationModal';

export const ScheduleView: React.FC = () => {
  const { schedule, setSchedule, mode, pictograms, settings, updateActivity, deleteActivity, copyRoutine } = useApp();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // For mobile/focused view
  const [viewFormat, setViewFormat] = useState<'linear' | 'grid'>('grid');
  const [showCongratulation, setShowCongratulation] = useState(false);
  
  // Modals state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<{day: string, activity: Activity} | null>(null);
  const [copyingDay, setCopyingDay] = useState<string | null>(null);

  // Deletion Confirmation State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE_ACTIVITY' | 'CLEAR_DAY';
    day: string;
    activityId?: string;
  } | null>(null);

  const currentDay = DAYS_ORDER[selectedDayIndex];

  // Logic to trigger congratulations in Child Mode
  useEffect(() => {
    if (mode === UserMode.CHILD) {
      const activities = schedule[currentDay] || [];
      if (activities.length > 0 && activities.every(a => a.isDone)) {
        const timer = setTimeout(() => {
            setShowCongratulation(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [schedule, currentDay, mode]);

  const handleAddActivity = (day: string) => {
    setEditingDay(day);
    setIsSelectorOpen(true);
  };

  const confirmAddActivity = (pic: PictogramData) => {
    if (!editingDay) return;
    
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      pictogramId: pic.id,
      customLabel: pic.label,
      isDone: false,
      time: '09:00' // Default
    };

    setSchedule(prev => ({
      ...prev,
      [editingDay]: [...(prev[editingDay] || []), newActivity]
    }));
    setIsSelectorOpen(false);
    
    // Optionally open edit modal immediately
    setActivityToEdit({ day: editingDay, activity: newActivity });
  };

  const handleRequestDeleteActivity = (day: string, activityId: string) => {
    setConfirmAction({ type: 'DELETE_ACTIVITY', day, activityId });
  };
  
  const handleRequestClearDay = (day: string) => {
      const count = schedule[day]?.length || 0;
      if (count === 0) return;
      setConfirmAction({ type: 'CLEAR_DAY', day });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'DELETE_ACTIVITY' && confirmAction.activityId) {
        deleteActivity(confirmAction.day, confirmAction.activityId);
    } else if (confirmAction.type === 'CLEAR_DAY') {
        setSchedule(prev => ({ ...prev, [confirmAction.day]: [] }));
    }
    setConfirmAction(null);
  };

  const moveActivity = (day: string, index: number, direction: 'up' | 'down') => {
      setSchedule(prev => {
        const list = [...prev[day]];
        if (direction === 'up' && index > 0) {
            [list[index - 1], list[index]] = [list[index], list[index - 1]];
        } else if (direction === 'down' && index < list.length - 1) {
            [list[index + 1], list[index]] = [list[index], list[index + 1]];
        }
        return { ...prev, [day]: list };
      });
  };

  const handleUpdateActivity = (updates: Partial<Activity>) => {
      if (!activityToEdit) return;
      updateActivity(activityToEdit.day, activityToEdit.activity.id, updates);
  };

  const getPictogram = (id: string) => pictograms.find(p => p.id === id) || pictograms[0];

  // Child Mode View
  if (mode === UserMode.CHILD) {
    return (
      <div className="flex flex-col h-full space-y-4 relative">
        <div className="flex items-center justify-between mb-4">
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedDayIndex === 0}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30"
            >
                <ChevronLeft size={32} />
            </button>
            <h2 className={`text-3xl font-bold ${settings.highContrast ? 'text-black' : 'text-brand-primary'}`}>
                {currentDay}
            </h2>
            <button 
                onClick={() => setSelectedDayIndex(prev => Math.min(DAYS_ORDER.length - 1, prev + 1))}
                disabled={selectedDayIndex === DAYS_ORDER.length - 1}
                className="p-3 bg-white rounded-full shadow disabled:opacity-30"
            >
                <ChevronRight size={32} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
             {schedule[currentDay]?.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                     <CalendarDays size={64} className="mb-4 opacity-50"/>
                     <p className="text-xl">No hay actividades hoy</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {schedule[currentDay].map((activity) => (
                        <PictogramCard 
                            key={activity.id} 
                            activity={activity} 
                            pictogram={getPictogram(activity.pictogramId)} 
                            day={currentDay}
                        />
                    ))}
                 </div>
             )}
        </div>

        {showCongratulation && (
            <CongratulationModal onClose={() => setShowCongratulation(false)} />
        )}
      </div>
    );
  }

  // Adult Mode View
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Planificador Semanal</h2>
            <p className="text-slate-500 text-sm">Organiza las rutinas de la semana</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border shadow-sm self-start">
            <button 
                onClick={() => setViewFormat('grid')}
                className={`p-2 rounded ${viewFormat === 'grid' ? 'bg-slate-100 text-brand-primary' : 'text-slate-400'}`}
            >
                <Grid size={20} />
            </button>
            <button 
                onClick={() => setViewFormat('linear')}
                className={`p-2 rounded ${viewFormat === 'linear' ? 'bg-slate-100 text-brand-primary' : 'text-slate-400'}`}
            >
                <List size={20} />
            </button>
        </div>
      </div>

      <div className={`${viewFormat === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-8'}`}>
        {DAYS_ORDER.map((day) => (
            <div key={day} className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col group/day relative">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="font-bold text-lg text-slate-700">{day}</h3>
                    <div className="flex gap-1">
                      {/* Copy Routine Button */}
                      <button
                        onClick={() => setCopyingDay(day)}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Copiar rutina"
                        disabled={!schedule[day] || schedule[day].length === 0}
                      >
                         <Copy size={16} />
                      </button>

                      {/* Clear Day Button */}
                       <button
                        onClick={() => handleRequestClearDay(day)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Borrar TODO el día"
                        disabled={!schedule[day] || schedule[day].length === 0}
                      >
                         <Trash2 size={16} />
                      </button>

                      <button 
                          onClick={() => handleAddActivity(day)}
                          className="ml-2 p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors shadow-sm"
                          title="Agregar Actividad"
                      >
                          <Plus size={18} />
                      </button>
                    </div>
                </div>

                <div className={`space-y-3 min-h-[120px] ${viewFormat === 'linear' ? 'flex flex-row space-y-0 space-x-4 overflow-x-auto pb-4' : ''}`}>
                    {(!schedule[day] || schedule[day].length === 0) && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 py-6 border-2 border-dashed border-slate-100 rounded-xl">
                            <span className="text-xs italic">Sin actividades</span>
                            <button 
                                onClick={() => handleAddActivity(day)}
                                className="mt-2 text-xs font-bold text-brand-primary hover:underline"
                            >
                                + Agregar
                            </button>
                        </div>
                    )}
                    {schedule[day]?.map((activity, idx) => (
                        <div key={activity.id} className={viewFormat === 'linear' ? 'min-w-[150px]' : ''}>
                             <PictogramCard 
                                activity={activity} 
                                pictogram={getPictogram(activity.pictogramId)}
                                onDelete={() => handleRequestDeleteActivity(day, activity.id)}
                                onEdit={() => setActivityToEdit({ day, activity })}
                                onMoveUp={() => moveActivity(day, idx, 'up')}
                                onMoveDown={() => moveActivity(day, idx, 'down')}
                            />
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

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
                setEditingDay(activityToEdit.day);
            }}
          />
      )}

      {copyingDay && (
        <CopyDayModal
          sourceDay={copyingDay}
          onClose={() => setCopyingDay(null)}
          onCopy={(targetDay) => copyRoutine(copyingDay, targetDay)}
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
                              ? `Esto eliminará TODAS las actividades del ${confirmAction.day}.` 
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
