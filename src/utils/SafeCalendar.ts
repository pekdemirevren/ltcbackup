import { Platform } from 'react-native';

let RNCalendarEvents: any = null;

try {
    // Attempt to require the native module
    const calendarModule = require('react-native-calendar-events');
    RNCalendarEvents = calendarModule.default || calendarModule;
} catch (e) {
    console.log('[SafeCalendar] react-native-calendar-events not found or failed to load');
}

/**
 * Safe wrapper for RNCalendarEvents to prevent crashes when the module
 * is missing, not linked, or fails to load.
 */
export const SafeCalendar = {
    isAvailable: () => !!RNCalendarEvents,

    checkPermissions: async (readOnly = false) => {
        if (!RNCalendarEvents) return 'undetermined';
        try {
            return await RNCalendarEvents.checkPermissions(readOnly);
        } catch (e) {
            console.warn('[SafeCalendar] checkPermissions error:', e);
            return 'undetermined';
        }
    },

    requestPermissions: async (readOnly = false) => {
        if (!RNCalendarEvents) return 'undetermined';
        try {
            return await RNCalendarEvents.requestPermissions(readOnly);
        } catch (e) {
            console.warn('[SafeCalendar] requestPermissions error:', e);
            return 'undetermined';
        }
    },

    findCalendars: async () => {
        if (!RNCalendarEvents) return [];
        try {
            return await RNCalendarEvents.findCalendars();
        } catch (e) {
            console.warn('[SafeCalendar] findCalendars error:', e);
            return [];
        }
    },

    saveEvent: async (title: string, details: any, options: any = {}) => {
        if (!RNCalendarEvents) return null;
        try {
            return await RNCalendarEvents.saveEvent(title, details, options);
        } catch (e) {
            console.warn('[SafeCalendar] saveEvent error:', e);
            return null;
        }
    },

    removeEvent: async (id: string, options: any = {}) => {
        if (!RNCalendarEvents) return false;
        try {
            return await RNCalendarEvents.removeEvent(id, options);
        } catch (e) {
            console.warn('[SafeCalendar] removeEvent error:', e);
            return false;
        }
    },

    fetchAllEvents: async (startDate: string, endDate: string, calendars: string[] = []) => {
        if (!RNCalendarEvents) return [];
        try {
            return await RNCalendarEvents.fetchAllEvents(startDate, endDate, calendars);
        } catch (e) {
            console.warn('[SafeCalendar] fetchAllEvents error:', e);
            return [];
        }
    }
};

export default SafeCalendar;
