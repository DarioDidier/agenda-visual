import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateRange, isSameWeek, toLocalDateString } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, RotateCcw, ChevronDown } from 'lucide-react';

export const CalendarNavigation: React.FC = () => {
  const { selectedDate, setSelectedDate, goToToday } = useApp();
  
  const handlePrevWeek = () => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value; // YYYY-MM-DD
      if (val) {
          // Manually parse to ensure we set local time correctly without timezone shifts
          const [year, month, day] = val.split('-').map(Number);
          const newDate = new Date(year, month - 1, day);
          newDate.setHours(0, 0, 0, 0);
          setSelectedDate(newDate);
      }
  };

  const isCurrentWeek = isSameWeek(selectedDate, new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm border p-2 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
        {/* Helper style to force the calendar picker indicator to cover the full input area on WebKit browsers */}
        <style>{`
            .date-input-overlay::-webkit-calendar-picker-indicator {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                cursor: pointer;
                opacity: 0;
            }
        `}</style>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button 
                onClick={handlePrevWeek}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Semana Anterior"
            >
                <ChevronLeft size={24} />
            </button>
            
            <div className="flex flex-col items-center">
                <span className="font-bold text-slate-800 text-lg whitespace-nowrap">
                    {formatDateRange(selectedDate)}
                </span>
                {isCurrentWeek && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Semana Actual
                    </span>
                )}
            </div>

            <button 
                onClick={handleNextWeek}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Siguiente Semana"
            >
                <ChevronRight size={24} />
            </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
            <div className="relative flex-1 sm:flex-none group">
                {/* Visual Button */}
                <button 
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors w-full sm:w-auto pointer-events-none"
                >
                    <span>Ir a Fecha</span>
                    <ChevronDown size={16} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
                </button>
                
                {/* Invisible Input Overlay with special class for picker expansion */}
                <input 
                    type="date" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 date-input-overlay"
                    onChange={handleDateChange}
                    value={toLocalDateString(selectedDate)}
                    title="Seleccionar fecha"
                    aria-label="Ir a fecha"
                />
            </div>
            
            {!isCurrentWeek && (
                <button 
                    onClick={goToToday}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-bold text-sm shadow-sm hover:bg-brand-secondary transition-colors"
                >
                    <RotateCcw size={16} /> Hoy
                </button>
            )}
        </div>
    </div>
  );
};