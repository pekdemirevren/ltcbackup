import { useCallback } from 'react';
import { useCalendarStore } from './useCalendarStore';
import { CalendarEvent } from '../models/Event';
import { EventRepository } from '../repositories/EventRepository';

export const useEventOperations = () => {
    const { events, loadEvents, addEvent, updateEvent, deleteEvent } = useCalendarStore();

    const createEvent = useCallback(async (eventData: Partial<CalendarEvent> & { title: string; date: string }) => {
        const newEvent: CalendarEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: '09:00',
            duration: 60,
            color: '#32D74B',
            ...eventData,
        };
        await addEvent(newEvent);
        return newEvent;
    }, [addEvent]);

    const editEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
        await updateEvent(id, updates);
    }, [updateEvent]);

    const removeEvent = useCallback(async (id: string) => {
        await deleteEvent(id);
    }, [deleteEvent]);

    const getEventsForDate = useCallback((date: Date | null): CalendarEvent[] => {
        if (!date) return [];
        const dateKey = formatDateKey(date);
        return events.filter((e: CalendarEvent) => {
            const eventDate = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            return eventDate === dateKey;
        });
    }, [events]);

    const refreshEvents = useCallback(async () => {
        await loadEvents();
    }, [loadEvents]);

    return {
        events,
        createEvent,
        editEvent,
        removeEvent,
        getEventsForDate,
        refreshEvents,
    };
};

// Helper function
const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
