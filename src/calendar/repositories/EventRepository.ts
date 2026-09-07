import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '../models/Event';
import { CalendarConfig } from '../config/CalendarConfig';

export class EventRepository {
    private static STORAGE_KEY = CalendarConfig.storage.eventsKey;

    static async getAll(): Promise<CalendarEvent[]> {
        try {
            const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('EventRepository.getAll error:', error);
            return [];
        }
    }

    static async save(event: CalendarEvent): Promise<void> {
        try {
            const events = await this.getAll();
            events.push(event);
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
        } catch (error) {
            console.error('EventRepository.save error:', error);
            throw error;
        }
    }

    static async update(id: string, updates: Partial<CalendarEvent>): Promise<void> {
        try {
            const events = await this.getAll();
            const index = events.findIndex(e => e.id === id);
            if (index !== -1) {
                events[index] = { ...events[index], ...updates };
                await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
            }
        } catch (error) {
            console.error('EventRepository.update error:', error);
            throw error;
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            const events = await this.getAll();
            const filtered = events.filter(e => e.id !== id);
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('EventRepository.delete error:', error);
            throw error;
        }
    }

    static async getByDate(date: Date): Promise<CalendarEvent[]> {
        const dateKey = this.formatDateKey(date);
        const events = await this.getAll();
        return events.filter(e => {
            const eventDate = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            return eventDate === dateKey;
        });
    }

    private static formatDateKey(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
