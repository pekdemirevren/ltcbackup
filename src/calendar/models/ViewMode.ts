// View modes for the calendar
export type ViewMode = 'month' | 'day' | 'year';

// Sub-modes for day view
export type DaySubMode = 'single' | 'multi' | 'list';

// Month view modes
export type MonthViewMode = 'compact' | 'stacked' | 'details' | 'list';

// Re-export WorkoutDayType from canonical source
export type { WorkoutDayType } from '../../utils/WorkoutDayManager';
