import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CalendarConfig = {
    // Screen dimensions
    screen: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },

    // Heights
    heights: {
        dayView: 60,
        monthView: SCREEN_HEIGHT * 0.7,
        header: 60,
        weekRow: 120,
        collapsedWeek: 60,
        slotHeight: 60,
        timeColumn: 50,
        dayColumnWidth: (SCREEN_WIDTH - 50) / 7,
    },

    // Animation configs
    animation: {
        duration: 420,
        spring: {
            damping: 28,
            stiffness: 200,
            mass: 1,
        },
        coreSpring: {
            damping: 24,
            stiffness: 180,
            mass: 0.9,
        },
    },

    // Storage keys
    storage: {
        eventsKey: '@workout_calendar_events',
        scheduleKey: '@workout_schedule',
    },

    // Buffer settings
    buffer: {
        initialStart: -3,
        initialEnd: 3,
        expansionAmount: 6,
        maxRange: 36,
        expansionThreshold: 1,
    },

    // Colors
    colors: {
        todayBackground: '#FF3B30',
        selectedBackground: 'rgba(255, 255, 255, 0.1)',
        eventBackground: 'rgba(50, 215, 75, 0.2)',
        workoutBackground: 'rgba(255, 159, 10, 0.2)',
        headerText: '#FFFFFF',
        dayText: '#FFFFFF',
        dimmedText: '#8E8E93',
        separator: '#2C2C2E',
    },
} as const;

// Derived constants for easier access
export const SCREEN_WIDTH_CONST = CalendarConfig.screen.width;
export const SCREEN_HEIGHT_CONST = CalendarConfig.screen.height;
export const WEEK_ROW_HEIGHT = CalendarConfig.heights.weekRow;
export const MONTH_VIEW_HEIGHT = CalendarConfig.heights.monthView;
export const DAY_VIEW_HEIGHT = CalendarConfig.heights.dayView;
export const HEADER_HEIGHT = CalendarConfig.heights.header;
export const SLOT_HEIGHT = CalendarConfig.heights.slotHeight;
export const TIME_COLUMN_WIDTH = CalendarConfig.heights.timeColumn;
export const DAY_COLUMN_WIDTH = CalendarConfig.heights.dayColumnWidth;
