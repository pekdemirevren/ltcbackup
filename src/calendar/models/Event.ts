import { WorkoutDayType } from './ViewMode';

export interface Event {
    id: string;
    title: string;
    workoutDay?: WorkoutDayType;
    date: string;
    startTime?: string;
    endTime?: string;
    time?: string;
    duration?: number;
    color?: string;
    alertMinutes?: number;
    secondAlertMinutes?: number;
    workoutIds?: string[];
    calendar?: string;
    repeat?: string;
}

// CalendarEvent is an alias for Event (used by calendar sub-components)
export type CalendarEvent = Event;

export interface Workout {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
    duration?: number;
    notes?: string;
}

export interface WorkoutExercise {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    restTime?: number;
}

export interface MonthInfo {
    weeks: (Date | null)[][];
    month: number;
    year: number;
    monthKey: string;
    bufferIdx: number;
}

export interface WeekInfo {
    week: (Date | null)[];
    monthKey: string;
    globalIdx: number;
    bufferIdx: number;
}

// Utility functions expected by calendar/index.ts
export function createEvent(data: Partial<Event> & { title: string; date: string }): Event {
    return {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        time: '09:00',
        duration: 60,
        color: '#32D74B',
        ...data,
    };
}

export function getEventDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}

export function isMultiDayEvent(event: Event): boolean {
    return Boolean(event.duration && event.duration > 24 * 60);
}

