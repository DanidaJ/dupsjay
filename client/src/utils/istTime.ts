/**
 * IST (Indian Standard Time) timezone utility functions
 * Provides consistent timezone handling for +05:30 (IST)
 */

// IST timezone offset: +5:30 hours
const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;
const IST_OFFSET_MS = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000;

/**
 * Get current date and time in IST timezone
 */
export const getCurrentISTTime = (): Date => {
  const now = new Date();
  // Convert UTC to IST by adding the offset
  return new Date(now.getTime() + IST_OFFSET_MS);
};

/**
 * Get current date in IST (time set to 00:00:00)
 */
export const getCurrentISTDate = (): Date => {
  const istNow = getCurrentISTTime();
  return new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
};

/**
 * Convert any date to IST date (time set to 00:00:00)
 */
export const toISTDate = (date: Date | string): Date => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  // Get IST equivalent
  const istTime = new Date(targetDate.getTime() + IST_OFFSET_MS);
  return new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate());
};

/**
 * Check if a date is before the current IST date
 */
export const isBeforeToday = (date: Date | string): boolean => {
  const currentISTDate = getCurrentISTDate();
  const targetISTDate = toISTDate(date);
  return targetISTDate < currentISTDate;
};

/**
 * Check if a date is the same as the current IST date
 */
export const isToday = (date: Date | string): boolean => {
  const currentISTDate = getCurrentISTDate();
  const targetISTDate = toISTDate(date);
  return targetISTDate.getTime() === currentISTDate.getTime();
};

/**
 * Check if a date is after the current IST date
 */
export const isAfterToday = (date: Date | string): boolean => {
  const currentISTDate = getCurrentISTDate();
  const targetISTDate = toISTDate(date);
  return targetISTDate > currentISTDate;
};

/**
 * Check if a date is today or in the future (IST)
 */
export const isTodayOrFuture = (date: Date | string): boolean => {
  return isToday(date) || isAfterToday(date);
};

/**
 * Check if a date is tomorrow (IST)
 */
export const isTomorrow = (date: Date | string): boolean => {
  const currentISTDate = getCurrentISTDate();
  const tomorrow = new Date(currentISTDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const targetISTDate = toISTDate(date);
  return targetISTDate.getTime() === tomorrow.getTime();
};

/**
 * Check if a date is tomorrow or later (IST)
 */
export const isTomorrowOrLater = (date: Date | string): boolean => {
  return isTomorrow(date) || isAfterToday(date);
};

/**
 * Format date for display in IST context
 */
export const formatISTDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const istDate = toISTDate(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  return istDate.toLocaleDateString('en-US', options || defaultOptions);
};

/**
 * Get day of week for a date in IST
 */
export const getISTDayOfWeek = (date: Date | string): string => {
  const istDate = toISTDate(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[istDate.getDay()];
};

/**
 * Get date string in YYYY-MM-DD format in IST
 */
export const toISTDateString = (date: Date | string): string => {
  const istDate = toISTDate(date);
  return istDate.toISOString().split('T')[0];
};

/**
 * Helper to get relative time description
 */
export const getRelativeTimeDescription = (date: Date | string): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isBeforeToday(date)) return 'Past';
  return 'Future';
};

/**
 * Check if a given date matches the day for a specific day name in the current week
 */
export const matchesDayInCurrentWeek = (date: Date | string, dayName: string, currentWeek: Date): boolean => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayIndex = days.indexOf(dayName);
  
  if (dayIndex === -1) return false;
  
  // Get the start of the week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const daysToSubtract = day === 0 ? 6 : day - 1;
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };
  
  const weekStart = getWeekStart(currentWeek);
  const targetDayDate = new Date(weekStart);
  targetDayDate.setDate(targetDayDate.getDate() + dayIndex);
  
  const inputDate = toISTDate(date);
  return inputDate.getTime() === targetDayDate.getTime();
};
