// Public API for Calendar module
// This file exports all public interfaces for use in other parts of the app

// Config
export { CalendarConfig, SCREEN_WIDTH_CONST, SCREEN_HEIGHT_CONST, WEEK_ROW_HEIGHT, MONTH_VIEW_HEIGHT, DAY_VIEW_HEIGHT } from './config/CalendarConfig';

// Models
export type { CalendarEvent, Workout, WorkoutExercise, MonthInfo, WeekInfo } from './models/Event';
export { createEvent, getEventDuration, isMultiDayEvent } from './models/Event';
export type { ViewMode, DaySubMode, MonthViewMode, WorkoutDayType } from './models/ViewMode';

// Hooks
export { useCalendarStore } from './hooks/useCalendarStore';
export { useCalendarNavigation } from './hooks/useCalendarNavigation';
export { useInfiniteScroll } from './hooks/useInfiniteScroll';
export { useEventOperations } from './hooks/useEventOperations';
export { useCalendarAnimation } from './hooks/useCalendarAnimation';

// Repositories
export { EventRepository } from './repositories/EventRepository';

// Utils
export * from './utils/dateUtils';

// Components
export { DayCell } from './components/DayCell';
export type { DayCellProps } from './components/DayCell';
export { WeekRow } from './components/WeekRow';
export type { WeekRowProps } from './components/WeekRow';
export { CalendarHeader } from './components/CalendarHeader';
export type { CalendarHeaderProps } from './components/CalendarHeader';
export { MonthGrid } from './components/MonthGrid';
export type { MonthGridProps } from './components/MonthGrid';
export { EventCard, WorkoutCard } from './components/EventCard';
export type { EventCardProps, WorkoutCardProps } from './components/EventCard';
export { TimelineView } from './components/TimelineView';
export type { TimelineViewProps, TimeSlotProps } from './components/TimelineView';
