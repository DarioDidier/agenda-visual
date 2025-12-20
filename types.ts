
import { LucideIcon } from 'lucide-react';

export enum UserMode {
  CHILD = 'CHILD',
  ADULT = 'ADULT'
}

export enum SupportLevel {
  LOW = 'bajo',
  MEDIUM = 'medio',
  HIGH = 'alto'
}

export enum DayType {
  SCHOOL = 'día de escuela',
  WEEKEND = 'fin de semana',
  VACATION = 'vacaciones'
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

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

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
  iconName?: string; 
  arasaacId?: number; 
  category: Category;
  bgColor: string;
  customImageUrl?: string;
}

export interface Activity {
  id: string;
  pictogramId: string;
  customLabel?: string;
  time?: string;
  period?: TimePeriod; 
  isDone: boolean;
  notes?: string;
}

export interface SavedRoutine {
  id: string;
  name: string;
  description?: string;
  activities: Activity[];
  requiredPictograms: PictogramData[]; 
}

export interface Reward {
  id: string;
  dayKey: string;
  period: TimePeriod;
  label: string;
  emoji: string; 
  imageUrl?: string; 
  isRedeemed: boolean;
}

export interface WeekSchedule {
  [key: string]: Activity[]; 
}

export interface RewardSchedule {
  [key: string]: Reward; 
}

export interface PersonOrPlace {
  id: string;
  name: string;
  type: 'PERSON' | 'PLACE';
  imageUrl: string; 
  description?: string;
}

export interface AppSettings {
  highContrast: boolean;
  showText: boolean;
  voiceEnabled: boolean;
  autoSpeak: boolean; 
  pin: string; 
  securityQuestion?: string;
  securityAnswer?: string;
}
