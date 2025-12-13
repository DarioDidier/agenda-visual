import { LucideIcon } from 'lucide-react';

export enum UserMode {
  CHILD = 'CHILD',
  ADULT = 'ADULT'
}

export enum DayOfWeek {
  MONDAY = 'Lunes',
  TUESDAY = 'Martes',
  WEDNESDAY = 'Miércoles',
  THURSDAY = 'Jueves',
  FRIDAY = 'Viernes',
  SATURDAY = 'Sábado',
  SUNDAY = 'Domingo'
}

export enum Category {
  HOME = 'Rutinas de casa',
  SCHOOL = 'Escuela',
  EMOTIONS = 'Emociones',
  FOOD = 'Alimentación',
  PLAY = 'Juego y ocio',
  HYGIENE = 'Higiene',
  TRANSPORT = 'Transporte',
  PLACES = 'Lugares',
  PEOPLE = 'Personas'
}

export interface PictogramData {
  id: string;
  label: string;
  iconName?: string; // Mapping to Lucide icon name (optional if arasaacId is present)
  arasaacId?: number; // ID from ARASAAC API
  category: Category;
  bgColor: string;
  customImageUrl?: string;
}

export interface Activity {
  id: string;
  pictogramId: string;
  customLabel?: string;
  time?: string;
  isDone: boolean;
  notes?: string;
}

export interface WeekSchedule {
  [key: string]: Activity[]; // key is DayOfWeek
}

export interface PersonOrPlace {
  id: string;
  name: string;
  type: 'PERSON' | 'PLACE';
  imageUrl: string; // Placeholder or uploaded
  description?: string;
}

export interface AppSettings {
  highContrast: boolean;
  showText: boolean;
  voiceEnabled: boolean;
  autoSpeak: boolean; // Auto speak when clicking an item
  pin: string; // PIN for Adult mode
  securityQuestion?: string; // Recovery question
  securityAnswer?: string; // Recovery answer
}