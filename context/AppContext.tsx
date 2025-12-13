import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, UserMode, WeekSchedule, PictogramData, PersonOrPlace, Activity } from '../types';
import { INITIAL_PICTOGRAMS, EMPTY_SCHEDULE } from '../constants';

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
    const defaults = {
      highContrast: false,
      showText: true,
      voiceEnabled: true,
      autoSpeak: true,
      pin: '1234', // Default PIN
      securityQuestion: '¿Nombre de tu primera mascota?',
      securityAnswer: 'firulais'
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('mav_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('mav_schedule', JSON.stringify(schedule));
  }, [schedule]);

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

  const toggleActivityDone = (day: string, activityId: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(act => 
        act.id === activityId ? { ...act, isDone: !act.isDone } : act
      )
    }));
  };

  const updateActivity = (day: string, activityId: string, updates: Partial<Activity>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(act =>
        act.id === activityId ? { ...act, ...updates } : act
      )
    }));
  };

  const deleteActivity = (day: string, activityId: string) => {
    setSchedule(prev => {
      const dayActivities = prev[day];
      if (!dayActivities) return prev;
      
      const newActivities = dayActivities.filter(act => act.id !== activityId);
      
      return {
        ...prev,
        [day]: newActivities
      };
    });
  };

  const copyRoutine = (sourceDay: string, targetDay: string) => {
      setSchedule(prev => {
          const sourceActivities = prev[sourceDay];
          if (!sourceActivities || sourceActivities.length === 0) return prev;

          const newActivities = sourceActivities.map(act => ({
              ...act,
              id: crypto.randomUUID(), 
              isDone: false 
          }));

          return {
              ...prev,
              [targetDay]: [...(prev[targetDay] || []), ...newActivities]
          };
      });
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
      copyRoutine
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