import { useMemo, useCallback } from 'react';
import { WorkoutDayType } from '../utils/WorkoutDayManager';
import { Event } from '../components/CollapsibleCalendarCard';


export const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Monday start

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    while (days.length % 7 !== 0) {
        days.push(null);
    }
    return days;
};

export const getWeeksFromDays = (d: (Date | null)[]) => {
    const w = [];
    for (let i = 0; i < d.length; i += 7) {
        w.push(d.slice(i, i + 7));
    }
    return w;
};

export const getWeekDays = (centerDate: Date): (Date | null)[] => {
    if (!centerDate) return Array(7).fill(null);
    const days: (Date | null)[] = [];
    const dayOfWeek = centerDate.getDay();
    const monday = new Date(centerDate);
    monday.setDate(centerDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push(day);
    }
    return days;
};

export function useCalendarData(currentMonth: Date, selectedDate: Date) {
    const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
    const prevMonthDays = useMemo(() => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        return getDaysInMonth(prev);
    }, [currentMonth]);
    const nextMonthDays = useMemo(() => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        return getDaysInMonth(next);
    }, [currentMonth]);

    const weeks = useMemo(() => getWeeksFromDays(days), [days]);
    const prevMonthWeeks = useMemo(() => getWeeksFromDays(prevMonthDays), [prevMonthDays]);
    const nextMonthWeeks = useMemo(() => getWeeksFromDays(nextMonthDays), [nextMonthDays]);
    const allWeeks = useMemo(() => [...prevMonthWeeks, ...weeks, ...nextMonthWeeks], [prevMonthWeeks, weeks, nextMonthWeeks]);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const prevWeekDays = useMemo(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 7);
        return getWeekDays(prev);
    }, [selectedDate]);
    const nextWeekDays = useMemo(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 7);
        return getWeekDays(next);
    }, [selectedDate]);

    const getWeekIndexForDate = useCallback((date: Date) => {
        return allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === date.toDateString())
        );
    }, [allWeeks]);

    return {
        weeks,
        prevMonthWeeks,
        nextMonthWeeks,
        allWeeks,
        weekDays,
        prevWeekDays,
        nextWeekDays,
        getWeekIndexForDate
    };
}

export function useCalendarEvents(events: Event[], schedule: Record<string, WorkoutDayType>) {
    const getEventsForDate = useCallback((date: Date | null) => {
        if (!date) return [];
        const dateKey = formatDateKey(date);
        return events.filter(e => {
            const eventDateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            return eventDateStr === dateKey;
        });
    }, [events]);

    const getWorkoutForDate = useCallback((date: Date | null) => {
        if (!date) return null;
        const dateKey = formatDateKey(date);
        return schedule[dateKey] || null;
    }, [schedule]);

    return {
        getEventsForDate,
        getWorkoutForDate
    };
}
