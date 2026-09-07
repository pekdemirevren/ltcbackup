import { create } from 'zustand';
import { CalendarEvent } from '../models/Event';
import { ViewMode, DaySubMode, MonthViewMode } from '../models/ViewMode';
import { EventRepository } from '../repositories/EventRepository';
import { CalendarConfig } from '../config/CalendarConfig';

interface CalendarState {
    // Core state
    selectedDate: Date;
    headerMonth: Date;
    currentMonth: Date;
    viewMode: ViewMode;
    daySubMode: DaySubMode;
    monthViewMode: MonthViewMode;

    // Events
    events: CalendarEvent[];
    schedule: Record<string, any>;

    // Buffer state
    bufferStart: number;
    bufferEnd: number;
    bufferStage: number;

    // UI state
    isCollapsed: boolean;
    showYearModal: boolean;

    // Actions
    setSelectedDate: (date: Date) => void;
    setHeaderMonth: (date: Date) => void;
    setCurrentMonth: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setDaySubMode: (mode: DaySubMode) => void;
    setMonthViewMode: (mode: MonthViewMode) => void;
    setIsCollapsed: (collapsed: boolean) => void;
    setShowYearModal: (show: boolean) => void;

    // Buffer actions
    setBufferStart: (start: number) => void;
    setBufferEnd: (end: number) => void;
    setBufferStage: (stage: number) => void;
    expandBuffer: (direction: 'up' | 'down') => void;

    // Event actions
    loadEvents: () => Promise<void>;
    addEvent: (event: CalendarEvent) => Promise<void>;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    setSchedule: (schedule: Record<string, any>) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    // Initial state
    selectedDate: new Date(),
    headerMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    viewMode: 'month',
    daySubMode: 'single',
    monthViewMode: 'details',
    events: [],
    schedule: {},
    bufferStart: CalendarConfig.buffer.initialStart,
    bufferEnd: CalendarConfig.buffer.initialEnd,
    bufferStage: 0,
    isCollapsed: false,
    showYearModal: false,

    // Actions
    setSelectedDate: (date) => set({ selectedDate: date }),
    setHeaderMonth: (date) => set({ headerMonth: date }),
    setCurrentMonth: (date) => set({ currentMonth: date }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setDaySubMode: (mode) => set({ daySubMode: mode }),
    setMonthViewMode: (mode) => set({ monthViewMode: mode }),
    setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    setShowYearModal: (show) => set({ showYearModal: show }),

    // Buffer actions
    setBufferStart: (start) => set({ bufferStart: start }),
    setBufferEnd: (end) => set({ bufferEnd: end }),
    setBufferStage: (stage) => set({ bufferStage: stage }),

    expandBuffer: (direction: 'up' | 'down') => {
        const { bufferStart, bufferEnd } = get();
        const { expansionAmount, maxRange } = CalendarConfig.buffer;

        if (direction === 'up' && bufferStart > -maxRange) {
            set({ bufferStart: Math.max(-maxRange, bufferStart - expansionAmount) });
        } else if (direction === 'down' && bufferEnd < maxRange) {
            set({ bufferEnd: Math.min(maxRange, bufferEnd + expansionAmount) });
        }
    },

    // Event actions
    loadEvents: async () => {
        const events = await EventRepository.getAll();
        set({ events });
    },

    addEvent: async (event: CalendarEvent) => {
        await EventRepository.save(event);
        const events = await EventRepository.getAll();
        set({ events });
    },

    updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
        await EventRepository.update(id, updates);
        const events = await EventRepository.getAll();
        set({ events });
    },

    deleteEvent: async (id: string) => {
        await EventRepository.delete(id);
        const events = await EventRepository.getAll();
        set({ events });
    },

    setSchedule: (schedule: Record<string, any>) => set({ schedule }),
}));
