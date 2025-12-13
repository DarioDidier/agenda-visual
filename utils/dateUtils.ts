// Helper to get the ISO week number and year
export const getWeekKey = (date: Date): string => {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  
  // Simple YYYY-Www format
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const formatDateRange = (date: Date): string => {
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  // Spanish locale hardcoded for consistency with app language
  return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)} ${end.getFullYear()}`;
};

export const isSameWeek = (d1: Date, d2: Date): boolean => {
    return getWeekKey(d1) === getWeekKey(d2);
};

export const isDateInPast = (dateToCheck: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const check = new Date(dateToCheck);
    check.setHours(0, 0, 0, 0);
    
    return check.getTime() < today.getTime();
};

// Returns YYYY-MM-DD based on LOCAL time, not UTC
export const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};