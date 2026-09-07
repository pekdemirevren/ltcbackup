import { useCallback } from 'react';
import { useCalendarStore } from './useCalendarStore';
import { addMonths, addDays } from '../utils/dateUtils';

export const useCalendarNavigation = () => {
    const {
        selectedDate,
        headerMonth,
        currentMonth,
        setSelectedDate,
        setHeaderMonth,
        setCurrentMonth,
    } = useCalendarStore();

    const goToToday = useCallback(() => {
        const today = new Date();
        setSelectedDate(today);
        setHeaderMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }, [setSelectedDate, setHeaderMonth, setCurrentMonth]);

    const goToNextMonth = useCallback(() => {
        const next = addMonths(currentMonth, 1);
        setCurrentMonth(next);
        setHeaderMonth(next);
    }, [currentMonth, setCurrentMonth, setHeaderMonth]);

    const goToPrevMonth = useCallback(() => {
        const prev = addMonths(currentMonth, -1);
        setCurrentMonth(prev);
        setHeaderMonth(prev);
    }, [currentMonth, setCurrentMonth, setHeaderMonth]);

    const goToNextWeek = useCallback(() => {
        const next = addDays(selectedDate, 7);
        setSelectedDate(next);
        // Update month if needed
        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
            setHeaderMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, setSelectedDate, setCurrentMonth, setHeaderMonth]);

    const goToPrevWeek = useCallback(() => {
        const prev = addDays(selectedDate, -7);
        setSelectedDate(prev);
        // Update month if needed
        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
            setHeaderMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, setSelectedDate, setCurrentMonth, setHeaderMonth]);

    const selectDate = useCallback((date: Date) => {
        setSelectedDate(date);
        // Update month if needed
        if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
            setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            setHeaderMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    }, [currentMonth, setSelectedDate, setCurrentMonth, setHeaderMonth]);

    const selectYear = useCallback((year: number) => {
        const newDate = new Date(year, currentMonth.getMonth(), 1);
        setCurrentMonth(newDate);
        setHeaderMonth(newDate);
        setSelectedDate(new Date(year, selectedDate.getMonth(), selectedDate.getDate()));
    }, [currentMonth, selectedDate, setCurrentMonth, setHeaderMonth, setSelectedDate]);

    return {
        selectedDate,
        headerMonth,
        currentMonth,
        goToToday,
        goToNextMonth,
        goToPrevMonth,
        goToNextWeek,
        goToPrevWeek,
        selectDate,
        selectYear,
    };
};
