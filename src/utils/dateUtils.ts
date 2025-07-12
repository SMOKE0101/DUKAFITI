
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const startOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const startOfHour = (date: Date): Date => {
  const result = new Date(date);
  result.setMinutes(0, 0, 0);
  return result;
};

export const formatDateForBucket = (date: Date, format: 'hour' | 'day' | 'month'): string => {
  switch (format) {
    case 'hour':
      return date.toISOString().substring(0, 13) + ':00:00.000Z';
    case 'day':
      return date.toISOString().substring(0, 10);
    case 'month':
      return date.toISOString().substring(0, 7);
    default:
      return date.toISOString();
  }
};

export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isValidNumber(num) ? num : defaultValue;
};
