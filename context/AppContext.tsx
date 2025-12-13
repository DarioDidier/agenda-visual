import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, UserMode, WeekSchedule, PictogramData, PersonOrPlace, Activity, Reward, RewardSchedule, TimePeriod } from '../types';
import { INITIAL_PICTOGRAMS, EMPTY_SCHEDULE } from '../constants';

// Date Utility Helpers
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

interface AppContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  schedule: WeekSchedule;
  setSchedule: (schedule: React.SetStateAction<WeekSchedule>) => void;
  pictograms: PictogramData[];
  addPictogram: (pic: PictogramData) => void;
  peoplePlaces: PersonOrPlace[];
  addPersonOrPlace: (item: PersonOrPlace) => void;
  updatePersonOrPlace: (id: string, item: Partial<PersonOrPlace>) => void;
  deletePersonOrPlace: (id: string) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleActivityDone: (day: string, activityId: string) => void;
  updateActivity: (day: string, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (day: string, activityId: string) => void;
  copyRoutine: (sourceDay: string, targetDay: string) => void;
  // Rewards
  rewards: RewardSchedule;
  setReward: (dayKey: string, period: TimePeriod, label: string, emoji: string, imageUrl?: string) => void;
  redeemReward: (dayKey: string, period: TimePeriod) => void;
  // Date Navigation
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  goToToday: () => void;
  changeWeek: (weeks: number) => void;
  weekDates: Date[]; // The 7 dates of the current week
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const [mode, setMode] = useState<UserMode>(() => {
    const saved = localStorage.getItem('mav_mode');
    return (saved as UserMode) || UserMode.ADULT;
  });
  
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const saved = localStorage.getItem('mav_schedule');
    return saved ? JSON.parse(saved) : EMPTY_SCHEDULE;
  });

  const [rewards, setRewards] = useState<RewardSchedule>(() => {
    const saved = localStorage.getItem('mav_rewards');
    return saved ? JSON.parse(saved) : {};
  });

  const [pictograms, setPictograms] = useState<PictogramData[]>(() => {
    const saved = localStorage.getItem('mav_pictograms');
    return saved ? JSON.parse(saved) : INITIAL_PICTOGRAMS;
  });
  
  const [peoplePlaces, setPeoplePlaces] = useState<PersonOrPlace[]>(() => {
      const saved = localStorage.getItem('mav_people');
      return saved ? JSON.parse(saved) : [
          {id: 'pp1', name: 'Mamá', type: 'PERSON', imageUrl: 'https://picsum.photos/200/200'},
          {id: 'pp2', name: 'Escuela', type: 'PLACE', imageUrl: 'https://picsum.photos/201/201'}
      ];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mav_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      highContrast: false,
      showText: true,
      voiceEnabled: true,
      autoSpeak: true,
      pin: '1234', // Default PIN
      securityQuestion: '¿Cuál es el nombre de tu primera mascota?',
      securityAnswer: '',
      ...parsed // Override defaults with saved values
    };
  });

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Persistence
  useEffect(() => {
    localStorage.setItem('mav_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('mav_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('mav_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    try {
        localStorage.setItem('mav_people', JSON.stringify(peoplePlaces));
    } catch (e) {
        console.error("Local Storage Full", e);
        alert("¡Atención! No hay espacio suficiente para guardar más fotos grandes. Intenta usar imágenes más pequeñas.");
    }
  }, [peoplePlaces]);

  useEffect(() => {
    localStorage.setItem('mav_pictograms', JSON.stringify(pictograms));
  }, [pictograms]);

  useEffect(() => {
    localStorage.setItem('mav_settings', JSON.stringify(settings));
  }, [settings]);

  // --- Date Logic ---
  const goToToday = () => setCurrentDate(new Date());
  
  const changeWeek = (weeks: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (weeks * 7));
      setCurrentDate(newDate);
  };

  // Generate the 7 dates for the currently selected week
  const weekDates = React.useMemo(() => {
      const start = getMonday(currentDate);
      return Array.from({ length: 7 }).map((_, i) => {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          return day;
      });
  }, [currentDate]);

  // --- CRUD Operations ---

  const addPictogram = (pic: PictogramData) => {
    setPictograms(prev => {
        if (prev.some(p => p.id === pic.id)) return prev;
        return [...prev, pic];
    });
  };

  const addPersonOrPlace = (item: PersonOrPlace) => {
      setPeoplePlaces(prev => [...prev, item]);
  };

  const updatePersonOrPlace = (id: string, updates: Partial<PersonOrPlace>) => {
      setPeoplePlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePersonOrPlace = (id: string) => {
      setPeoplePlaces(prev => prev.filter(p => p.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleActivityDone = (dayKey: string, activityId: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(act => 
        act.id === activityId ? { ...act, isDone: !act.isDone } : act
      )
    }));
  };

  const updateActivity = (dayKey: string, activityId: string, updates: Partial<Activity>) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(act =>
        act.id === activityId ? { ...act, ...updates } : act
      )
    }));
  };

  const deleteActivity = (dayKey: string, activityId: string) => {
    setSchedule(prev => {
      const dayActivities = prev[dayKey];
      if (!dayActivities) return prev;
      
      const newActivities = dayActivities.filter(act => act.id !== activityId);
      
      return {
        ...prev,
        [dayKey]: newActivities
      };
    });
  };

  const copyRoutine = (sourceDayKey: string, targetDayKey: string) => {
      setSchedule(prev => {
          const sourceActivities = prev[sourceDayKey];
          if (!sourceActivities || sourceActivities.length === 0) return prev;

          const newActivities = sourceActivities.map(act => ({
              ...act,
              id: crypto.randomUUID(), 
              isDone: false 
          }));

          return {
              ...prev,
              [targetDayKey]: [...(prev[targetDayKey] || []), ...newActivities]
          };
      });
  };

  // --- Rewards Logic ---
  const setReward = (dayKey: string, period: TimePeriod, label: string, emoji: string, imageUrl?: string) => {
    const key = `${dayKey}-${period}`;
    const newReward: Reward = {
      id: crypto.randomUUID(),
      dayKey,
      period,
      label,
      emoji,
      imageUrl,
      isRedeemed: false
    };
    setRewards(prev => ({ ...prev, [key]: newReward }));
  };

  const redeemReward = (dayKey: string, period: TimePeriod) => {
    const key = `${dayKey}-${period}`;
    if (!rewards[key]) return;
    
    setRewards(prev => ({
      ...prev,
      [key]: { ...prev[key], isRedeemed: true }
    }));
  };

  return (
    <AppContext.Provider value={{
      mode, setMode,
      schedule, setSchedule,
      pictograms, addPictogram,
      peoplePlaces, addPersonOrPlace,
      updatePersonOrPlace,
      deletePersonOrPlace,
      settings, updateSettings,
      toggleActivityDone,
      updateActivity,
      deleteActivity,
      copyRoutine,
      rewards, setReward, redeemReward,
      currentDate, setCurrentDate, goToToday, changeWeek, weekDates
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};