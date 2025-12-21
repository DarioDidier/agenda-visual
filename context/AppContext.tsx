
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, UserMode, WeekSchedule, PictogramData, PersonOrPlace, Activity, Reward, RewardSchedule, TimePeriod, SavedRoutine } from '../types';
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
  clearDayActivities: (dayKey: string) => void;
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
  // Saved Routines (Library)
  savedRoutines: SavedRoutine[];
  saveRoutineToLibrary: (name: string, description: string, activities: Activity[]) => void;
  importRoutineToLibrary: (routineData: SavedRoutine) => void;
  deleteRoutineFromLibrary: (id: string) => void;
  applyRoutineToDay: (routineId: string, targetDay: string, targetPeriod: TimePeriod) => void;
  // Backup
  generateBackupData: () => string;
  restoreBackupData: (jsonData: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>(() => {
      const saved = localStorage.getItem('mav_saved_routines');
      return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mav_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      highContrast: false,
      showText: true,
      voiceEnabled: true,
      autoSpeak: true,
      pin: '1234',
      securityQuestion: '¿Cuál es el nombre de tu primera mascota?',
      securityAnswer: '',
      ...parsed
    };
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { localStorage.setItem('mav_mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('mav_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('mav_rewards', JSON.stringify(rewards)); }, [rewards]);
  useEffect(() => {
    try { localStorage.setItem('mav_people', JSON.stringify(peoplePlaces)); } catch (e) { console.error("Local Storage Full", e); }
  }, [peoplePlaces]);
  useEffect(() => { localStorage.setItem('mav_pictograms', JSON.stringify(pictograms)); }, [pictograms]);
  useEffect(() => { localStorage.setItem('mav_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('mav_saved_routines', JSON.stringify(savedRoutines)); }, [savedRoutines]);

  const goToToday = () => setCurrentDate(new Date());
  const changeWeek = (weeks: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (weeks * 7));
      setCurrentDate(newDate);
  };

  const weekDates = React.useMemo(() => {
      const start = getMonday(currentDate);
      return Array.from({ length: 7 }).map((_, i) => {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          return day;
      });
  }, [currentDate]);

  const addPictogram = (pic: PictogramData) => {
    setPictograms(prev => {
        if (prev.some(p => p.id === pic.id)) return prev;
        return [...prev, pic];
    });
  };

  const addPersonOrPlace = (item: PersonOrPlace) => { setPeoplePlaces(prev => [...prev, item]); };
  const updatePersonOrPlace = (id: string, updates: Partial<PersonOrPlace>) => {
      setPeoplePlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deletePersonOrPlace = (id: string) => { setPeoplePlaces(prev => prev.filter(p => p.id !== id)); };
  const updateSettings = (newSettings: Partial<AppSettings>) => { setSettings(prev => ({ ...prev, ...newSettings })); };

  const toggleActivityDone = (dayKey: string, activityId: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(act => act.id === activityId ? { ...act, isDone: !act.isDone } : act)
    }));
  };

  const updateActivity = (dayKey: string, activityId: string, updates: Partial<Activity>) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(act => act.id === activityId ? { ...act, ...updates } : act)
    }));
  };

  const deleteActivity = (dayKey: string, activityId: string) => {
    setSchedule(prev => {
      const dayActivities = prev[dayKey];
      if (!dayActivities) return prev;
      return { ...prev, [dayKey]: dayActivities.filter(act => act.id !== activityId) };
    });
  };

  const clearDayActivities = (dayKey: string) => {
      setSchedule(prev => ({ ...prev, [dayKey]: [] }));
  };

  const copyRoutine = (sourceDayKey: string, targetDayKey: string) => {
      setSchedule(prev => {
          const sourceActivities = prev[sourceDayKey];
          if (!sourceActivities || sourceActivities.length === 0) return prev;
          const newActivities = sourceActivities.map(act => ({ ...act, id: crypto.randomUUID(), isDone: false }));
          return { ...prev, [targetDayKey]: [...(prev[targetDayKey] || []), ...newActivities] };
      });
  };

  const saveRoutineToLibrary = (name: string, description: string, activities: Activity[]) => {
      const usedPicIds = new Set(activities.map(a => a.pictogramId));
      const requiredPictograms = pictograms.filter(p => usedPicIds.has(p.id));
      const newRoutine: SavedRoutine = {
          id: crypto.randomUUID(),
          name, description,
          activities: activities.map(a => ({ ...a, id: crypto.randomUUID(), isDone: false })),
          requiredPictograms
      };
      setSavedRoutines(prev => [...prev, newRoutine]);
  };

  const importRoutineToLibrary = (routineData: SavedRoutine) => {
      setPictograms(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPics = routineData.requiredPictograms.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPics];
      });
      const importedRoutine = { ...routineData, id: crypto.randomUUID(), name: `${routineData.name} (Importada)` };
      setSavedRoutines(prev => [...prev, importedRoutine]);
  };

  const deleteRoutineFromLibrary = (id: string) => { setSavedRoutines(prev => prev.filter(r => r.id !== id)); };

  const applyRoutineToDay = (routineId: string, targetDay: string, targetPeriod: TimePeriod) => {
      const routine = savedRoutines.find(r => r.id === routineId);
      if (!routine) return;
      const newActivities: Activity[] = routine.activities.map(a => ({
          ...a, id: crypto.randomUUID(), period: targetPeriod, isDone: false, time: a.time || ''
      }));
      setSchedule(prev => {
          const combined = [...(prev[targetDay] || []), ...newActivities];
          combined.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
          return { ...prev, [targetDay]: combined };
      });
  };

  const setReward = (dayKey: string, period: TimePeriod, label: string, emoji: string, imageUrl?: string) => {
    const key = `${dayKey}-${period}`;
    setRewards(prev => ({ ...prev, [key]: { id: crypto.randomUUID(), dayKey, period, label, emoji, imageUrl, isRedeemed: false } }));
  };

  const redeemReward = (dayKey: string, period: TimePeriod) => {
    const key = `${dayKey}-${period}`;
    if (!rewards[key]) return;
    setRewards(prev => ({ ...prev, [key]: { ...prev[key], isRedeemed: true } }));
  };

  const generateBackupData = () => {
    return JSON.stringify({ meta: { version: '1.0', date: new Date().toISOString() }, data: { schedule, rewards, pictograms, peoplePlaces, savedRoutines, settings } }, null, 2);
  };

  const restoreBackupData = (jsonString: string) => {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.data) throw new Error("Formato inválido");
      const { data } = backup;
      if(data.schedule) setSchedule(data.schedule);
      if(data.rewards) setRewards(data.rewards);
      if(data.pictograms) setPictograms(data.pictograms);
      if(data.peoplePlaces) setPeoplePlaces(data.peoplePlaces);
      if(data.savedRoutines) setSavedRoutines(data.savedRoutines);
      if(data.settings) setSettings(data.settings);
      return true;
    } catch (e) { return false; }
  };

  return (
    <AppContext.Provider value={{
      mode, setMode, schedule, setSchedule, pictograms, addPictogram, peoplePlaces, addPersonOrPlace,
      updatePersonOrPlace, deletePersonOrPlace, settings, updateSettings, toggleActivityDone,
      updateActivity, deleteActivity, clearDayActivities, copyRoutine, rewards, setReward, redeemReward,
      currentDate, setCurrentDate, goToToday, changeWeek, weekDates,
      savedRoutines, saveRoutineToLibrary, importRoutineToLibrary, deleteRoutineFromLibrary, applyRoutineToDay,
      generateBackupData, restoreBackupData
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
