// Date formatting utilities
export const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatMonthYear = (date: Date, locale: string = 'tr-TR'): string => {
    return date.toLocaleString(locale, { month: 'long', year: 'numeric' });
};

export const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
};

// Date calculations
export const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add padding for days before first of month
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startPadding; i++) {
        days.push(null);
    }

    // Add all days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }

    // Add padding to complete last week
    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
};

export const getWeeksFromDays = (days: (Date | null)[]): (Date | null)[][] => {
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    return weeks;
};

export const getWeekDays = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const wd = new Date(monday);
        wd.setDate(monday.getDate() + i);
        week.push(wd);
    }
    return week;
};

export const isSameDay = (d1: Date | null, d2: Date | null): boolean => {
    if (!d1 || !d2) return false;
    return d1.toDateString() === d2.toDateString();
};

export const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const now = new Date();
    return date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
};

export const addMonths = (date: Date, months: number): Date => {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const toMidnightTimestamp = (date: Date | string | number): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};
