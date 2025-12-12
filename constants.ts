import { Category, PictogramData, DayOfWeek, WeekSchedule } from './types';

export const INITIAL_PICTOGRAMS: PictogramData[] = [
  // Rutinas Casa
  { id: 'p1', label: 'Despertar', iconName: 'Sun', category: Category.HOME, bgColor: 'bg-yellow-100' },
  { id: 'p2', label: 'Dormir', iconName: 'Moon', category: Category.HOME, bgColor: 'bg-indigo-100' },
  { id: 'p3', label: 'Vestirse', iconName: 'Shirt', category: Category.HOME, bgColor: 'bg-blue-100' },
  // Higiene
  { id: 'p4', label: 'Baño', iconName: 'Bath', category: Category.HYGIENE, bgColor: 'bg-cyan-100' },
  { id: 'p5', label: 'Lavar Dientes', iconName: 'Sparkles', category: Category.HYGIENE, bgColor: 'bg-cyan-100' },
  { id: 'p6', label: 'Manos Limpias', iconName: 'Hand', category: Category.HYGIENE, bgColor: 'bg-cyan-100' },
  // Alimentación
  { id: 'p7', label: 'Desayuno', iconName: 'Coffee', category: Category.FOOD, bgColor: 'bg-orange-100' },
  { id: 'p8', label: 'Comer', iconName: 'Utensils', category: Category.FOOD, bgColor: 'bg-orange-100' },
  { id: 'p9', label: 'Agua', iconName: 'GlassWater', category: Category.FOOD, bgColor: 'bg-blue-50' },
  // Escuela
  { id: 'p10', label: 'Ir a Escuela', iconName: 'Backpack', category: Category.SCHOOL, bgColor: 'bg-green-100' },
  { id: 'p11', label: 'Estudiar', iconName: 'BookOpen', category: Category.SCHOOL, bgColor: 'bg-green-100' },
  { id: 'p12', label: 'Dibujar', iconName: 'Pencil', category: Category.SCHOOL, bgColor: 'bg-green-100' },
  // Juego
  { id: 'p13', label: 'Jugar', iconName: 'Gamepad2', category: Category.PLAY, bgColor: 'bg-purple-100' },
  { id: 'p14', label: 'Parque', iconName: 'TreePine', category: Category.PLAY, bgColor: 'bg-green-200' },
  // Emociones
  { id: 'p15', label: 'Feliz', iconName: 'Smile', category: Category.EMOTIONS, bgColor: 'bg-yellow-200' },
  { id: 'p16', label: 'Triste', iconName: 'Frown', category: Category.EMOTIONS, bgColor: 'bg-blue-200' },
  { id: 'p17', label: 'Enojado', iconName: 'Annoyed', category: Category.EMOTIONS, bgColor: 'bg-red-200' },
  // Transporte
  { id: 'p18', label: 'Auto', iconName: 'Car', category: Category.TRANSPORT, bgColor: 'bg-gray-200' },
  { id: 'p19', label: 'Bus', iconName: 'Bus', category: Category.TRANSPORT, bgColor: 'bg-yellow-300' },
];

export const DAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const EMPTY_SCHEDULE: WeekSchedule = DAYS_ORDER.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {} as WeekSchedule);
