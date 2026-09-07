import React, { useState, useMemo, useRef, useCallback, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
    Platform,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Animated as RNAnimated,
    Easing as RNEasing,
    PanResponder,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Easing,
    useAnimatedReaction,
    runOnJS,
    SharedValue,
    useAnimatedScrollHandler,
    FadeInRight,
    SlideInUp,
    withDelay,
    cancelAnimation,
    useAnimatedRef,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlass, LiquidGlassCard, LiquidGlassMenuItem } from './LiquidGlass';
import { WORKOUT_DAY_COLORS, WorkoutDayType, loadWorkoutDayCards, setWorkoutDayForDate, getWorkoutDayForDate, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';
import RNCalendarEvents from 'react-native-calendar-events';
import { TimerContext } from '../contexts/TimerContext';
import YearCalendarModal from './YearCalendarModal';
import Theme, { colors } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allWorkouts, Workout } from '../constants/workoutData';
import { getDailyPlanDetails, setWorkoutForDate, formatDateString } from '../utils/WeeklyPlanManager';
import MetricColors from '../constants/MetricColors';
import { Picker } from '@react-native-picker/picker';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

// iOS Calendar exact heights
const DAY_VIEW_HEIGHT = 60; // Only selected week
const MONTH_VIEW_HEIGHT = SCREEN_HEIGHT * 0.7; // Full month grid - expanded to fill screen
const HEADER_HEIGHT = 60; // Reverted to legacy height
const WEEK_ROW_HEIGHT = 120; // Fixed height for week-by-week scrolling

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ANIMATION_CONFIG = {
    COLLAPSE_DURATION: 420,
    TIMELINE_DURATION: 300,
    FADE_DURATION: 250,
    SPRING_CONFIG: { damping: 20, stiffness: 150 },
    CORE_SPRING_CONFIG: { damping: 28, stiffness: 200, mass: 1, restDisplacementThreshold: 0.01 }, // Robust iOS feel
    EASING: Easing.out(Easing.poly(3)), // Smoother cubic ease out
    BEZIER: Easing.bezier(0.25, 0.1, 0.25, 1) // iOS Calendar "Snappy" Easing
};

// Alert options for event notifications
const ALERT_OPTIONS = [
    { label: 'None', value: -1 },
    { label: 'At time of event', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
];

// Workout days for picker
const WORKOUT_DAYS: WorkoutDayType[] = [
    'LEG DAY',
    'CHEST DAY',
    'SHOULDER DAY',
    'BACK DAY',
    'ABS DAY',
    'BICEPS-TRICEPS DAY',
];

// Repeat options for recurring events
const REPEAT_OPTIONS = [
    { label: 'Never', value: 'never' },
    { label: 'Every Day', value: 'daily' },
    { label: 'Every Week', value: 'weekly' },
    { label: 'Every 2 Weeks', value: 'biweekly' },
    { label: 'Every Month', value: 'monthly' },
    { label: 'Every Year', value: 'yearly' },
];

interface DeviceCalendar {
    id: string;
    title: string;
    color: string;
    source?: string;
}

// Day width for calendar picker in create event
const CREATE_EVENT_DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;

export interface Event {
    id: string;
    title: string;
    workoutDay?: WorkoutDayType;
    date: string;
    startTime?: string;
    endTime?: string;
    alertMinutes?: number;
    secondAlertMinutes?: number;
    workoutIds?: string[];
    calendar?: string;
    repeat?: string;
}

interface CollapsibleCalendarCardProps {
    schedule?: Record<string, WorkoutDayType>;
    events?: Event[];
    onDayPress?: (date: Date) => void;
    onEventPress?: (event: Event) => void;
    onCreateEvent?: (date: Date) => void;
    onFullScreenPress?: () => void;
    initialViewMode?: ViewMode;
    initialSelectedDate?: Date;
    onEventsChange?: (events: Event[]) => void;
    navigation?: StackNavigationProp<RootStackParamList>;
}

export type ViewMode = 'day' | 'month' | 'year';
export type DaySubMode = 'single' | 'multi' | 'list';
export type MonthViewMode = 'compact' | 'stacked' | 'details' | 'list';

// WeekRow component for per-week animations
interface WeekRowProps {
    week: (Date | null)[];
    weekIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    selectedWeekTimestamp: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>;
    multiDayEndDateTimestamp: SharedValue<number>;
    calendarHeight: SharedValue<number>;
    scrollY: SharedValue<number>;
    isMultiDay: boolean; // New Prop
    isAdjacent: boolean;
    isToday: (date: Date | null) => boolean;
    isSelected: (date: Date | null, selected: Date | null) => boolean;
    getEventsForDate: (date: Date | null, allEvents: Event[]) => Event[];
    getWorkoutForDate: (date: Date | null, sched: any) => WorkoutDayType | null;
    selectedDate: Date;
    events: Event[];
    schedule: any;
    handleDayPress: (date: Date) => void;
    weeksLength: number;
    isCollapsed: boolean;
    selectionAnim: SharedValue<number>;
    onNavigateToDetail?: (date: Date) => void;
    onCreateEvent?: (date: Date) => void;
    weekTimestamp: number;
    monthViewMode: MonthViewMode;
}

// ✅ NEW: STANDALONE DAY CELL COMPONENT
interface DayCellProps {
    day: Date | null;
    dayIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    selectedWeekTimestamp: SharedValue<number>;
    selectionAnim: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>;
    multiDayEndDateTimestamp: SharedValue<number>;
    isCollapsed: boolean;
    isMultiDay: boolean; // New Prop
    isToday: boolean;
    isSelected: boolean;
    handleDayPress: (d: Date) => void;
    dayEvents: Event[];
    workout: WorkoutDayType | null;
    eventOpacity?: any;
    hasSelectedDayInWeek: boolean;
    isAdjacent?: boolean;
    onNavigateToDetail?: (date: Date) => void;
    onCreateEvent?: (date: Date) => void;
    weekTimestamp: number;
    monthViewMode: MonthViewMode;
}

const DayCell = React.memo(({
    day,
    dayIdx,
    globalWeekIdx,
    selectedWeekIdx,
    selectionAnim,
    selectedDateTimestamp,
    isCollapsed,
    isToday,
    isSelected,
    handleDayPress,
    dayEvents,
    workout,
    eventOpacity,
    hasSelectedDayInWeek,
    isAdjacent = false,
    onNavigateToDetail,
    onCreateEvent,
    weekTimestamp,
    selectedWeekTimestamp,
    multiDayEndDateTimestamp,
    isMultiDay,
    monthViewMode,
}: DayCellProps) => {
    if (!day) return <View style={styles.dayCell} />;

    const today = isToday;
    const isTodayHidden = false; // Simplified logic to keep today visible

    // Memoize timestamp for stability (JS thread only)
    const dayTimestamp = day ? day.getTime() : 0;
    // Removed setHours(0,0,0,0) here because day is already midnight-stable from parent logic
    // and Date creation is expensive in loops.

    // ✅ SELECTION LOGIC - REACTIVE TO UI THREAD
    const selectionStyle = useAnimatedStyle(() => {
        "worklet";
        // Check if this day is selected (UI Thread)
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60; // Accuracy check within an hour

        // ✅ FIXED: Stable selection week logic (no isCollapsed jump)
        const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;

        // Direkt değer - interpolation yok (daha performanslı)
        const isSelected = isSelectedTimestamp && isSelectedWeek;
        // Hide standard selection circle if it is today (Today has its own indicator)
        const opacity = (isSelected && !today) ? selectionAnim.value : 0;
        const scale = isSelected ? (selectionAnim.value > 0.7 ? 1 : 0.85) : 0.3;

        return {
            opacity,
            transform: [{ scale }],
        };
    }, [dayTimestamp, globalWeekIdx, isCollapsed, today]);

    // Range Logic (UI Thread) - Only active in Multi-Day mode
    const rangeStartStyle = useAnimatedStyle(() => {
        if (!isMultiDay) return { opacity: 0 };
        const isStart = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        return { opacity: isStart ? 1 : 0 };
    }, [isMultiDay, dayTimestamp]);

    const rangeEndStyle = useAnimatedStyle(() => {
        if (!isMultiDay) return { opacity: 0 };
        const isEnd = Math.abs(multiDayEndDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        return { opacity: isEnd ? 1 : 0 };
    }, [isMultiDay, dayTimestamp]);

    const todayCircleStyle = useAnimatedStyle(() => {
        const isSelected = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        return {
            opacity: 1,
            backgroundColor: isSelected ? '#FF3B30' : 'rgba(255, 59, 48, 0.15)',
            transform: [{ scale: isSelected ? 1 : 1 }]
        };
    }, [dayTimestamp]);

    // Text color logic for today and selection
    const dayTextProps = useAnimatedStyle(() => {
        "worklet";
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;

        if (today) {
            return { color: isSelectedTimestamp ? '#FFFFFF' : '#FF3B30' };
        }
        if (isSelectedTimestamp) {
            return { color: '#000000' };
        }
        if (isTodayHidden) {
            return { color: '#FF3B30' };
        }
        if (dayIdx >= 5) {
            return { color: '#8E8E93' }; // Weekend color
        }
        return { color: '#FFFFFF' };
    }, [dayTimestamp, today, isTodayHidden, dayIdx]);

    // Render event indicators based on monthViewMode
    const renderEventIndicators = () => {
        if (!eventOpacity) return null;

        const allEvents = workout ? [{ id: 'workout', workoutDay: workout }, ...dayEvents] : dayEvents;
        if (allEvents.length === 0) return null;

        // List mode - no indicators shown (events listed below calendar)
        if (monthViewMode === 'list') {
            return null;
        }

        // Compact mode - small colored dots
        if (monthViewMode === 'compact') {
            return (
                <Animated.View style={[styles.eventLabels, eventOpacity, { flexDirection: 'row', gap: 2, justifyContent: 'center' }]}>
                    {allEvents.slice(0, 3).map((event, idx) => {
                        const eventColor = event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            ? (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            : '#8E8E93';
                        return (
                            <View
                                key={event.id || idx}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: eventColor,
                                }}
                            />
                        );
                    })}
                </Animated.View>
            );
        }

        // Stacked mode - horizontal bars
        if (monthViewMode === 'stacked') {
            return (
                <Animated.View style={[styles.eventLabels, eventOpacity, { gap: 2 }]}>
                    {allEvents.slice(0, 3).map((event, idx) => {
                        const eventColor = event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            ? (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            : '#8E8E93';
                        return (
                            <View
                                key={event.id || idx}
                                style={{
                                    height: 3,
                                    backgroundColor: eventColor,
                                    borderRadius: 1.5,
                                    width: '90%',
                                    alignSelf: 'center',
                                }}
                            />
                        );
                    })}
                </Animated.View>
            );
        }

        // Details mode (default) - full event labels
        return (
            <Animated.View style={[styles.eventLabels, eventOpacity]}>
                {workout && (WORKOUT_DAY_COLORS as any)[workout] && (
                    <View style={[styles.eventPill, { backgroundColor: (WORKOUT_DAY_COLORS as any)[workout] + '40' }]}>
                        <View style={[{ width: 0, height: 0 }]} />
                        <Text style={[styles.eventText, { color: (WORKOUT_DAY_COLORS as any)[workout] }]} numberOfLines={1}>
                            {workout.replace(' Day', '').replace(' DAY', '')}
                        </Text>
                    </View>
                )}
                {dayEvents.slice(0, 1).map((event) => (
                    <View
                        key={event.id}
                        style={[styles.eventPill, { backgroundColor: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] + '40' : '#2C2C2E' }]}
                    >
                        <View style={[{ width: 0, height: 0 }]} />
                        <Text style={[styles.eventText, { color: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#FFFFFF' }]} numberOfLines={1}>
                            {event.title.toLowerCase()}
                        </Text>
                    </View>
                ))}
            </Animated.View>
        );
    };

    return (
        <TouchableOpacity
            style={styles.dayCell}
            onPress={() => !isAdjacent && handleDayPress(day)}
            onLongPress={() => !isAdjacent && day && onCreateEvent && onCreateEvent(day)}
            delayLongPress={800}
            activeOpacity={1}
            disabled={isAdjacent}
        >
            {/* Always render selection circle - controlled by animated style */}
            {(true) && ( // Removed !today check to allow range indicators on Today
                <>
                    {/* Range Start (Day 1) - Left side rounded, extends to RIGHT edge */}
                    <Animated.View style={[
                        {
                            position: 'absolute',
                            height: 40, // Match white circle
                            top: 9,
                            left: 4,
                            right: -2,
                            backgroundColor: '#3A3A3C',
                            borderTopLeftRadius: 20, // Match white circle
                            borderBottomLeftRadius: 20,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            zIndex: 0,
                        },
                        rangeStartStyle
                    ]} />

                    {/* Range End (Day 2) - Right side rounded, extends from LEFT edge */}
                    <Animated.View style={[
                        {
                            position: 'absolute',
                            height: 40, // Match white circle
                            top: 9,
                            left: -2,
                            right: 4,
                            backgroundColor: '#3A3A3C',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderTopRightRadius: 20, // Match white circle
                            borderBottomRightRadius: 20,
                            zIndex: 0,
                        },
                        rangeEndStyle
                    ]} />

                    <Animated.View style={[styles.selectedCircle, selectionStyle]} pointerEvents="none" />
                </>
            )}

            {/* Today circle - Now conditional on selection via Animated Style */}
            {today && (
                <Animated.View style={[
                    styles.todayCircle,
                    todayCircleStyle
                ]} pointerEvents="none" />
            )}

            {/* Day Number text */}
            <Animated.Text style={[
                styles.dayNumber,
                dayTextProps,
                isAdjacent && { opacity: 0.3 }
            ]}>
                {day.getDate()}
            </Animated.Text>

            {renderEventIndicators()}
        </TouchableOpacity >
    );
}, (prevProps, nextProps) => {
    // Custom comparison for DayCell performance
    return (
        prevProps.day?.getTime() === nextProps.day?.getTime() &&
        prevProps.isToday === nextProps.isToday &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isCollapsed === nextProps.isCollapsed &&
        prevProps.isMultiDay === nextProps.isMultiDay &&
        prevProps.monthViewMode === nextProps.monthViewMode &&
        prevProps.dayEvents === nextProps.dayEvents &&
        prevProps.workout === nextProps.workout
    );
});

const WeekRow = React.memo(({
    week,
    weekIdx,
    globalWeekIdx,
    selectedWeekIdx,
    selectedDateTimestamp,
    calendarHeight,
    scrollY,
    isAdjacent,
    isToday,
    isSelected,
    selectedDate,
    events,
    schedule,
    getEventsForDate,
    getWorkoutForDate,
    handleDayPress,
    weeksLength,
    isCollapsed,
    selectionAnim,
    onNavigateToDetail,
    onCreateEvent,
    weekTimestamp,
    selectedWeekTimestamp,
    multiDayEndDateTimestamp,
    isMultiDay,
    monthViewMode,
}: WeekRowProps) => {
    const hasSelectedDay = useMemo(() => week.some(day => day && isSelected(day, selectedDate)), [week, isSelected, selectedDate]);

    const eventOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 50, DAY_VIEW_HEIGHT + 150],
            [0, 0, 1],
            'clamp'
        )
    }));

    const weekAnimatedStyle = useAnimatedStyle(() => {
        'worklet';

        // ✅ COLLAPSED STATE: Hide all non-selected rows completely
        const isCollapsed = calendarHeight.value <= DAY_VIEW_HEIGHT + 10;
        if (isCollapsed) {
            const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;
            return {
                opacity: isSelectedWeek ? 1 : 0,
                transform: [{ translateY: 0 }],
                zIndex: isSelectedWeek ? 100 : 0,
            };
        }

        // PERFORMANCE BOOST: When fully expanded, skip all complex calculations
        if (calendarHeight.value >= MONTH_VIEW_HEIGHT - 1) {
            return {
                opacity: 1,
                transform: [{ translateY: 0 }],
                zIndex: 1,
            };
        }

        const progress = interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [0, 1],
            'clamp'
        );

        const thisRowOffset = globalWeekIdx * WEEK_ROW_HEIGHT;
        const currentScroll = scrollY.value;
        const thisRowScreenY = thisRowOffset - currentScroll;
        const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;

        // ✅ HERO ROW: Use double-quadratic for THE most fluid "yağ gibi" feel
        const heroEasedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (isSelectedWeek) {
            // Raw float for sub-pixel stability (removal of Math.round to fix jitter/friction)
            const translateY = progress === 1 ? 0 : -thisRowScreenY * (1 - heroEasedProgress);
            return {
                opacity: 1,
                transform: [{ translateY }],
                zIndex: progress === 1 ? 1 : 100,
            };
        }

        const relativeIndex = globalWeekIdx - selectedWeekIdx.value;
        const rowsAway = Math.abs(relativeIndex);
        const isAbove = relativeIndex < 0;

        // ✅ EXIT LOGIC: Share the same fluid base as hero, but accelerate the above rows
        const baseProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Above rows clear out much faster (power 6) to ensure they clear the path instantly
        const rowExitProgress = isAbove
            ? Math.pow(baseProgress, 6)
            : baseProgress;

        // ✅ FIXED - Smooth EaseOutCubic (approximation of bezier)
        const rowEasedProgress = 1 - Math.pow(1 - rowExitProgress, 3);

        const direction = isAbove ? -1 : 1;
        // Travel distance (2.8x optimized to reduce jitter and match iOS snap)
        const slideDistance = (rowsAway + 1) * WEEK_ROW_HEIGHT * 2.8;
        const translateY = direction * slideDistance * (1 - rowEasedProgress);

        // ✅ YENİ - Gradual fade for non-selected rows
        const opacity = interpolate(rowEasedProgress, [0, 0.3, 1], [0, 0.5, 1], 'clamp');

        return {
            opacity,
            transform: [{ translateY }],
            // ✅ Above rows stay ON TOP of hero (110) while they zip away
            zIndex: progress === 1 ? 1 : (isAbove ? 110 : 1),
        };
    }, [globalWeekIdx]);


    // Calculate connected pill for Multi Day mode
    // Use compact height for List mode
    const rowHeight = monthViewMode === 'list' ? 48 : WEEK_ROW_HEIGHT;

    return (
        <Animated.View
            style={[
                {
                    flexDirection: 'row',
                    height: rowHeight,
                    alignItems: 'flex-start',
                    paddingHorizontal: 0,
                },
                // Only show border if not in List mode
                monthViewMode !== 'list' && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: '#2C2C2E',
                },
                weekAnimatedStyle
            ]}
        >
            {
                week.map((day, dayIdx) => {
                    const isSelectedDay = isSelected(day, selectedDate);
                    const isTodayDay = isToday(day);
                    const dayEvents = getEventsForDate(day);
                    const workout = getWorkoutForDate(day);

                    return (
                        <DayCell
                            key={day ? day.toISOString() : `empty-${dayIdx}`}
                            day={day}
                            dayIdx={dayIdx}
                            globalWeekIdx={globalWeekIdx}
                            selectedWeekIdx={selectedWeekIdx}
                            selectedWeekTimestamp={selectedWeekTimestamp}
                            selectedDateTimestamp={selectedDateTimestamp}
                            multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                            selectionAnim={selectionAnim}
                            weekTimestamp={weekTimestamp}
                            isCollapsed={isCollapsed}
                            isToday={isTodayDay}
                            isSelected={isSelectedDay}
                            handleDayPress={handleDayPress}
                            dayEvents={dayEvents}
                            workout={workout}
                            eventOpacity={eventOpacity}
                            hasSelectedDayInWeek={hasSelectedDay}
                            onNavigateToDetail={onNavigateToDetail}
                            onCreateEvent={onCreateEvent}
                            isMultiDay={isMultiDay}
                            monthViewMode={monthViewMode}
                        />
                    );
                })
            }
        </Animated.View >
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance - only re-render when these change
    return (
        prevProps.globalWeekIdx === nextProps.globalWeekIdx &&
        prevProps.weekIdx === nextProps.weekIdx &&
        prevProps.isCollapsed === nextProps.isCollapsed &&
        prevProps.monthViewMode === nextProps.monthViewMode &&
        prevProps.isMultiDay === nextProps.isMultiDay &&
        prevProps.weekTimestamp === nextProps.weekTimestamp &&
        prevProps.selectedDate?.getTime() === nextProps.selectedDate?.getTime() &&
        prevProps.events === nextProps.events &&
        prevProps.schedule === nextProps.schedule
    );
});

// İskambil kağıdı efekti için TimeSlot komponenti
interface TimeSlotItemProps {
    time: string;
    idx: number;
    timelineAnim: SharedValue<number>;
    hasEvents: boolean;
    workout: WorkoutDayType | null;
    dayEvents: Event[];
    date: Date;
    onCreateEvent?: (date: Date) => void;
    onEventPress?: (event: Event) => void;
    onWorkoutDayPress?: (date: Date, currentWorkoutDay: WorkoutDayType | null) => void;
    onNavigateToDailyDetail?: (date: Date) => void;
    isMultiDay?: boolean;
}

// Helper function to calculate event duration in minutes
const getEventDuration = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    if (endTotal < startTotal) {
        endTotal += 24 * 60; // Add 24 hours if crossing midnight
    }

    return endTotal - startTotal;
};

// Helper function to get minutes offset within an hour
const getMinutesOffset = (time: string): number => {
    const [, minutes] = time.split(':').map(Number);
    return minutes;
};

const SLOT_HEIGHT = 50; // Original height per hour slot

interface TimeSlotContentProps {
    date: Date;
    hour: number;
    dayEvents: Event[];
    workout: WorkoutDayType | null;
    availableWidth: number;
    leftOffsetBase: number;
    onCreateEvent?: (date: Date) => void;
    onEventPress?: (event: Event) => void;
    onWorkoutDayPress?: (date: Date, currentWorkoutDay: WorkoutDayType | null) => void;
    onNavigateToDailyDetail?: (date: Date) => void;
    isMultiDay?: boolean;
}

const renderEventsForDate = (date: Date, events: Event[], workout: WorkoutDayType | null, availableWidth: number, onEventPress?: (event: Event) => void, isMultiDay?: boolean) => {
    return events.map((event, index) => {
        const hour = event.startTime ? parseInt(event.startTime.split(':')[0]) : -1;
        if (hour === -1) return null;

        const durationMinutes = getEventDuration(event.startTime as string, event.endTime as string);
        const minutesOffset = getMinutesOffset(event.startTime as string);

        // Check how many events start in the same hour to calculate width/offset
        const slotEvents = events.filter(e => {
            const h = e.startTime ? parseInt(e.startTime.split(':')[0]) : -1;
            return h === hour;
        });

        const hasWorkoutAtThisHour = hour === 9 && !!workout;
        const totalItems = (hasWorkoutAtThisHour ? 1 : 0) + slotEvents.length;
        const itemWidth = totalItems > 0 ? (availableWidth / totalItems) : availableWidth;

        const eventIndexInSlot = slotEvents.findIndex(e => e.id === event.id);
        const itemIndex = hasWorkoutAtThisHour ? eventIndexInSlot + 1 : eventIndexInSlot;

        const eventHeight = Math.max(30, (durationMinutes / 60) * SLOT_HEIGHT);
        const topOffset = (hour * SLOT_HEIGHT) + (minutesOffset / 60) * SLOT_HEIGHT;
        const leftOffset = itemIndex * itemWidth;

        return (
            <TouchableOpacity
                key={event.id}
                style={[
                    styles.timelineCard,
                    {
                        position: 'absolute',
                        top: topOffset,
                        left: leftOffset,
                        width: itemWidth - 4,
                        height: eventHeight,
                        zIndex: 10,
                        backgroundColor: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] + '30' : '#2C2C2E60',
                        borderLeftColor: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#8E8E93'
                    }
                ]}
                onPress={() => onEventPress && onEventPress(event)}
                activeOpacity={0.8}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.timelineCardTitle, { color: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#FFF', fontSize: isMultiDay ? 11 : 13 }]} numberOfLines={1}>
                        {event.title}
                    </Text>
                    {!isMultiDay && <Text style={styles.timelineCardTime} numberOfLines={1}>{event.startTime} - {event.endTime}</Text>}
                </View>
            </TouchableOpacity>
        );
    });
};

const TimeSlotContent = React.memo(({
    date,
    hour,
    dayEvents,
    workout,
    availableWidth,
    leftOffsetBase,
    onCreateEvent,
    onEventPress,
    onWorkoutDayPress,
    onNavigateToDailyDetail,
    isMultiDay,
}: TimeSlotContentProps) => {
    // Check if workout exists at this hour (workout shows at hour 9)
    const hasWorkoutAtThisHour = hour === 9 && !!workout;

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
                style={[styles.slotContent, { height: SLOT_HEIGHT }]}
                onPress={() => {
                    // Empty time slot click: Open create event modal
                    const dateWithTime = new Date(date);
                    dateWithTime.setHours(hour, 0, 0, 0);
                    if (onCreateEvent) onCreateEvent(dateWithTime);
                }}
                onLongPress={() => {
                    const dateWithTime = new Date(date);
                    dateWithTime.setHours(hour, 0, 0, 0);
                    if (onCreateEvent) onCreateEvent(dateWithTime);
                }}
                delayLongPress={1100}
                activeOpacity={0.7}
            />

            {/* Render workout card at hour 9 */}
            {hasWorkoutAtThisHour && (
                <TouchableOpacity
                    style={[
                        styles.timelineCard,
                        {
                            position: 'absolute',
                            top: 0,
                            left: leftOffsetBase,
                            width: availableWidth - 4, // Simple full width for workout
                            height: SLOT_HEIGHT - 4,
                            zIndex: 10,
                            backgroundColor: (WORKOUT_DAY_COLORS as any)[workout] + '25',
                            borderLeftColor: (WORKOUT_DAY_COLORS as any)[workout]
                        }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onWorkoutDayPress && onWorkoutDayPress(date, workout)}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.timelineCardTitle, { color: (WORKOUT_DAY_COLORS as any)[workout], fontSize: isMultiDay ? 11 : 13 }]} numberOfLines={1}>{workout}</Text>
                        {!isMultiDay && <Text style={styles.timelineCardTime}>All day</Text>}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
});
function TimeSlotItem({
    time,
    idx,
    timelineAnim,
    hasEvents,
    workout,
    dayEvents,
    date,
    onCreateEvent,
    onEventPress,
    onWorkoutDayPress,
    onNavigateToDailyDetail,
    isMultiDay,
}: TimeSlotItemProps) {
    const hour = parseInt(time.split(':')[0]);
    const availableWidth = SCREEN_WIDTH - 50 - 12; // Adjusted for styles.timeText width

    return (
        <View style={[styles.timeSlot, { borderBottomWidth: 0 }]}>
            <Text style={styles.timeText}>{time}</Text>
            <View style={{ flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2C2C2E' }}>
                <TimeSlotContent
                    date={date}
                    hour={hour}
                    dayEvents={dayEvents}
                    workout={workout}
                    availableWidth={availableWidth}
                    leftOffsetBase={0}
                    onCreateEvent={onCreateEvent}
                    onEventPress={onEventPress}
                    onWorkoutDayPress={onWorkoutDayPress}
                    onNavigateToDailyDetail={onNavigateToDailyDetail}
                    isMultiDay={isMultiDay}
                />
            </View>
        </View>
    );
}



interface MultiDayHeaderItemProps {
    d: Date;
    idx: number;
    DAY_COLUMN_WIDTH: number;
    HEADER_HEIGHT: number;
    isToday: boolean;
}

const MultiDayHeaderItem = React.memo(({
    d,
    idx,
    DAY_COLUMN_WIDTH,
    HEADER_HEIGHT,
    isToday
}: MultiDayHeaderItemProps) => {
    return (
        <View
            style={{
                width: DAY_COLUMN_WIDTH,
                height: HEADER_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
                borderRightWidth: 0.5,
                borderRightColor: '#2C2C2E',
            }}
        >
            <Text style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
            }}>
                {MONTHS_SHORT[d.getMonth()]} {d.getDate()} - {WEEKDAYS_SHORT[d.getDay()]}
            </Text>
        </View>
    );
});



export default function CollapsibleCalendarCard({
    schedule = {},
    events = [],
    onDayPress,
    onEventPress,
    onCreateEvent,
    onFullScreenPress,
    initialViewMode = 'month',
    initialSelectedDate,
    onEventsChange,
    navigation,
}: CollapsibleCalendarCardProps) {
    const timerContext = useContext(TimerContext);
    const navigationHook = useNavigation<StackNavigationProp<RootStackParamList>>();
    const nav = navigation || navigationHook;

    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = initialSelectedDate ? new Date(initialSelectedDate) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [headerMonth, setHeaderMonth] = useState(() => {
        const d = initialSelectedDate ? new Date(initialSelectedDate) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState<Date>(() => initialSelectedDate ? new Date(initialSelectedDate) : new Date());
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const [daySubMode, setDaySubMode] = useState<DaySubMode>('single');
    const [monthViewMode, setMonthViewMode] = useState<MonthViewMode>('details');
    const [multiDayStartDate, setMultiDayStartDate] = useState<Date>(new Date(selectedDate));
    // iOS-style 2-day selection range
    const [multiDayEndDate, setMultiDayEndDate] = useState<Date>(() => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [visibleDayIndex, setVisibleDayIndex] = useState<number>(50);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);
    // ✅ Progressive rendering stage: 0 (current only), 1 (±1 month), 3 (full initial buffer)
    const [bufferStage, setBufferStage] = useState(0);

    // ✅ Dynamic buffer range (expands as user scrolls)
    const [bufferStart, setBufferStart] = useState(-3); // Months before anchor
    const [bufferEnd, setBufferEnd] = useState(3);      // Months after anchor

    // ✅ FIXED ANCHOR: Today's month (never changes)
    const anchorMonth = useMemo(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }, []);

    // Sync header and progressively expand initial buffer
    useEffect(() => {
        const d = initialSelectedDate ? new Date(initialSelectedDate) : new Date();
        setHeaderMonth(new Date(d.getFullYear(), d.getMonth(), 1));

        // Progressive expansion schedule (initial load only)
        const stage1 = setTimeout(() => setBufferStage(1), 300);
        const stage2 = setTimeout(() => setBufferStage(3), 800);

        return () => {
            clearTimeout(stage1);
            clearTimeout(stage2);
        };
    }, []);

    // Scroll compensation ref for prepending
    const pendingScrollCompensation = useRef<number>(0);

    // Apply scroll compensation when bufferStart changes
    useEffect(() => {
        if (pendingScrollCompensation.current > 0) {
            const compensation = pendingScrollCompensation.current;
            pendingScrollCompensation.current = 0;
            requestAnimationFrame(() => {
                monthScrollViewRef.current?.scrollTo({ y: compensation, animated: false });
            });
        }
    }, [bufferStart]);


    // Event Detail State (Full Screen with slide animation)
    const [showEventDetail, setShowEventDetail] = useState(false);
    const [selectedEventForDetail, setSelectedEventForDetail] = useState<Event | null>(null);
    const [eventDetailWorkouts, setEventDetailWorkouts] = useState<Workout[]>([]);
    const [showAlertPicker, setShowAlertPicker] = useState(false);
    const [showSecondAlertPicker, setShowSecondAlertPicker] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Workout Day Picker Modal State (for selecting workout day for a date)
    const [showWorkoutDayPicker, setShowWorkoutDayPicker] = useState(false);
    const [workoutDayPickerDate, setWorkoutDayPickerDate] = useState<Date>(new Date());
    const [selectedWorkoutDayForPicker, setSelectedWorkoutDayForPicker] = useState<WorkoutDayType>('LEG DAY');
    const workoutDayPickerSlideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;

    // Event Detail animation for sliding from right
    const eventDetailSlideAnim = useRef(new RNAnimated.Value(SCREEN_WIDTH)).current;

    // Refs for close handlers (used by PanResponder)
    const closeEventDetailRef = useRef<() => void>(() => { });
    const closeCreateEventRef = useRef<() => void>(() => { });

    // Create Event Modal State
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [createEventDate, setCreateEventDate] = useState<Date>(new Date());
    const [createEventEndDate, setCreateEventEndDate] = useState<Date>(new Date());
    const [createEventTitle, setCreateEventTitle] = useState('');
    const [createEventStartTime, setCreateEventStartTime] = useState('09:00');
    const [createEventEndTime, setCreateEventEndTime] = useState('10:00');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDayType>('LEG DAY');
    const [createEventRepeat, setCreateEventRepeat] = useState('never');
    const [createEventType, setCreateEventType] = useState<'event' | 'reminder'>('event');
    const [activePickerField, setActivePickerField] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | 'repeat' | 'workout' | null>(null);
    const [createPickerMonth, setCreatePickerMonth] = useState<Date>(new Date());
    const [showViewMenu, setShowViewMenu] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [viewMenuPosition, setViewMenuPosition] = useState({ top: 0, right: 20 });
    const viewButtonRef = useRef<View>(null);
    const bottomGoalRef = useRef<View>(null);
    const viewMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Create Event animation refs (using React Native Animated for picker heights)
    const dateTimePickerHeight = useRef(new RNAnimated.Value(0)).current;
    const workoutPickerHeight = useRef(new RNAnimated.Value(0)).current;
    const createEventSlideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;

    // Ref for title input auto-focus
    const titleInputRef = useRef<TextInput>(null);

    // Button Animations based on view mode and modal state


    // Menu Interpolations


    // PanResponder for Event Detail swipe-to-close (left edge)
    const eventDetailPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false, // Don't capture taps
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Capture right swipes with sufficient horizontal movement
                return gestureState.dx > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx > 0) {
                    eventDetailSlideAnim.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 100 || gestureState.vx > 0.5) {
                    closeEventDetailRef.current();
                } else {
                    RNAnimated.spring(eventDetailSlideAnim, {
                        toValue: 0,
                        friction: 20,
                        tension: 80,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // PanResponder for Create Event swipe-to-close (pull down on header)
    const createEventPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Detect vertical swipe down
                return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => { },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    createEventSlideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.3) {
                    closeCreateEventRef.current();
                } else {
                    RNAnimated.spring(createEventSlideAnim, {
                        toValue: 0,
                        friction: 25,
                        tension: 100,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (initialSelectedDate) {
            const dateObj = new Date(initialSelectedDate);
            setSelectedDate(dateObj);
            setCurrentMonth(dateObj);
            setHeaderMonth(dateObj);
        }
    }, [initialSelectedDate]);

    // Calendar logic
    const formatDateKey = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

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

    const getWeekDays = (centerDate: Date): (Date | null)[] => {
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

    const getWeeksFromDays = (d: (Date | null)[]) => {
        const w = [];
        for (let i = 0; i < d.length; i += 7) {
            w.push(d.slice(i, i + 7));
        }
        return w;
    };

    const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

    // ✅ DYNAMIC BUFFER: expands from bufferStart to bufferEnd
    const monthWeeksInfo = useMemo(() => {
        const info = [];
        for (let i = bufferStart; i <= bufferEnd; i++) {
            const date = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + i, 1);
            const w = getWeeksFromDays(getDaysInMonth(date));
            info.push({
                weeks: w,
                month: date.getMonth(),
                year: date.getFullYear(),
                monthKey: `month-${date.getFullYear()}-${date.getMonth()}`,
                bufferIdx: i
            });
        }
        return info;
    }, [anchorMonth, bufferStart, bufferEnd]);

    const allBufferedWeeks = useMemo(() => {
        const weeksList: { week: (Date | null)[], monthKey: string, globalIdx: number, bufferIdx: number }[] = [];
        let globalIdx = 0;
        monthWeeksInfo.forEach(m => {
            m.weeks.forEach(w => {
                weeksList.push({ week: w, monthKey: m.monthKey, globalIdx, bufferIdx: m.bufferIdx });
                globalIdx++;
            });
        });
        return weeksList;
    }, [monthWeeksInfo]);

    // Center offset: scroll to anchor month (index = -bufferStart in array)
    const centerOffsetWeeks = useMemo(() => {
        let count = 0;
        const anchorIndex = -bufferStart; // Index of month 0 (today) in the array
        for (let i = 0; i < anchorIndex; i++) {
            count += monthWeeksInfo[i].weeks.length;
        }
        return count;
    }, [monthWeeksInfo, bufferStart]);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const prevWeekDays = useMemo(() => {
        const results = [];
        for (let i = 5; i >= 1; i--) {
            const date = new Date(selectedDate);
            date.setDate(selectedDate.getDate() - (i * 7));
            results.push(...getWeekDays(date));
        }
        return results;
    }, [selectedDate]);
    const nextWeekDays = useMemo(() => {
        const results = [];
        for (let i = 1; i <= 5; i++) {
            const date = new Date(selectedDate);
            date.setDate(selectedDate.getDate() + (i * 7));
            results.push(...getWeekDays(date));
        }
        return results;
    }, [selectedDate]);

    const weeks = useMemo(() => getWeeksFromDays(days), [days]);
    const allWeeks = useMemo(() => allBufferedWeeks.map(iw => iw.week), [allBufferedWeeks]);
    // Note: prevMonthWeeks and nextMonthWeeks are now calculated directly above


    // Animasyon değerleri
    const calendarHeight = useSharedValue(MONTH_VIEW_HEIGHT);
    const selectedWeekIdx = useSharedValue(0);
    const selectedWeekTimestamp = useSharedValue(0);
    // Initialize scrollY to center of the buffer
    const initialScrollY = useMemo(() => centerOffsetWeeks * WEEK_ROW_HEIGHT, [centerOffsetWeeks]);
    const scrollY = useSharedValue(initialScrollY);
    const dateTitleAnim = useSharedValue(0);
    const selectionAnim = useSharedValue(1); // Seçili gün dairesi görünür başlasın
    const selectedDateTimestamp = useSharedValue(selectedDate.setHours(0, 0, 0, 0)); // NEW: for reactive selection



    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // MONTH HEADER UPDATE - Uses JS callback for reliable state updates
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    const lastHeaderMonthIdxRef = useRef<number>(-1);

    const updateHeaderFromScroll = useCallback((scrollYValue: number) => {
        const weekIdx = Math.floor(scrollYValue / WEEK_ROW_HEIGHT);
        if (weekIdx < 0) return;

        let count = 0;
        let monthIdx = 0;
        for (let i = 0; i < monthWeeksInfo.length; i++) {
            const startOfThisMonth = count;
            const weeksInThisMonth = monthWeeksInfo[i].weeks.length;
            count += weeksInThisMonth;

            // Header transition threshold: 
            // - On initial load (start of month), we want current month.
            // - As we scroll, switch to NEXT month after passing the 3rd week.
            const threshold = 3.5; // Slightly more than 3 weeks to be safer on mount

            if (weekIdx >= startOfThisMonth + threshold && i < monthWeeksInfo.length - 1) {
                continue;
            } else {
                monthIdx = i;
                break;
            }
        }

        if (monthIdx !== -1 && monthIdx !== lastHeaderMonthIdxRef.current) {
            lastHeaderMonthIdxRef.current = monthIdx;
            const target = monthWeeksInfo[monthIdx];
            if (target) {
                setHeaderMonth(new Date(target.year, target.month, 1));
            }
        }
    }, [monthWeeksInfo]);

    // NOTE: Removed useAnimatedReaction for header update (caused jank on every scroll frame).
    // Header is now updated only on scroll end via handleMonthScrollEnd.

    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // NOTE: No dynamic buffer expansion needed with fixed 24-month buffer
    // The buffer covers 12 months past + 12 months future from today - ample range for most use cases
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════

    const multiDayEndDateTimestamp = useSharedValue(new Date(selectedDate).setHours(0, 0, 0, 0) + 86400000); // 2nd day of selection
    const timelineAnim = useSharedValue(0); // Timeline için bağımsız animasyon
    const monthTitleAnim = useSharedValue(1); // Month title için (1 = görünür, 0 = gizli)


    // Scroll Handler
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const monthScrollViewRef = useRef<Animated.ScrollView>(null);
    const weekScrollViewRef = useRef<ScrollView>(null);
    const timelineHorizontalScrollViewRef = useRef<ScrollView>(null);
    const timelineVerticalScrollRef = useRef<ScrollView>(null);
    const listMonthScrollRef = useRef<ScrollView>(null);

    // ✅ New refs for multi-day frozen column sync - using useAnimatedRef for Reanimated integration
    const multiDayHorizontalHeaderScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayHorizontalContentScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayVerticalTimeScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayVerticalContentScrollRef = useAnimatedRef<Animated.ScrollView>();

    // Pre-calculate multiDayStartDate timestamp for worklet usage
    const multiDayStartDateTimestamp = useMemo(() => {
        return multiDayStartDate.getTime();
    }, [multiDayStartDate]);

    // Shared values for multi-day sync
    const multiDayScrollX = useSharedValue(0);
    const multiDayScrollY = useSharedValue(0);

    // Scroll handlers for multi-day synchronization
    const multiDayHeaderScrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            multiDayScrollX.value = event.contentOffset.x;
        },
    });

    const multiDayContentHorizontalScrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            'worklet';
            // Header sync
            multiDayScrollX.value = event.contentOffset.x;

            // ═══════════════════════════════════════════════════════
            // iOS CALENDAR STYLE SELECTION: 90% THRESHOLD
            // ═══════════════════════════════════════════════════════
            const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 50) / 2;
            const offsetX = event.contentOffset.x;

            // Exact position calculation (float)
            const exactIndex = offsetX / DAY_COLUMN_WIDTH;
            const currentIndex = Math.floor(exactIndex);

            // Decimal part: 0.0 -> 0.99
            const progress = exactIndex - currentIndex;

            // Trigger selection update ONLY when 90% of the column is scrolled past
            const targetIndex = progress >= 0.9 ? currentIndex + 1 : currentIndex;

            // Calculate timestamp for the target day
            const daysFromCenter = targetIndex - 10;
            const baseTime = multiDayStartDateTimestamp;
            const targetTime = baseTime + (daysFromCenter * 86400000);

            // ✅ CRITICAL: Ensure midnight alignment in local timezone
            const tempDate = new Date(targetTime);
            tempDate.setHours(0, 0, 0, 0);
            const alignedTimestamp = tempDate.getTime();
            const nextDayTimestamp = alignedTimestamp + 86400000;

            // UI Thread Update: Immediate Feedback
            if (selectedDateTimestamp.value !== alignedTimestamp) {
                selectedDateTimestamp.value = alignedTimestamp;
                // Update End Date (Start + 1 Day)
                multiDayEndDateTimestamp.value = alignedTimestamp + 86400000;
            }
        },
    }, [multiDayStartDateTimestamp, SCREEN_WIDTH]);

    const multiDayContentVerticalScrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            multiDayScrollY.value = event.contentOffset.y;
        },
    });

    // Animated styles for effortless synchronization
    const headerScrollStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -multiDayScrollX.value }]
    }));

    const contentHorizontalStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -multiDayScrollX.value }]
    }));

    const timeColumnStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -multiDayScrollY.value }]
    }));

    // ✅ Multi-day scroll synchronization is handled inline in renderTimelinePane


    // Initial scroll setup - only on first expand, not on every monthWeeksInfo change
    const hasInitializedMonthScrollRef = useRef(false);
    useEffect(() => {
        if (!isCollapsed && monthScrollViewRef.current) {
            if (!hasInitializedMonthScrollRef.current) {
                // First time expanding - set initial scroll position
                monthScrollViewRef.current.scrollTo({ y: centerOffsetWeeks * WEEK_ROW_HEIGHT, animated: false });
                hasInitializedMonthScrollRef.current = true;
            }
        } else if (isCollapsed) {
            // Reset the flag when collapsed, so next expand can set scroll again
            hasInitializedMonthScrollRef.current = false;
        }
    }, [isCollapsed, centerOffsetWeeks]);


    useEffect(() => {
        if (isCollapsed && weekScrollViewRef.current) {
            weekScrollViewRef.current.scrollTo({ x: SCREEN_WIDTH, animated: false });
        }
    }, [isCollapsed]);

    useEffect(() => {
        if (isCollapsed && timelineHorizontalScrollViewRef.current) {
            timelineHorizontalScrollViewRef.current.scrollTo({ x: SCREEN_WIDTH, animated: false });
        }
    }, [isCollapsed]);

    // ✅ Sync selectedWeekIdx whenever selectedDate or month data changes
    useEffect(() => {
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === selectedDate.toDateString())
        );
        if (weekIdx !== -1 && selectedWeekIdx.value !== weekIdx) {
            selectedWeekIdx.value = weekIdx;
        }
        // Sync selectedDateTimestamp for reactive DayCell updates
        const newTimestamp = new Date(selectedDate).setHours(0, 0, 0, 0);
        if (selectedDateTimestamp.value !== newTimestamp) {
            selectedDateTimestamp.value = newTimestamp;
            multiDayEndDateTimestamp.value = newTimestamp + 86400000;
        }

        // Sync selectedWeekTimestamp for stable row identification
        const dForWeek = new Date(selectedDate);
        const dayOfWeek = dForWeek.getDay();
        const diff = dForWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        dForWeek.setDate(diff);
        dForWeek.setHours(0, 0, 0, 0);
        const newWeekTimestamp = dForWeek.getTime();
        if (selectedWeekTimestamp.value !== newWeekTimestamp) {
            selectedWeekTimestamp.value = newWeekTimestamp;
        }
    }, [selectedDate, monthWeeksInfo]);

    // ✅ Multi-day initial scroll centering - moved to top level to follow Rules of Hooks
    useEffect(() => {
        if (daySubMode === 'multi') {
            const TIME_COLUMN_WIDTH = 50;
            const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - TIME_COLUMN_WIDTH) / 2;
            const initialOffset = 10 * DAY_COLUMN_WIDTH; // 10. günü ortala (21 günlük buffer'da orta)

            requestAnimationFrame(() => {
                multiDayHorizontalContentScrollRef.current?.scrollTo({
                    x: initialOffset,
                    y: 0,
                    animated: false
                });
            });
        }
    }, [daySubMode, multiDayStartDate]);


    const handleNextMonth = useCallback(() => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(next);
        // Scroll adjustment is handled by the useEffect after content changes
    }, [currentMonth]);

    const handlePrevMonth = useCallback(() => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prev);
        // Scroll adjustment is handled by the useEffect after content changes
    }, [currentMonth]);

    const handleNextDay = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        setSelectedDate(next);

        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === next.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, monthWeeksInfo]);

    const handlePrevDay = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        setSelectedDate(prev);

        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === prev.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, monthWeeksInfo]);

    const handleNextWeek = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 7);
        const nextEndDate = new Date(next);
        nextEndDate.setDate(next.getDate() + 1);
        setSelectedDate(next);
        setMultiDayEndDate(nextEndDate);

        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === next.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, monthWeeksInfo]);

    const handlePrevWeek = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 7);
        const prevEndDate = new Date(prev);
        prevEndDate.setDate(prev.getDate() + 1);
        setSelectedDate(prev);
        setMultiDayEndDate(prevEndDate);

        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === prev.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, monthWeeksInfo]);

    const handleMonthScroll = (e: any) => { };

    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    // ROBUST INFINITE SCROLL - Shifts the 7-month buffer when user reaches indices 1 or 5
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════
    const handleMonthScrollEnd = (e: any) => {
        if (isCollapsed) return;

        const offset = e.nativeEvent.contentOffset.y;
        const weekIdx = Math.round(offset / WEEK_ROW_HEIGHT);

        // Find which month is currently centered in view
        let count = 0;
        let monthIdx = -1;
        for (let i = 0; i < monthWeeksInfo.length; i++) {
            count += monthWeeksInfo[i].weeks.length;
            if (weekIdx < count) {
                monthIdx = i;
                break;
            }
        }

        // Update header to match current visible month
        if (monthIdx !== -1) {
            const target = monthWeeksInfo[monthIdx];
            if (target && (target.year !== headerMonth.getFullYear() || target.month !== headerMonth.getMonth())) {
                setHeaderMonth(new Date(target.year, target.month, 1));
            }
        }

        // DYNAMIC EXPANSION: Expand buffer when user scrolls near edges
        const EXPANSION_THRESHOLD = 1; // Expand when at first or last 2 months
        const EXPANSION_AMOUNT = 6;    // Add 6 months at a time
        const MAX_RANGE = 36;          // Max 3 years in each direction

        // Near top edge: prepend months + schedule scroll compensation
        if (monthIdx !== -1 && monthIdx <= EXPANSION_THRESHOLD && bufferStart > -MAX_RANGE) {
            const newStart = Math.max(-MAX_RANGE, bufferStart - EXPANSION_AMOUNT);

            // Calculate weeks being added
            let weeksToAdd = 0;
            for (let i = newStart; i < bufferStart; i++) {
                const date = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + i, 1);
                weeksToAdd += getWeeksFromDays(getDaysInMonth(date)).length;
            }

            // Store current offset + compensation to apply after state update
            pendingScrollCompensation.current = offset + (weeksToAdd * WEEK_ROW_HEIGHT);
            setBufferStart(newStart);
        }

        // Near bottom edge: append months (no compensation needed)
        if (monthIdx !== -1 && monthIdx >= monthWeeksInfo.length - EXPANSION_THRESHOLD - 1 && bufferEnd < MAX_RANGE) {
            const newEnd = Math.min(MAX_RANGE, bufferEnd + EXPANSION_AMOUNT);
            setBufferEnd(newEnd);
        }
    };

    const handleWeekScrollEnd = useCallback((e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);
        const totalPanes = 3; // prev, current, next
        const centerPane = 1; // index of current week pane

        // Only jump if we scroll to prev or next pane
        if (page === 0) {
            // Scrolled to prev week pane - update date and reset to center
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 7);
            setSelectedDate(newDate);

            requestAnimationFrame(() => {
                weekScrollViewRef.current?.scrollTo({ x: centerPane * width, animated: false });
            });
        } else if (page === 2) {
            // Scrolled to next week pane - update date and reset to center
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 7);
            setSelectedDate(newDate);

            requestAnimationFrame(() => {
                weekScrollViewRef.current?.scrollTo({ x: centerPane * width, animated: false });
            });
        }
    }, [selectedDate, selectionAnim]);

    const handleTimelineScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);

        // Timeline currently uses 3 panes, let's keep it as 3 for now 
        // because each pane is heavy (full timeline).
        // But we can disable pagingEnabled in JSX.
        if (page === 0) {
            handlePrevDay();
            timelineHorizontalScrollViewRef.current?.scrollTo({ x: width, animated: false });
        } else if (page === 2) {
            handleNextDay();
            timelineHorizontalScrollViewRef.current?.scrollTo({ x: width, animated: false });
        }
    };

    const handleMultiDayScrollEnd = useCallback((e: any) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 50) / 2;

        // Native snap already happens, we just calculate index for JS state
        const nearestIndex = Math.round(offsetX / DAY_COLUMN_WIDTH);

        // Calculate JS-side date for application state
        const newDate = new Date(multiDayStartDate);
        newDate.setDate(newDate.getDate() + (nearestIndex - 10)); // Adjusted to 10 for 21-day buffer

        const newEndDate = new Date(newDate);
        newEndDate.setDate(newDate.getDate() + 1);

        // JS Thread Sync
        setSelectedDate(newDate);
        setMultiDayEndDate(newEndDate);
        setVisibleDayIndex(nearestIndex);

        // Infinite scroll check
        if (nearestIndex < 4) {
            const newStart = new Date(multiDayStartDate);
            newStart.setDate(newStart.getDate() - 10);
            setMultiDayStartDate(newStart);
        } else if (nearestIndex > 17) {
            const newStart = new Date(multiDayStartDate);
            newStart.setDate(newStart.getDate() + 10);
            setMultiDayStartDate(newStart);
        }
    }, [multiDayStartDate, SCREEN_WIDTH]);



    // Pan gesture handler - only for card height (collapse/expand)
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            'worklet';
            const translationY = event.translationY;

            if (isCollapsed) {
                // EXPAND - Rubberband effect
                if (translationY < 0) {
                    const progress = Math.min(1, Math.abs(translationY) / (MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT));
                    // Rubberband: Yavaşlatma efekti sınıra yaklaşırken
                    const rubberband = progress < 0.9 ? progress : 0.9 + (progress - 0.9) * 0.3;
                    const targetHeight = DAY_VIEW_HEIGHT + rubberband * (MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT);

                    calendarHeight.value = targetHeight;
                    selectionAnim.value = interpolate(rubberband, [0, 1], [1, 1], 'clamp');
                }
            } else {
                // COLLAPSE - Rubberband effect
                if (translationY > 0) {
                    const progress = Math.min(1, translationY / (MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT));
                    const rubberband = progress < 0.9 ? progress : 0.9 + (progress - 0.9) * 0.3;
                    const targetHeight = MONTH_VIEW_HEIGHT - rubberband * (MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT);

                    calendarHeight.value = Math.max(DAY_VIEW_HEIGHT, targetHeight);
                    selectionAnim.value = 1;
                }
            }
        })
        .onEnd((event) => {
            'worklet';
            const { translationY, velocityY } = event;

            if (isCollapsed) {
                // Velocity-aware threshold for expanding
                const velocityThreshold = velocityY < -500 ? 80 : 150;

                if (Math.abs(translationY) > velocityThreshold || velocityY < -500) {
                    // EXPAND with spring
                    calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, {
                        damping: 28,
                        stiffness: 180,
                        mass: 1,
                        velocity: velocityY / 1000,
                    }, (finished) => {
                        if (finished) {
                            runOnJS(resetToMonthView)();
                        }
                    });

                    selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION });
                    dateTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION });
                    // ✅ Fixed: Added easing here
                    timelineAnim.value = withTiming(0, {
                        duration: ANIMATION_CONFIG.FADE_DURATION,
                        easing: ANIMATION_CONFIG.EASING
                    });
                    monthTitleAnim.value = 1;
                } else {
                    // SNAP BACK to day view
                    calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, {
                        damping: 28,
                        stiffness: 180,
                    });
                    selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION });
                }
            } else {
                // Month view collapse logic
                const threshold = (MONTH_VIEW_HEIGHT + DAY_VIEW_HEIGHT) / 2;
                const shouldCollapse = calendarHeight.value < threshold || velocityY > 500;

                if (shouldCollapse) {
                    // Collapse animation - önce state değiştir
                    runOnJS(setIsCollapsed)(true);

                    calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, ANIMATION_CONFIG.CORE_SPRING_CONFIG);

                    selectionAnim.value = withDelay(150, withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }));
                    dateTitleAnim.value = withDelay(150, withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }));
                    timelineAnim.value = withDelay(150, withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }));
                    monthTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION });
                } else {
                    // Stay in month view
                    calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, {
                        damping: 28,
                        stiffness: 180,
                    });
                }
            }
        });



    useAnimatedReaction(
        () => calendarHeight.value <= DAY_VIEW_HEIGHT + 10,
        (collapsed) => {
            // Sadece COLLAPSE olurken tetikle
            // EXPAND için handleBackToMonth callback'ini kullanıyoruz (resetToToday)
            // Bu sayede expand animasyonu ortasında re-render olmaz
            if (collapsed && collapsed !== isCollapsed) {
                runOnJS(setIsCollapsed)(true);
                // Day view'a geçerken - beyaza dairesini anında göster (delay kaldırıldı) ve hızlandırıldı
                dateTitleAnim.value = withTiming(1, { duration: 50 });
                // ✅ REINFORCE: Ensure selection is solid on settle
                selectionAnim.value = withTiming(1, { duration: 50 });
            }
            // NOT: Expand (collapsed=false) durumu burada işlenmiyor!
            // handleBackToMonth -> resetToToday callback'i ile handle ediliyor
        },
        // Shared value dependencies removed
        [isCollapsed]
    );



    // Animated styles
    const cardStyle = useAnimatedStyle(() => ({
        height: SCREEN_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Add padding to avoid status bar occlusion since we are absolute top: 0
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    }));

    const monthTitleStyle = useAnimatedStyle(() => {
        'worklet';
        // Bağımsız monthTitleAnim ile kontrol
        // opacity: ghost efekti için
        // height: monthTitleAnim 0 iken 0, 1 iken 50 (day view'da yer kaplamaz)
        return {
            opacity: monthTitleAnim.value,
            height: monthTitleAnim.value * 50,
        };
    }, []);

    const monthTitleTextStyle = useAnimatedStyle(() => {
        'worklet';
        // Sabit font size - calendarHeight'tan bağımsız
        return {
            fontSize: 36,
        };
    }, []);

    const timelineStyle = useAnimatedStyle(() => {
        "worklet";
        const collapsed = calendarHeight.value <= DAY_VIEW_HEIGHT + 10;
        return {
            opacity: timelineAnim.value,
            zIndex: collapsed ? 30 : 0,
            pointerEvents: collapsed ? 'auto' : 'none' as const,
            transform: [{
                translateY: interpolate(
                    timelineAnim.value,
                    [0, 1],
                    [60, 0], // ✅ Daha az translateY = daha smooth
                )
            }],
        };
    });


    const weekContainerStyle = useAnimatedStyle(() => {
        // ✅ FIXED: Use the collapsed threshold consistent with other checks (DAY_VIEW_HEIGHT + 10)
        // Week container should remain fully visible during the entire collapsed state
        const isCollapsedState = calendarHeight.value <= DAY_VIEW_HEIGHT + 10;

        const opacity = isCollapsedState
            ? 1
            : interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT + 10, DAY_VIEW_HEIGHT + 40],
                [1, 0],
                'clamp'
            );

        return {
            opacity,
            zIndex: 5, // MonthGrid slides ON TOP of this
            transform: [
                {
                    translateY: interpolate(
                        calendarHeight.value,
                        [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                        [0, -10]
                    )
                }
            ],
            display: 'flex',
        };
    });


    const monthGridStyle = useAnimatedStyle(() => {
        "worklet";
        const collapsed = calendarHeight.value <= DAY_VIEW_HEIGHT + 10;

        // ✅ FIXED: Hide month grid completely when collapsed to prevent ghost day numbers
        const opacity = collapsed
            ? 0
            : interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT + 10, DAY_VIEW_HEIGHT + 50],
                [0, 1],
                'clamp'
            );

        return {
            opacity,
            height: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT]
            ),
            // ✅ Settle Sync: Restore buffer (+5px) to prevent spring oscillation flicker
            zIndex: calendarHeight.value <= DAY_VIEW_HEIGHT + 5 ? 0 : 100,
            pointerEvents: collapsed ? 'none' : 'auto' as const,
        };
    });


    const dateTitleStyle = useAnimatedStyle(() => {
        // Parent (timelineStyle) translateY hareketini kompanse et
        const parentTranslateY = interpolate(timelineAnim.value, [0, 1], [100, 0]);

        return {
            opacity: dateTitleAnim.value,
            transform: [
                // Parent'ın translateY'sini kompanse et (yerinde tut)
                { translateY: -parentTranslateY },
                // FadeInRight: Sağdan sola kayarak belirme
                { translateX: interpolate(dateTitleAnim.value, [0, 1], [40, 0]) }
            ],
        };
    });


    const selectionCircleStyle = useAnimatedStyle(() => ({
        opacity: selectionAnim.value,
        transform: [
            // ✅ YENİ - Smooth scale with slight overshoot
            {
                scale: withSpring(
                    interpolate(selectionAnim.value, [0, 1], [0.7, 1]),
                    {
                        damping: 15,      // Hafif bounce
                        stiffness: 200,
                        mass: 0.8,
                    }
                )
            }
        ],
    }));




    useEffect(() => {
        // Initialize scrollY to the offset of the current month
        // This ensures animation works even if user hasn't scrolled yet
        scrollY.value = centerOffsetWeeks * WEEK_ROW_HEIGHT;
    }, [centerOffsetWeeks, scrollY]);

    const isToday = useCallback((date: Date | null) => {
        if (!date) return false;
        const now = new Date();
        return date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
    }, []);

    const isSelected = useCallback((date: Date | null, selected: Date | null) => {
        if (!date || !selected) return false;
        return date.toDateString() === selected.toDateString();
    }, []);

    // ✅ STABLE REFERENCE MAPS: Avoids re-creating arrays on each render
    const eventsByDateKey = useMemo(() => {
        const map: Record<string, any[]> = {};
        events.forEach(e => {
            const dateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(e);
        });
        return map;
    }, [events]);

    const scheduleByDateKey = useMemo(() => schedule, [schedule]);

    const getEventsForDate = useCallback((date: Date | null) => {
        if (!date) return [];
        const dateKey = formatDateKey(date);
        return eventsByDateKey[dateKey] || [];
    }, [eventsByDateKey]);

    const getWorkoutForDate = useCallback((date: Date | null) => {
        if (!date) return null;
        const dateKey = formatDateKey(date);
        return scheduleByDateKey[dateKey] || null;
    }, [scheduleByDateKey]);

    // Load workout cards when selected event changes
    useEffect(() => {
        const loadWorkouts = async () => {
            if (!selectedEventForDetail || !selectedEventForDetail.workoutDay) {
                setWorkoutCards([]);
                return;
            }

            const dayType = selectedEventForDetail.workoutDay;
            const savedIds = await loadWorkoutDayCards(dayType);

            if (savedIds.length > 0) {
                const cards = savedIds
                    .map(id => allWorkouts.find(w => w.workoutId === id))
                    .filter((w): w is Workout => w !== undefined);
                setWorkoutCards(cards);
            } else {
                // Default Fallback
                const muscleGroups = WORKOUT_DAY_MUSCLE_GROUPS[dayType];
                if (muscleGroups) {
                    const defaultCards = allWorkouts.filter(w => muscleGroups.includes(w.muscleGroup)).slice(0, 4);
                    setWorkoutCards(defaultCards);
                } else {
                    setWorkoutCards(allWorkouts.slice(0, 4));
                }
            }
        };

        loadWorkouts();
    }, [selectedEventForDetail?.workoutDay]);

    const [workoutCards, setWorkoutCards] = useState<Workout[]>([]);

    // Event Detail Modal States for Liquid Glass Menus
    const [showAlertMenu, setShowAlertMenu] = useState(false);
    const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
    const [alertMenuPosition, setAlertMenuPosition] = useState({ top: 0, right: 20 });
    const alertButtonRef = useRef<View>(null);
    const alertMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    const [showCalendarMenu, setShowCalendarMenu] = useState(false);
    const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
    const [calendarMenuPosition, setCalendarMenuPosition] = useState({ top: 0, right: 20 });
    const calendarButtonRef = useRef<View>(null);
    const calendarMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Calendar Data States
    const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>([]);
    const [calendarPermission, setCalendarPermission] = useState<boolean>(false);
    const [loadingCalendars, setLoadingCalendars] = useState<boolean>(false);

    const [showSecondAlertMenu, setShowSecondAlertMenu] = useState(false);
    const [isSecondAlertModalVisible, setIsSecondAlertModalVisible] = useState(false);
    const [secondAlertMenuPosition, setSecondAlertMenuPosition] = useState({ top: 0, right: 20 });
    const secondAlertButtonRef = useRef<View>(null);
    const secondAlertMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Delete Menu Animation States (matching WorkoutEventDetailScreen)
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteMenuPosition, setDeleteMenuPosition] = useState({ top: 0, right: 20 });
    const deleteButtonRef = useRef<View>(null);
    const deleteMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Calendar Menu Animation Effect
    useEffect(() => {
        if (showCalendarMenu) {
            setIsCalendarModalVisible(true);
            RNAnimated.spring(calendarMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start();
        } else {
            RNAnimated.spring(calendarMenuAnimation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
                setIsCalendarModalVisible(false);
            });
        }
    }, [showCalendarMenu]);

    // Alert Menu Animation Effect
    useEffect(() => {
        if (showAlertMenu) {
            setIsAlertModalVisible(true);
            RNAnimated.spring(alertMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start();
        } else {
            RNAnimated.spring(alertMenuAnimation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
                setIsAlertModalVisible(false);
            });
        }
    }, [showAlertMenu]);

    // Second Alert Menu Animation Effect
    useEffect(() => {
        if (showSecondAlertMenu) {
            setIsSecondAlertModalVisible(true);
            RNAnimated.spring(secondAlertMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start();
        } else {
            RNAnimated.spring(secondAlertMenuAnimation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
                setIsSecondAlertModalVisible(false);
            });
        }
    }, [showSecondAlertMenu]);

    // Delete Menu Animation Effect (matching WorkoutEventDetailScreen)
    useEffect(() => {
        if (showDeleteModal) {
            setIsDeleteModalVisible(true);
            RNAnimated.spring(deleteMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start();
        } else {
            RNAnimated.spring(deleteMenuAnimation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
                setIsDeleteModalVisible(false);
            });
        }
    }, [showDeleteModal]);

    // Calendar Logic
    const checkCalendarPermission = async () => {
        try {
            const status = await RNCalendarEvents.checkPermissions();
            if (status === 'authorized') {
                setCalendarPermission(true);
            }
        } catch (error) {
            console.error('Error checking calendar permission:', error);
        }
    };

    const requestCalendarPermission = async () => {
        try {
            const status = await RNCalendarEvents.requestPermissions();
            if (status === 'authorized') {
                setCalendarPermission(true);
                loadDeviceCalendars();
            }
        } catch (error) {
            console.error('Error requesting calendar permission:', error);
        }
    };

    const loadDeviceCalendars = async () => {
        setLoadingCalendars(true);
        try {
            const calendars = await RNCalendarEvents.findCalendars();
            const writableCalendars = calendars
                .filter(cal => cal.allowsModifications)
                .map(cal => ({
                    id: cal.id,
                    title: cal.title,
                    color: cal.color || '#007AFF',
                    source: cal.source || 'Local',
                }));
            setDeviceCalendars(writableCalendars);
        } catch (error) {
            console.error('Error loading calendars:', error);
        } finally {
            setLoadingCalendars(false);
        }
    };

    const handleCalendarSelect = (calendarId: string) => {
        if (selectedEventForDetail) {
            const updatedEvent = { ...selectedEventForDetail, calendar: calendarId };
            setSelectedEventForDetail(updatedEvent);
            saveEventUpdate(updatedEvent);
        }
        setShowCalendarMenu(false);
    };

    const handleWorkoutPress = (workout: Workout) => {
        // Use logic from WorkoutEventDetailScreen
        if (nav) {
            // Do NOT close modal first, navigate directly
            nav.navigate('GenericWorkoutSettingsScreen', {
                workoutId: workout.workoutId,
                workoutName: workout.name,
            });
        }
    };



    useEffect(() => {
        checkCalendarPermission();
    }, []);



    // Menu Handlers
    const handleOpenCalendarMenu = () => {
        if (!calendarPermission) {
            requestCalendarPermission();
            // Don't open menu yet, wait for permission
            return;
        }

        loadDeviceCalendars();

        calendarButtonRef.current?.measureInWindow((x, y, width, height) => {
            // Safe adjustment: place menu below the button
            setCalendarMenuPosition({ top: y + height + 8, right: 20 });
            setShowCalendarMenu(true);
        });
    };

    const handleOpenAlertMenu = () => {
        alertButtonRef.current?.measureInWindow((x, y, width, height) => {
            // Safe adjustment: place menu below the button
            setAlertMenuPosition({ top: y + height + 8, right: 20 });
            setShowAlertMenu(true);
        });
    };

    const handleOpenSecondAlertMenu = () => {
        secondAlertButtonRef.current?.measureInWindow((x, y, width, height) => {
            // Safe adjustment: place menu below the button
            setSecondAlertMenuPosition({ top: y + height + 8, right: 20 });
            setShowSecondAlertMenu(true);
        });
    };

    const handleOpenViewMenu = () => {
        if (viewButtonRef.current) {
            viewButtonRef.current.measureInWindow((x, y, width, height) => {
                // Hardcoded right: 20 like the reference for maximum stability
                // x, y are window coordinates. In React Native Modals (without statusBarTranslucent), 
                // measurement usually aligns well with window coords.
                setViewMenuPosition({ top: y + height + 8, right: 20 });
                setShowViewMenu(true);
            });
        }
    };

    const handleSwitchViewMode = (mode: DaySubMode) => {
        setDaySubMode(mode);
        setShowViewMenu(false);
        if (!isCollapsed) {
            handleDayPress(selectedDate);
        }
    };

    const handleSwitchMonthViewMode = (mode: MonthViewMode) => {
        setMonthViewMode(mode);
        setShowViewMenu(false);
    };

    // Keep timeline horizontal offset in sync with mode
    useEffect(() => {
        const width = SCREEN_WIDTH;
        timelineHorizontalScrollViewRef.current?.scrollTo({ x: width, animated: false });
    }, [daySubMode]);

    useEffect(() => {
        if (showViewMenu) {
            setIsViewModalVisible(true);
            RNAnimated.spring(viewMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
            });
        } else {
            RNAnimated.spring(viewMenuAnimation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(() => {
                setIsViewModalVisible(false);
            });
        }
    }, [showViewMenu]);

    const viewMenuScale = viewMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
    const viewMenuTranslateX = viewMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [110, 0] });
    const viewMenuTranslateY = viewMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
    const viewMenuOpacity = viewMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });







    // Interpolations for Menus
    const calendarMenuScale = calendarMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
    const calendarMenuTranslateX = calendarMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [110, 0] });
    const calendarMenuTranslateY = calendarMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
    const calendarMenuOpacity = calendarMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const alertMenuScale = alertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
    const alertMenuTranslateX = alertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [110, 0] });
    const alertMenuTranslateY = alertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
    const alertMenuOpacity = alertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const secondAlertMenuScale = secondAlertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
    const secondAlertMenuTranslateX = secondAlertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [110, 0] });
    const secondAlertMenuTranslateY = secondAlertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
    const secondAlertMenuOpacity = secondAlertMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    // Delete Menu Interpolations
    const deleteMenuScale = deleteMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
    const deleteMenuTranslateX = deleteMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [110, 0] });
    const deleteMenuTranslateY = deleteMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });
    const deleteMenuOpacity = deleteMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper to scroll timeline to specific time with animation
    // ─────────────────────────────────────────────────────────────────────────────
    const scrollTimelineToPosition = useCallback((timestamp: number) => {
        const SLOT_HEIGHT = 40; // timeSlot height
        const date = new Date(timestamp);

        // Hedef scroll pozisyonunu hesapla
        let targetScrollY: number;
        if (isToday(date)) {
            // Today: Kırmızı çizgiyi göster (mevcut saat - 2 saat yukarıdan)
            const currentHour = new Date().getHours();
            targetScrollY = Math.max(0, (currentHour - 2) * SLOT_HEIGHT);
        } else {
            // Diğer günler: 05:00
            targetScrollY = 5 * SLOT_HEIGHT;
        }

        // Hemen scroll et (animasyon bitmeden)
        if (timelineVerticalScrollRef.current) {
            timelineVerticalScrollRef.current.scrollTo({ y: targetScrollY, animated: false });
        }

        // Backup: Animasyon sonrası tekrar kontrol et
        setTimeout(() => {
            if (timelineVerticalScrollRef.current) {
                timelineVerticalScrollRef.current.scrollTo({ y: targetScrollY, animated: false });
            }
        }, 100);
    }, []);


    const handleDayPress = useCallback((date: Date) => {
        // ═══════════════════════════════════════════════════════
        // LIST MODE: Just select the date, don't collapse to timeline
        // ═══════════════════════════════════════════════════════
        if (monthViewMode === 'list') {
            setSelectedDate(date);
            onDayPress?.(date);
            return;
        }

        // ═══════════════════════════════════════════════════════
        // STEP 1: UI THREAD UPDATES - ZERO LATENCY
        // ═══════════════════════════════════════════════════════
        const dateMidnight = new Date(date);
        dateMidnight.setHours(0, 0, 0, 0);
        const dateTimestamp = dateMidnight.getTime();

        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === date.toDateString())
        );

        if (weekIdx !== -1) {
            // Set the target timestamp immediately for reactive selection (UI Thread)
            selectedDateTimestamp.value = dateTimestamp;
            selectedWeekIdx.value = weekIdx;

            const dForWeek = new Date(date);
            const dayOfWeek = dForWeek.getDay();
            const diff = dForWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            dForWeek.setDate(diff);
            dForWeek.setHours(0, 0, 0, 0);
            selectedWeekTimestamp.value = dForWeek.getTime();

            if (isCollapsed) {
                // Day view logic (collapsed) - Immediate circle update
                cancelAnimation(selectionAnim);
                selectionAnim.value = 1;
                // Defer JS thread state change to keep UI thread smooth
                setTimeout(() => {
                    setSelectedDate(date);
                    onDayPress?.(date);
                    scrollTimelineToPosition(dateTimestamp);
                }, 5);
                return;
            }

            // Month view logic remains mostly same but optimized
            cancelAnimation(selectionAnim);
            cancelAnimation(dateTitleAnim);
            cancelAnimation(calendarHeight);
            cancelAnimation(timelineAnim);
            cancelAnimation(monthTitleAnim);

            const sameDay = selectedDate && date.toDateString() === selectedDate.toDateString();

            if (!sameDay) {
                selectionAnim.value = 0;
                dateTitleAnim.value = 0;
                timelineAnim.value = 0;
            }

            const animConfig = {
                duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                easing: ANIMATION_CONFIG.EASING,
            };

            const timelineConfig = {
                duration: ANIMATION_CONFIG.TIMELINE_DURATION,
                easing: ANIMATION_CONFIG.EASING,
            };

            // Scroll prepare
            scrollTimelineToPosition(dateTimestamp);

            // Start animations simultaneously
            selectionAnim.value = withTiming(1, animConfig);
            dateTitleAnim.value = withTiming(1, animConfig);
            // Delay timeslot entrance to separate it from row collapse
            timelineAnim.value = withDelay(200, withTiming(1, timelineConfig));
            monthTitleAnim.value = withTiming(0, animConfig);

            calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, ANIMATION_CONFIG.CORE_SPRING_CONFIG, (finished) => {
                "worklet";
                if (finished) {
                    runOnJS(setIsCollapsed)(true);
                }
            });

            // ═══════════════════════════════════════════════════════
            // DEFERRED JS UPDATES
            // ═══════════════════════════════════════════════════════
            setTimeout(() => {
                setSelectedDate(date);
                onDayPress?.(date);
            }, 5);

        } else {
            setSelectedDate(date);
            onDayPress?.(date);
        }
    }, [monthWeeksInfo, isCollapsed, onDayPress, monthViewMode]);


    const handleTodayPress = () => {
        const today = new Date();

        // Calculate week index
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === today.toDateString())
        );

        setSelectedDate(today);
        setCurrentMonth(today);
        setHeaderMonth(today);

        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        // Önceki animasyonları iptal et
        cancelAnimation(selectionAnim);
        cancelAnimation(dateTitleAnim);
        cancelAnimation(calendarHeight);
        cancelAnimation(timelineAnim);
        cancelAnimation(monthTitleAnim);

        // Değerleri anında sıfırla
        dateTitleAnim.value = 0;
        selectionAnim.value = 0;
        timelineAnim.value = 0;

        // Ana animasyon config
        const animConfig = {
            duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
            easing: ANIMATION_CONFIG.EASING,
        };

        // Timeline için daha hızlı config
        const timelineConfig = {
            duration: ANIMATION_CONFIG.TIMELINE_DURATION,
            easing: ANIMATION_CONFIG.EASING,
        };

        // Scroll'u animasyon başlamadan önce ayarla (today için)
        scrollTimelineToPosition(today.getTime());

        selectionAnim.value = withTiming(1, animConfig);
        dateTitleAnim.value = withTiming(1, animConfig);
        timelineAnim.value = withTiming(1, timelineConfig); // Daha hızlı
        // Month title: Ghost fade out
        monthTitleAnim.value = withTiming(0, animConfig);

        calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, animConfig, (finished) => {
            "worklet";
            if (finished) {
                runOnJS(setIsCollapsed)(true);
            }
        });
    };


    const resetToMonthView = () => {
        // Sadece state'i güncelle
        // Shared value'lar zaten animasyonla doğru değerlere geldi, dokunma!
        setIsCollapsed(false);
    };

    const handleBackToMonth = () => {
        // ═══════════════════════════════════════════════════════
        // iOS Calendar Style: Back to Month Animation
        // ═══════════════════════════════════════════════════════

        // Önceki animasyonları iptal et
        cancelAnimation(selectionAnim);
        cancelAnimation(dateTitleAnim);
        cancelAnimation(calendarHeight);
        cancelAnimation(timelineAnim);
        cancelAnimation(monthTitleAnim);

        // Month title: Anında belirme (zaten oradaymışçasına)
        monthTitleAnim.value = 1;

        // Tüm animasyonlar aynı easing ve süre ile senkronize
        const animConfig = {
            duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
            easing: ANIMATION_CONFIG.EASING,
        };

        // Date title'ı ve timeline'ı fade out, beyaz daire KALSIN
        dateTitleAnim.value = withTiming(0, animConfig);
        selectionAnim.value = withTiming(1, animConfig);
        timelineAnim.value = withTiming(0, animConfig);

        // Ana animasyon: Day view -> Month view
        calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, ANIMATION_CONFIG.CORE_SPRING_CONFIG, (finished) => {
            "worklet";
            if (finished) {
                runOnJS(resetToMonthView)();
            }
        });
    };

    // ═══════════════════════════════════════════════════════════════
    // EVENT DETAIL & CREATE EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleEventPress = async (event: Event) => {
        if (onEventPress) {
            onEventPress(event);
            return;
        }

        setSelectedEventForDetail(event);

        // Load workouts for this event
        if (event.workoutIds && event.workoutIds.length > 0) {
            const eventWorkouts = allWorkouts.filter((w: Workout) =>
                event.workoutIds!.includes(w.workoutId)
            );
            setEventDetailWorkouts(eventWorkouts);
        } else if (event.workoutDay) {
            // Load from workout day cards
            const dayCards = await loadWorkoutDayCards(event.workoutDay);
            const dayWorkouts = allWorkouts.filter((w: Workout) =>
                dayCards.includes(w.workoutId)
            ).slice(0, 4);
            setEventDetailWorkouts(dayWorkouts.length > 0 ? dayWorkouts : allWorkouts.slice(0, 4));
        } else {
            setEventDetailWorkouts(allWorkouts.slice(0, 4));
        }

        // Show and animate from right
        setShowEventDetail(true);
        RNAnimated.spring(eventDetailSlideAnim, {
            toValue: 0,
            friction: 25,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseEventDetail = useCallback(() => {
        // Animate out to right
        RNAnimated.timing(eventDetailSlideAnim, {
            toValue: SCREEN_WIDTH,
            duration: 300,
            easing: RNEasing.ease,
            useNativeDriver: true,
        }).start(() => {
            setShowEventDetail(false);
            setSelectedEventForDetail(null);
            setEventDetailWorkouts([]);
        });
    }, [eventDetailSlideAnim]);

    // Update ref when handler changes
    useEffect(() => {
        closeEventDetailRef.current = handleCloseEventDetail;
    }, [handleCloseEventDetail]);

    // ═══════════════════════════════════════════════════════════════
    // WORKOUT DAY PICKER HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleWorkoutDayPress = useCallback(async (date: Date, currentWorkoutDay: WorkoutDayType | null) => {
        if (!currentWorkoutDay) return;

        // Close calendar and navigate to WorkoutEventDetail
        if (onFullScreenPress) {
            onFullScreenPress();
        }

        // Navigate to WorkoutEventDetail screen
        if (nav) {
            nav.navigate('WorkoutEventDetail', {
                eventId: `manual_${currentWorkoutDay}_${date.toISOString().split('T')[0]}`,
                date: date.toISOString()
            });
        }
    }, [nav]);

    const handleCloseWorkoutDayPicker = useCallback(() => {
        RNAnimated.timing(workoutDayPickerSlideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            easing: RNEasing.ease,
            useNativeDriver: true,
        }).start(() => {
            setShowWorkoutDayPicker(false);
        });
    }, [workoutDayPickerSlideAnim]);

    const handleSaveWorkoutDay = async () => {
        try {
            await setWorkoutDayForDate(workoutDayPickerDate, selectedWorkoutDayForPicker);

            // Schedule'ı güncelle
            const dateKey = formatDateKey(workoutDayPickerDate);
            const updatedSchedule = { ...schedule, [dateKey]: selectedWorkoutDayForPicker };

            // Notify parent (SummaryScreen) to refresh
            if (onEventsChange) {
                // Trigger a refresh by re-fetching events
                const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
                const storedEvents = stored ? JSON.parse(stored) : [];
                onEventsChange(storedEvents);
            }

            handleCloseWorkoutDayPicker();
        } catch (error) {
            console.error('Error saving workout day:', error);
            Alert.alert('Error', 'Failed to save workout day');
        }
    };

    const handleEditEvent = () => {
        if (selectedEventForDetail) {
            // Close event detail
            setShowEventDetail(false);

            // Navigate to WorkoutEventDetail for editing
            nav.navigate('WorkoutEventDetail', {
                date: selectedEventForDetail.date,
                eventId: selectedEventForDetail.id
            });
        }
    };

    const handleDeleteEvent = () => {
        if (!selectedEventForDetail) return;
        deleteButtonRef.current?.measureInWindow((x, y, width, height) => {
            setDeleteMenuPosition({ top: y - 75, right: 20 });
            setShowDeleteModal(true);
        });
    };

    const handleDeleteThisEventOnly = async () => {
        if (!selectedEventForDetail) return;

        try {
            const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            if (stored) {
                let storedEvents: Event[] = JSON.parse(stored);
                storedEvents = storedEvents.filter(e => e.id !== selectedEventForDetail.id);
                await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
                onEventsChange && onEventsChange(storedEvents);
            }
            setShowDeleteModal(false);
            handleCloseEventDetail();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleDeleteAllFutureEvents = async () => {
        if (!selectedEventForDetail) return;

        try {
            const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            if (stored) {
                let storedEvents: Event[] = JSON.parse(stored);
                const currentDate = new Date(selectedEventForDetail.date);

                // Delete this event and all future events with the same workout day
                storedEvents = storedEvents.filter(e => {
                    if (e.id === selectedEventForDetail.id) return false;
                    if (e.workoutDay === selectedEventForDetail.workoutDay) {
                        const eventDate = new Date(e.date);
                        if (eventDate >= currentDate) return false;
                    }
                    return true;
                });

                await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
                onEventsChange && onEventsChange(storedEvents);
            }
            setShowDeleteModal(false);
            handleCloseEventDetail();
        } catch (error) {
            console.error('Error deleting events:', error);
        }
    };

    const handleAlertChange = (minutes: number) => {
        if (selectedEventForDetail) {
            const updatedEvent = { ...selectedEventForDetail, alertMinutes: minutes };
            setSelectedEventForDetail(updatedEvent);
            saveEventUpdate(updatedEvent);
        }
        setShowAlertPicker(false);
    };

    const handleSecondAlertChange = (minutes: number) => {
        if (selectedEventForDetail) {
            const updatedEvent = { ...selectedEventForDetail, secondAlertMinutes: minutes };
            setSelectedEventForDetail(updatedEvent);
            saveEventUpdate(updatedEvent);
        }
        setShowSecondAlertPicker(false);
    };

    const saveEventUpdate = async (updatedEvent: Event) => {
        try {
            const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            let storedEvents: Event[] = stored ? JSON.parse(stored) : [];

            const existingIndex = storedEvents.findIndex(e => e.id === updatedEvent.id);
            if (existingIndex >= 0) {
                storedEvents[existingIndex] = { ...storedEvents[existingIndex], ...updatedEvent };
            } else {
                storedEvents.push(updatedEvent);
            }

            await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
            onEventsChange && onEventsChange(storedEvents);
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const getAlertLabel = (minutes: number | undefined): string => {
        if (minutes === undefined) return 'None';
        const option = ALERT_OPTIONS.find(o => o.value === minutes);
        return option?.label || 'None';
    };

    // Create Event helper functions
    const formatTimeFromDate = (date: Date): string => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const formatDateShort = (date: Date): string => {
        return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Toggle picker animations for Create Event
    const toggleDateTimePicker = (field: 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'repeat' | null) => {
        // Close workout picker if open
        if (activePickerField === 'workout') {
            RNAnimated.timing(workoutPickerHeight, {
                toValue: 0,
                duration: 200,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        }

        if (activePickerField === field) {
            // Close picker
            setActivePickerField(null);
            RNAnimated.timing(dateTimePickerHeight, {
                toValue: 0,
                duration: 300,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        } else {
            // Open picker
            setActivePickerField(field);
            const height = field === 'startDate' || field === 'endDate' ? 320 : field === 'repeat' ? 220 : 220;
            RNAnimated.timing(dateTimePickerHeight, {
                toValue: height,
                duration: 300,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        }
    };

    const toggleWorkoutPicker = () => {
        const isOpen = activePickerField === 'workout';

        // Close datetime picker if open
        if (activePickerField && activePickerField !== 'workout') {
            RNAnimated.timing(dateTimePickerHeight, {
                toValue: 0,
                duration: 200,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        }

        if (isOpen) {
            setActivePickerField(null);
            RNAnimated.timing(workoutPickerHeight, {
                toValue: 0,
                duration: 300,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        } else {
            setActivePickerField('workout');
            RNAnimated.timing(workoutPickerHeight, {
                toValue: 220,
                duration: 300,
                easing: RNEasing.ease,
                useNativeDriver: false,
            }).start();
        }
    };

    // Calendar picker helpers for Create Event
    const getCreateEventDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const days: (Date | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const isDateSelected = (date: Date, targetDate: Date): boolean => {
        return date.getDate() === targetDate.getDate() &&
            date.getMonth() === targetDate.getMonth() &&
            date.getFullYear() === targetDate.getFullYear();
    };

    const isTodayCheck = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const handleCreateDateSelect = (day: Date, isStart: boolean) => {
        if (isStart) {
            const newDate = new Date(createEventDate);
            newDate.setFullYear(day.getFullYear());
            newDate.setMonth(day.getMonth());
            newDate.setDate(day.getDate());
            setCreateEventDate(newDate);
        } else {
            const newDate = new Date(createEventEndDate);
            newDate.setFullYear(day.getFullYear());
            newDate.setMonth(day.getMonth());
            newDate.setDate(day.getDate());
            setCreateEventEndDate(newDate);
        }
    };

    // Time picker values
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'], []);

    const createEventCalendarDays = useMemo(() => getCreateEventDaysInMonth(createPickerMonth), [createPickerMonth]);

    const handleNavigateToDailyDetail = useCallback((date: Date) => {
        // Tarihe ait eventi bul
        const dayEvents = getEventsForDate(date);

        if (dayEvents.length > 0) {
            // Event varsa onEventPress ile detaylara git
            if (onEventPress) {
                onEventPress(dayEvents[0]);
            } else if (nav) {
                // Fallback: WorkoutEventDetail'e git
                nav.navigate('WorkoutEventDetail', {
                    eventId: dayEvents[0].id,
                    date: dayEvents[0].date
                });
            }
        } else {
            // Event yoksa onCreateEvent veya CreateWorkoutEventScreen'e git
            if (onCreateEvent) {
                onCreateEvent(date);
            } else if (nav) {
                nav.navigate('CreateWorkoutEventScreen', {
                    date: date.toISOString(),
                });
            }
        }
    }, [events, nav, onEventPress, onCreateEvent, getEventsForDate]);

    const handleOpenCreateEvent = (date: Date) => {
        if (onCreateEvent) {
            onCreateEvent(date);
            return;
        }

        if (nav) {
            nav.navigate('CreateWorkoutEventScreen', {
                date: date.toISOString(),
            });
            return;
        }

        setEditingEventId(null);
        setCreateEventDate(date);
        const endDate = new Date(date);
        endDate.setHours(endDate.getHours() + 1);
        setCreateEventEndDate(endDate);
        setCreateEventTitle('');
        setCreateEventStartTime('09:00');
        setCreateEventEndTime('10:00');
        setSelectedWorkoutDay('LEG DAY');
        setCreateEventRepeat('never');
        setCreateEventType('event');
        setActivePickerField(null);
        setCreatePickerMonth(date);

        // Reset picker heights
        dateTimePickerHeight.setValue(0);
        workoutPickerHeight.setValue(0);

        // Show modal and animate from bottom
        setShowCreateEvent(true);
        RNAnimated.spring(createEventSlideAnim, {
            toValue: 0,
            friction: 25,
            tension: 100,
            useNativeDriver: true,
        }).start();

        // Focus title input immediately
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 50);
    };

    const handleCloseCreateEvent = useCallback(() => {
        // Animate out to bottom
        RNAnimated.timing(createEventSlideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            easing: RNEasing.ease,
            useNativeDriver: true,
        }).start(() => {
            setShowCreateEvent(false);
            setEditingEventId(null);
            setCreateEventTitle('');
            setActivePickerField(null);
        });
    }, [createEventSlideAnim]);

    // Update ref when handler changes
    useEffect(() => {
        closeCreateEventRef.current = handleCloseCreateEvent;
    }, [handleCloseCreateEvent]);

    // Generate repeated events
    const generateRepeatedEvents = (baseEvent: Event, repeatType: string): Event[] => {
        const events: Event[] = [baseEvent];
        if (repeatType === 'never') return events;

        const baseDate = new Date(baseEvent.date);
        const endRepeatDate = new Date(baseDate);
        endRepeatDate.setFullYear(endRepeatDate.getFullYear() + 1);

        let currentDate = new Date(baseDate);
        let counter = 1;

        while (currentDate < endRepeatDate && counter < 365) {
            switch (repeatType) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'biweekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
                default:
                    return events;
            }

            if (currentDate >= endRepeatDate) break;

            const repeatedEvent: Event = {
                ...baseEvent,
                id: `event_${Date.now()}_${counter}`,
                date: formatDateKey(currentDate),
                repeat: repeatType,
            };
            events.push(repeatedEvent);
            counter++;
        }

        return events;
    };

    const handleSaveEvent = async () => {
        const title = createEventTitle.trim() || selectedWorkoutDay.toLowerCase().replace(' day', '') + ' day';

        try {
            const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            let storedEvents: Event[] = stored ? JSON.parse(stored) : [];

            const newEvent: Event = {
                id: editingEventId || `event-${Date.now()}`,
                title: title,
                workoutDay: selectedWorkoutDay,
                date: formatDateKey(createEventDate),
                startTime: createEventStartTime,
                endTime: createEventEndTime,
                alertMinutes: 30,
                repeat: createEventRepeat,
            };

            if (editingEventId) {
                // Update existing event
                const existingIndex = storedEvents.findIndex(e => e.id === editingEventId);
                if (existingIndex >= 0) {
                    const oldEvent = storedEvents[existingIndex];
                    storedEvents[existingIndex] = { ...storedEvents[existingIndex], ...newEvent };

                    // If repeat setting changed from never to something else, or changed entirely,
                    // generate future events.
                    if (oldEvent.repeat !== createEventRepeat && createEventRepeat !== 'never') {
                        const newFutures = generateRepeatedEvents(newEvent, createEventRepeat);
                        // Skip the first one as it's the one we just updated
                        storedEvents = [...storedEvents, ...newFutures.slice(1)];
                    }
                }
            } else {
                // Generate repeated events for new event
                const allEvents = generateRepeatedEvents(newEvent, createEventRepeat);
                storedEvents = [...storedEvents, ...allEvents];
            }

            await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
            onEventsChange && onEventsChange(storedEvents);
            handleCloseCreateEvent();

            // Navigate to WorkoutEventDetail after save
            nav.navigate('WorkoutEventDetail', {
                date: newEvent.date.split('T')[0],
                eventId: newEvent.id
            });
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDeleteCreateEvent = async () => {
        if (!editingEventId) return;

        try {
            const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            let storedEvents: Event[] = stored ? JSON.parse(stored) : [];
            storedEvents = storedEvents.filter(e => e.id !== editingEventId);
            await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
            onEventsChange && onEventsChange(storedEvents);
            handleCloseCreateEvent();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const formatEventDetailDate = (dateStr: string): string => {
        const d = new Date(dateStr);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        const weekday = d.toLocaleString('en-US', { weekday: 'long' });
        return `${day} ${month} ${year} ${weekday}`;
    };

    const formatHeaderDate = (dateStr: string): string => {
        const d = new Date(dateStr);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        return `${month} ${day}`;
    };

    const handleYearPress = () => {
        setShowYearModal(true);
    };

    const handleYearModalSelect = (year: number, monthIndex: number) => {
        const newDate = new Date(year, monthIndex, 1);
        setCurrentMonth(newDate);
        setShowYearModal(false);

        // Ensure we are in month mode (expanded)
        if (isCollapsed) {
            // Reset scroll position to center of updated month data
            const newPrevWeeksCount = getWeeksFromDays(getDaysInMonth(new Date(year, monthIndex - 2, 1))).length +
                getWeeksFromDays(getDaysInMonth(new Date(year, monthIndex - 1, 1))).length;
            monthScrollViewRef.current?.scrollTo({ y: newPrevWeeksCount * WEEK_ROW_HEIGHT, animated: false });
            calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, { duration: ANIMATION_CONFIG.COLLAPSE_DURATION });
            dateTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Month view'da 0
            selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Görünür kalsın
            timelineAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Timeline sıfırla
            setIsCollapsed(false);
        }

    };

    const timeSlots = useMemo(() => {
        const slots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        return [...slots, '00:00'];
    }, []);

    const renderListPane = (date: Date) => {
        const dayEvents = getEventsForDate(date);
        const workout = getWorkoutForDate(date);

        return (
            <View style={styles.timelinePane}>
                <View style={styles.dayHeader}>
                    <Text style={[styles.dayHeaderText, isToday(date) ? { color: '#FF3B30' } : { color: '#FFFFFF' }]}>
                        {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
                    </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    {dayEvents.length === 0 && !workout ? (
                        <View style={styles.emptyListContainer}>
                            <Feather name="calendar" size={48} color="#333" />
                            <Text style={styles.emptyListText}>No workouts or events scheduled</Text>
                        </View>
                    ) : (
                        <>
                            {workout && (
                                <TouchableOpacity
                                    style={[styles.listItem, { borderLeftColor: WORKOUT_DAY_COLORS[workout] }]}
                                    onPress={() => handleWorkoutDayPress(date, workout)}
                                >
                                    <View style={styles.listItemHeader}>
                                        <Text style={[styles.listItemTitle, { color: WORKOUT_DAY_COLORS[workout] }]}>{workout}</Text>
                                        <View style={[styles.listItemTag, { backgroundColor: WORKOUT_DAY_COLORS[workout] + '20' }]}>
                                            <Text style={[styles.listItemTagText, { color: WORKOUT_DAY_COLORS[workout] }]}>WORKOUT</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.listItemTime}>All Day</Text>
                                </TouchableOpacity>
                            )}
                            {dayEvents.map(event => (
                                <TouchableOpacity
                                    key={event.id}
                                    style={[styles.listItem, { borderLeftColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#888' }]}
                                    onPress={() => handleEventPress(event)}
                                >
                                    <View style={styles.listItemHeader}>
                                        <Text style={styles.listItemTitle}>{event.title}</Text>
                                        <View style={[styles.listItemTag, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Text style={styles.listItemTagText}>EVENT</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.listItemTime}>{event.startTime} - {event.endTime}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderTimelinePane = (date: Date, isCenter = false) => {
        if (daySubMode === 'list') return renderListPane(date);

        const dayEvents = getEventsForDate(date);
        const workout = getWorkoutForDate(date);

        // MULTI-DAY MODE - SNAP TO PAGE + INFINITE SCROLL + SELECTED INDICATOR
        if (daySubMode === 'multi') {
            // Infinite scroll için 21 günlük buffer (10 geri, 10 ileri)
            const days: Date[] = [];
            for (let i = -10; i <= 10; i++) {
                const d = new Date(multiDayStartDate.getTime() + (i * 86400000));
                days.push(d);
            }

            const TIME_COLUMN_WIDTH = 50;
            const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - TIME_COLUMN_WIDTH) / 2;
            const HEADER_HEIGHT = 36;

            return (
                <View style={[styles.timelinePane, { flexDirection: 'row' }]}>
                    {/* FROZEN TIME COLUMN - Fixed to stay on left */}
                    <View style={{
                        width: TIME_COLUMN_WIDTH,
                        borderRightWidth: 1,
                        borderRightColor: '#2C2C2E',
                        overflow: 'hidden',
                        // marginTop removed to allow borders to extend to top
                    }}>
                        {/* CORNER HEADER PLACEHOLDER - Bridges the horizontal lines */}
                        <View style={{
                            height: HEADER_HEIGHT,
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: '#2C2C2E',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: '#2C2C2E',
                        }} />

                        <Animated.View style={[{ paddingBottom: 150 }, timeColumnStyle]}>
                            {timeSlots.map((time, idx) => (
                                <View key={`${time}-${idx}`} style={styles.timeSlot}>
                                    <Text style={styles.timeText}>{time}</Text>
                                </View>
                            ))}
                        </Animated.View>
                    </View>

                    {/* MASTER HORIZONTAL SCROLLVIEW - Unifies Header and Content for Zero Jitter */}
                    <Animated.ScrollView
                        ref={isCenter ? multiDayHorizontalContentScrollRef : undefined}
                        horizontal
                        onScroll={isCenter ? multiDayContentHorizontalScrollHandler : undefined}
                        onMomentumScrollEnd={isCenter ? handleMultiDayScrollEnd : undefined}
                        scrollEventThrottle={16}
                        bounces={false}
                        decelerationRate={0.98}
                        showsHorizontalScrollIndicator={false}
                        removeClippedSubviews={true}
                        disableIntervalMomentum={false}
                        disableScrollViewPanResponder={false}
                        style={{ flex: 1 }}
                    >
                        <View style={{ width: days.length * DAY_COLUMN_WIDTH }}>
                            {/* HEADER ROW - Inside the Horizontal ScrollView */}
                            <View style={{
                                flexDirection: 'row',
                                height: HEADER_HEIGHT,
                                borderTopWidth: StyleSheet.hairlineWidth,
                                borderTopColor: '#2C2C2E',
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: '#2C2C2E',
                                width: days.length * DAY_COLUMN_WIDTH // Fixed width based on days
                            }}>
                                {days.map((d, idx) => (
                                    <MultiDayHeaderItem
                                        key={idx}
                                        d={d}
                                        idx={idx}
                                        selectedDateTimestamp={selectedDateTimestamp}
                                        multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                                        DAY_COLUMN_WIDTH={DAY_COLUMN_WIDTH}
                                        HEADER_HEIGHT={HEADER_HEIGHT}
                                        isToday={isToday(d)}
                                    />
                                ))}
                            </View>

                            {/* CONTENT AREA: Vertical Grid */}
                            <Animated.ScrollView
                                ref={isCenter ? multiDayVerticalContentScrollRef : undefined}
                                onScroll={isCenter ? multiDayContentVerticalScrollHandler : undefined}
                                scrollEventThrottle={16}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                                contentContainerStyle={{ paddingBottom: 150 }}
                                style={{ flex: 1 }}
                                removeClippedSubviews={true}
                            >
                                <View style={{ position: 'relative' }}>
                                    {timeSlots.map((time, idx) => {
                                        const hour = parseInt(time.split(':')[0]);
                                        return (
                                            <View
                                                key={`${time}-${idx}`}
                                                style={{
                                                    flexDirection: 'row',
                                                    height: SLOT_HEIGHT,
                                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                                    borderBottomColor: '#2C2C2E'
                                                }}
                                            >
                                                {days.map((d, dayIdx) => (
                                                    <View
                                                        key={dayIdx}
                                                        style={{
                                                            width: DAY_COLUMN_WIDTH,
                                                            borderRightWidth: 0.5,
                                                            borderRightColor: '#2C2C2E',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <TimeSlotContent
                                                            date={d}
                                                            hour={hour}
                                                            dayEvents={getEventsForDate(d)}
                                                            workout={getWorkoutForDate(d)}
                                                            availableWidth={DAY_COLUMN_WIDTH - 4}
                                                            leftOffsetBase={0}
                                                            onCreateEvent={handleOpenCreateEvent}
                                                            onEventPress={handleEventPress}
                                                            onWorkoutDayPress={handleWorkoutDayPress}
                                                            onNavigateToDailyDetail={handleNavigateToDailyDetail}
                                                            isMultiDay={true}
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })}

                                    {/* GLOBAL EVENTS LAYER FOR MULTI-DAY: Renders each day's events layer */}
                                    <View
                                        pointerEvents="box-none"
                                        style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}
                                    >
                                        {days.map((d, dayIdx) => (
                                            <View key={dayIdx} pointerEvents="box-none" style={{ width: DAY_COLUMN_WIDTH, height: 24 * SLOT_HEIGHT }}>
                                                {renderEventsForDate(d, getEventsForDate(d), getWorkoutForDate(d), DAY_COLUMN_WIDTH - 4, handleEventPress, true)}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </Animated.ScrollView>
                        </View>
                    </Animated.ScrollView>
                </View>
            );
        }

        // ============ SINGLE DAY MODE (unchanged) ============
        return (
            <View style={styles.timelinePane}>
                <Animated.View style={[styles.dayHeader, dateTitleStyle]}>
                    <Text style={[styles.dayHeaderText, { color: '#FFFFFF' }]}>
                        {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()} • {WEEKDAYS_FULL[date.getDay()]}
                    </Text>
                </Animated.View>

                <ScrollView
                    ref={isCenter ? timelineVerticalScrollRef : undefined}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                >
                    <View style={{ position: 'relative' }}>
                        {timeSlots.map((time, idx) => {
                            const hour = parseInt(time.split(':')[0]);
                            const hasEvents = dayEvents.some((e) => {
                                const eventHour = e.startTime ? parseInt(e.startTime.split(':')[0]) : -1;
                                return eventHour === hour;
                            }) || (hour === 9 && !!workout);

                            return (
                                <TimeSlotItem
                                    key={`${time}-${idx}`}
                                    time={time}
                                    idx={idx}
                                    timelineAnim={timelineAnim}
                                    hasEvents={!!hasEvents}
                                    workout={workout}
                                    dayEvents={dayEvents}
                                    date={date}
                                    onCreateEvent={handleOpenCreateEvent}
                                    onEventPress={handleEventPress}
                                    onWorkoutDayPress={handleWorkoutDayPress}
                                    onNavigateToDailyDetail={handleNavigateToDailyDetail}
                                    isMultiDay={false}
                                />
                            );
                        })}

                        {/* GLOBAL EVENTS LAYER: Renders events on top of the grid */}
                        <View
                            pointerEvents="box-none"
                            style={[StyleSheet.absoluteFill, { left: 50, right: 0 }]}
                        >
                            {renderEventsForDate(date, dayEvents, workout, SCREEN_WIDTH - 50 - 12, handleEventPress, false)}
                        </View>
                    </View>

                    {isToday(date) && (
                        <View style={{
                            ...styles.currentTimeContainer,
                            top: ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * SLOT_HEIGHT,
                        }}>
                            <View style={styles.currentTimeDot} />
                            <View style={styles.currentTimeLine} />
                            <View style={styles.currentTimeLabel}>
                                <Text style={styles.currentTimeText}>
                                    {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderDayCell = useCallback((day: Date | null, idx: number, isAdjacent = false) => {
        let weekTs = 0;
        if (day) {
            const d = new Date(day);
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            weekTs = d.getTime();
        }
        return (
            <DayCell
                key={`${idx}-${day?.getTime() || 'empty'}`}
                day={day}
                dayIdx={idx}
                globalWeekIdx={0}
                selectedWeekIdx={selectedWeekIdx}
                selectedWeekTimestamp={selectedWeekTimestamp}
                selectedDateTimestamp={selectedDateTimestamp}
                multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                selectionAnim={selectionAnim}
                weekTimestamp={weekTs}
                isCollapsed={isCollapsed}
                isToday={isToday(day)}
                isSelected={isSelected(day, selectedDate)}
                handleDayPress={handleDayPress}
                dayEvents={getEventsForDate(day)}
                workout={getWorkoutForDate(day)}
                eventOpacity={null}
                hasSelectedDayInWeek={false}
                isAdjacent={isAdjacent}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
                isMultiDay={daySubMode === 'multi'}
                monthViewMode={monthViewMode}
            />
        );
    }, [selectedWeekIdx, selectedWeekTimestamp, selectedDateTimestamp, multiDayEndDateTimestamp, selectionAnim, isCollapsed, selectedDate, events, schedule, daySubMode, monthViewMode, isToday, isSelected, handleDayPress, getEventsForDate, getWorkoutForDate, handleNavigateToDailyDetail, handleOpenCreateEvent]);



    const renderWeekRow = useCallback((week: (Date | null)[], weekIdx: number, isAdjacent = false, globalOffset = 0, monthKey: string = 'current') => {
        const globalWeekIdx = globalOffset + weekIdx;

        // Calculate stable week timestamp (Monday of this week)
        const firstDay = week.find(d => d !== null);
        let weekTs = 0;
        if (firstDay) {
            const d = new Date(firstDay);
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            weekTs = d.getTime();
        }

        // Create unique key using month identifier and week index
        const uniqueKey = `${monthKey}-week-${weekIdx}`;
        return (
            <WeekRow
                key={uniqueKey}
                week={week}
                weekIdx={weekIdx}
                globalWeekIdx={globalWeekIdx}
                selectedWeekIdx={selectedWeekIdx}
                selectedDateTimestamp={selectedDateTimestamp}
                calendarHeight={calendarHeight}
                scrollY={scrollY}
                isAdjacent={isAdjacent}
                isToday={isToday}
                isSelected={isSelected}
                selectedDate={selectedDate}
                events={events}
                schedule={schedule}
                getEventsForDate={getEventsForDate}
                getWorkoutForDate={getWorkoutForDate}
                handleDayPress={handleDayPress}
                weeksLength={allBufferedWeeks.length}
                isCollapsed={isCollapsed}
                selectionAnim={selectionAnim}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
                weekTimestamp={weekTs}
                selectedWeekTimestamp={selectedWeekTimestamp}
                multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                isMultiDay={daySubMode === 'multi'}
                monthViewMode={monthViewMode}
            />
        );
    }, [selectedWeekIdx, selectedDateTimestamp, calendarHeight, scrollY, isToday, isSelected, selectedDate, events, schedule, getEventsForDate, getWorkoutForDate, handleDayPress, allBufferedWeeks.length, isCollapsed, selectionAnim, handleNavigateToDailyDetail, handleOpenCreateEvent, selectedWeekTimestamp, multiDayEndDateTimestamp, daySubMode, monthViewMode]);

    return (
        <>
            <Animated.View style={[styles.card, cardStyle]}>
                <Animated.View style={styles.gestureHeader}>
                    <GestureDetector gesture={panGesture}>
                        <Animated.View>
                            {/* HEADER - Restored with Goal Button Integrated */}
                            <View style={styles.header}>
                                <View style={styles.headerLeft}>
                                    <TouchableOpacity
                                        onPress={isCollapsed ? handleBackToMonth : handleYearPress}
                                        style={styles.backButton}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="chevron-left" size={26} color="#FFF" />
                                        <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>
                                            {isCollapsed
                                                ? (selectedDate instanceof Date ? MONTHS_FULL[selectedDate.getMonth()] : '')
                                                : (headerMonth instanceof Date ? headerMonth.getFullYear() : new Date().getFullYear())}
                                        </Text>
                                    </TouchableOpacity>

                                </View>

                                <View style={styles.headerRightPill}>
                                    {/* View Menu Trigger */}
                                    <TouchableOpacity
                                        ref={viewButtonRef}
                                        onPress={handleOpenViewMenu}
                                        style={styles.headerRightIcon}
                                        activeOpacity={1}
                                        disabled={showViewMenu}
                                    >
                                        <Feather
                                            name={daySubMode === 'list' ? 'list' : daySubMode === 'multi' ? 'grid' : 'square'}
                                            size={20}
                                            color="#FFF"
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />

                                    {/* Plus Button */}
                                    <TouchableOpacity
                                        onPress={() => handleOpenCreateEvent(selectedDate)}
                                        style={styles.headerRightIcon}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="plus" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />


                                    {/* Close Button */}
                                    <TouchableOpacity
                                        onPress={() => onFullScreenPress ? onFullScreenPress() : navigation?.goBack()}
                                        style={styles.headerRightIcon}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="x" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Month Title - visible only in month view */}
                            <Animated.View style={[styles.monthTitleContainer, monthTitleStyle]}>
                                <Animated.Text style={[styles.monthTitle, monthTitleTextStyle]}>
                                    {headerMonth instanceof Date ? MONTHS_FULL[headerMonth.getMonth()] : MONTHS_FULL[new Date().getMonth()]}
                                </Animated.Text>
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>

                    {/* Weekday headers - Outside detector now */}
                    <View style={styles.weekdayRow}>
                        {WEEKDAYS.map((day, idx) => (
                            <Text key={idx} style={[styles.weekday, idx >= 5 && styles.weekendWeekday]}>
                                {day}
                            </Text>
                        ))}
                    </View>
                </Animated.View>

                {/* Calendar content - Outside GestureDetector to allow free scrolling */}
                <View style={styles.calendarContent}>
                    {/* Week view (for day mode) */}
                    <Animated.View style={[styles.weekContainer, weekContainerStyle]}>
                        <ScrollView
                            ref={weekScrollViewRef}
                            horizontal
                            pagingEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleWeekScrollEnd}
                            scrollEventThrottle={16}
                            contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                            scrollEnabled={isCollapsed}
                            decelerationRate={0.98}
                        >
                            {/* Prev Week */}
                            <View style={styles.weekPane}>
                                {prevWeekDays.map((day, idx) => renderDayCell(day, idx, true))}
                            </View>
                            {/* Current Week */}
                            <View style={styles.weekPane}>
                                {weekDays.map((day, idx) => renderDayCell(day, idx))}
                            </View>
                            {/* Next Week */}
                            <View style={styles.weekPane}>
                                {nextWeekDays.map((day, idx) => renderDayCell(day, idx, true))}
                            </View>
                        </ScrollView>
                    </Animated.View>

                    {/* Month grid - Vertical Scroll */}
                    <Animated.View style={[styles.monthGrid, monthGridStyle]}>
                        {monthViewMode === 'list' ? (
                            // LIST MODE: Horizontal scroll for months + Event list below
                            <View style={{ flex: 1 }}>
                                {/* Horizontal Month Scroll */}
                                <ScrollView
                                    ref={listMonthScrollRef}
                                    horizontal
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                                    decelerationRate={0.98}
                                    onMomentumScrollEnd={(e) => {
                                        const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                        if (pageIndex === 0) {
                                            // Scrolled to prev month
                                            const prev = new Date(currentMonth);
                                            prev.setMonth(currentMonth.getMonth() - 1);
                                            setCurrentMonth(prev);
                                            // Reset scroll to center after state update
                                            setTimeout(() => {
                                                listMonthScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
                                            }, 50);
                                        } else if (pageIndex === 2) {
                                            // Scrolled to next month
                                            const next = new Date(currentMonth);
                                            next.setMonth(currentMonth.getMonth() + 1);
                                            setCurrentMonth(next);
                                            // Reset scroll to center after state update
                                            setTimeout(() => {
                                                listMonthScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
                                            }, 50);
                                        }
                                    }}
                                    style={{ flexGrow: 0 }}
                                >
                                    {/* Previous Month (anchor - 1) */}
                                    <View style={{ width: SCREEN_WIDTH }}>
                                        {(() => {
                                            const anchorIndex = -bufferStart; // Index of today in buffer
                                            const prevIdx = anchorIndex - 1;
                                            if (prevIdx >= 0 && monthWeeksInfo[prevIdx] && bufferStage >= 1) {
                                                const m = monthWeeksInfo[prevIdx];
                                                return m.weeks.map((week, weekIdx) => {
                                                    const monthKey = `list-prev-${m.year}-${m.month}`;
                                                    return renderWeekRow(week, weekIdx, true, 0, monthKey);
                                                });
                                            }
                                            return null;
                                        })()}
                                    </View>
                                    {/* Current Month (anchor) */}
                                    <View style={{ width: SCREEN_WIDTH }}>
                                        {(() => {
                                            const anchorIndex = -bufferStart;
                                            const m = monthWeeksInfo[anchorIndex];
                                            if (m) {
                                                return m.weeks.map((week, weekIdx) => {
                                                    const monthKey = `list-${m.year}-${m.month}`;
                                                    return renderWeekRow(week, weekIdx, false, 0, monthKey);
                                                });
                                            }
                                            return null;
                                        })()}
                                    </View>
                                    {/* Next Month (anchor + 1) */}
                                    <View style={{ width: SCREEN_WIDTH }}>
                                        {(() => {
                                            const anchorIndex = -bufferStart;
                                            const nextIdx = anchorIndex + 1;
                                            if (nextIdx < monthWeeksInfo.length && monthWeeksInfo[nextIdx] && bufferStage >= 1) {
                                                const m = monthWeeksInfo[nextIdx];
                                                return m.weeks.map((week, weekIdx) => {
                                                    const monthKey = `list-next-${m.year}-${m.month}`;
                                                    return renderWeekRow(week, weekIdx, true, 0, monthKey);
                                                });
                                            }
                                            return null;
                                        })()}
                                    </View>
                                </ScrollView>

                                {/* Separator Line */}
                                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#2C2C2E', marginHorizontal: 16 }} />

                                {/* Event List Container */}
                                <View style={{ flex: 1, paddingTop: 20 }}>
                                    {(() => {
                                        // Get all events for selected date
                                        const selectedEvents = getEventsForDate(selectedDate);
                                        const workout = getWorkoutForDate(selectedDate);

                                        if (selectedEvents.length === 0 && !workout) {
                                            return (
                                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                                                    <Text style={{ color: '#8E8E93', fontSize: 20, fontWeight: '400' }}>No Events</Text>
                                                </View>
                                            );
                                        }

                                        return (
                                            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
                                                {/* Workout Event */}
                                                {workout && (
                                                    <TouchableOpacity
                                                        style={{
                                                            flexDirection: 'row',
                                                            paddingVertical: 12,
                                                            borderLeftWidth: 3,
                                                            borderLeftColor: (WORKOUT_DAY_COLORS as any)[workout] || '#8E8E93',
                                                            paddingLeft: 12,
                                                            marginBottom: 8,
                                                        }}
                                                        onPress={() => handleNavigateToDailyDetail(selectedDate)}
                                                    >
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '500' }}>
                                                                {workout}
                                                            </Text>
                                                        </View>
                                                        <Text style={{ color: '#8E8E93', fontSize: 14 }}>
                                                            09:00
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}

                                                {/* Regular Events */}
                                                {selectedEvents.map((event) => (
                                                    <TouchableOpacity
                                                        key={event.id}
                                                        style={{
                                                            flexDirection: 'row',
                                                            paddingVertical: 12,
                                                            borderLeftWidth: 3,
                                                            borderLeftColor: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#8E8E93',
                                                            paddingLeft: 12,
                                                            marginBottom: 8,
                                                        }}
                                                        onPress={() => handleEventPress(event)}
                                                    >
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '500' }}>
                                                                {event.title}
                                                            </Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ color: '#8E8E93', fontSize: 14 }}>
                                                                {event.startTime}
                                                            </Text>
                                                            {event.endTime && (
                                                                <Text style={{ color: '#8E8E93', fontSize: 14 }}>
                                                                    {event.endTime}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        );
                                    })()}
                                </View>
                            </View>
                        ) : (
                            // NORMAL MODES: Continuous vertical scroll
                            <Animated.ScrollView
                                ref={monthScrollViewRef}
                                key="month-vertical-scroll"
                                showsVerticalScrollIndicator={false}
                                onMomentumScrollEnd={handleMonthScrollEnd}
                                onScroll={scrollHandler}
                                scrollEventThrottle={8}
                                decelerationRate="normal"
                                contentOffset={{ x: 0, y: centerOffsetWeeks * WEEK_ROW_HEIGHT }}
                                scrollEnabled={!isCollapsed}
                                removeClippedSubviews={Platform.OS === 'android'} // Usually better on Android, sometimes jittery on iOS
                                nestedScrollEnabled={true}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: 100 }}
                            >
                                {/* Progressive rendering for 7-month buffer */}
                                <View>
                                    {allBufferedWeeks.map((item) => {
                                        // Render if within active bufferStage, otherwise placeholder
                                        if (Math.abs(item.bufferIdx) <= bufferStage) {
                                            return renderWeekRow(item.week, item.globalIdx, false, 0, item.monthKey);
                                        }
                                        return <View key={`${item.monthKey}-placeholder-${item.globalIdx}`} style={{ height: WEEK_ROW_HEIGHT }} />;
                                    })}
                                </View>
                            </Animated.ScrollView>
                        )}
                    </Animated.View>

                    {/* Year View Overlay */}
                    {/* Calendar View Modal */}
                    <Modal
                        transparent
                        visible={isViewModalVisible}
                        animationType="none"
                        onRequestClose={() => setShowViewMenu(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowViewMenu(false)}>
                            <View style={eventDetailStyles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <RNAnimated.View
                            style={[
                                eventDetailStyles.goalMenuAnimatedWrapper,
                                {
                                    top: viewMenuPosition.top,
                                    right: viewMenuPosition.right,
                                    opacity: viewMenuOpacity,
                                    transform: [
                                        { translateX: viewMenuTranslateX },
                                        { translateY: viewMenuTranslateY },
                                        { scale: viewMenuScale }
                                    ],
                                }
                            ]}
                            pointerEvents="auto"
                        >
                            <LiquidGlassCard borderRadius={28} width={260}>
                                {isCollapsed ? (
                                    // Day view options
                                    <>
                                        <LiquidGlassMenuItem
                                            label="Single Day"
                                            onPress={() => handleSwitchViewMode('single')}
                                            icon={<MaterialCommunityIcons name="view-day-outline" size={20} color="#FFF" />}
                                            showCheck={daySubMode === 'single'}
                                        />
                                        <LiquidGlassMenuItem
                                            label="Multi Day"
                                            onPress={() => handleSwitchViewMode('multi')}
                                            icon={<MaterialCommunityIcons name="view-week-outline" size={20} color="#FFF" />}
                                            showCheck={daySubMode === 'multi'}
                                        />
                                        <LiquidGlassMenuItem
                                            label="List"
                                            onPress={() => handleSwitchViewMode('list')}
                                            icon={<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFF" />}
                                            showCheck={daySubMode === 'list'}
                                        />
                                    </>
                                ) : (
                                    // Month view options
                                    <>
                                        <LiquidGlassMenuItem
                                            label="Compact"
                                            onPress={() => handleSwitchMonthViewMode('compact')}
                                            icon={<MaterialCommunityIcons name="circle-small" size={20} color="#FFF" />}
                                            showCheck={monthViewMode === 'compact'}
                                        />
                                        <LiquidGlassMenuItem
                                            label="Stacked"
                                            onPress={() => handleSwitchMonthViewMode('stacked')}
                                            icon={<MaterialCommunityIcons name="view-sequential" size={20} color="#FFF" />}
                                            showCheck={monthViewMode === 'stacked'}
                                        />
                                        <LiquidGlassMenuItem
                                            label="Details"
                                            onPress={() => handleSwitchMonthViewMode('details')}
                                            icon={<MaterialCommunityIcons name="view-grid" size={20} color="#FFF" />}
                                            showCheck={monthViewMode === 'details'}
                                        />
                                        <LiquidGlassMenuItem
                                            label="List"
                                            onPress={() => handleSwitchMonthViewMode('list')}
                                            icon={<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFF" />}
                                            showCheck={monthViewMode === 'list'}
                                        />
                                    </>
                                )}
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>



                    {/* Week Selector Modal */}
                    <YearCalendarModal
                        visible={showYearModal}
                        onClose={() => setShowYearModal(false)}
                        onMonthSelect={handleYearModalSelect}
                        initialYear={currentMonth.getFullYear()}
                    />

                    {/* Timeline view (visible in day mode) */}
                    <Animated.View style={[styles.timelineContainer, timelineStyle]}>
                        <View style={{ flex: 1 }}>
                            {daySubMode === 'multi' ? (
                                // ============ MULTI DAY: NO HORIZONTAL SCROLL ============
                                <View style={{ flex: 1 }}>
                                    {renderTimelinePane(selectedDate, true)}
                                </View>
                            ) : (
                                // ============ SINGLE DAY: HORIZONTAL SCROLL (PREV/CURRENT/NEXT) ============
                                <ScrollView
                                    ref={timelineHorizontalScrollViewRef}
                                    horizontal
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={handleTimelineScrollEnd}
                                    scrollEventThrottle={16}
                                    contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                                    style={{ flex: 1 }}
                                    decelerationRate={0.98}
                                >
                                    {renderTimelinePane(new Date(selectedDate.getTime() - 86400000))}
                                    {renderTimelinePane(selectedDate, true)}
                                    {renderTimelinePane(new Date(selectedDate.getTime() + 86400000))}
                                </ScrollView>
                            )}
                        </View>
                    </Animated.View>

                </View>

                {/* Bottom Navigation Bar - iOS Calendar Style - Always visible */}
                <View style={styles.bottomNav}>
                    <LiquidGlass
                        borderRadius={24}
                        onPress={handleTodayPress}
                        style={styles.todayButton}
                    >
                        <Text style={styles.todayButtonText}>Today</Text>
                    </LiquidGlass>
                </View>

            </Animated.View >

            {/* Year Picker Modal - iOS style */}
            <Modal
                visible={showYearPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowYearPicker(false)}
            >
                <View style={styles.yearPickerContainer}>
                    <View style={styles.yearHeader}>
                        <Text style={styles.yearTitle}>{selectedDate.getFullYear()}</Text>
                        <View style={styles.headerRightPill}>
                            <TouchableOpacity onPress={() => { }} style={styles.headerRightIcon}>
                                <Feather name="search" size={18} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerRightSeparator} />
                            <TouchableOpacity onPress={() => handleOpenCreateEvent(selectedDate)} style={styles.headerRightIcon}>
                                <Feather name="plus" size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.yearScroll}>
                        <View style={styles.yearGrid}>
                            {Array.from({ length: 12 }, (_, monthIdx) => (
                                <View key={monthIdx} style={styles.miniMonth}>
                                    <Text style={styles.miniMonthName}>{MONTHS_SHORT[monthIdx]}</Text>
                                    <MiniMonthGrid
                                        year={selectedDate.getFullYear()}
                                        month={monthIdx}
                                        onDayPress={(date) => {
                                            setSelectedDate(date);
                                            setCurrentMonth(date);
                                            setHeaderMonth(date);
                                            setShowYearPicker(false);
                                            calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, {
                                                duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                                                easing: ANIMATION_CONFIG.EASING,
                                            });
                                        }}
                                        selectedDate={selectedDate}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.yearBottomNav}>
                        <TouchableOpacity
                            onPress={() => {
                                // Toggle view mode or show menu
                                const modes: ViewMode[] = ['day', 'week', 'month'];
                                const nextIndex = (modes.indexOf(viewMode) + 1) % modes.length;
                                setViewMode(modes[nextIndex]);
                            }}
                            style={styles.todayButton}
                        >
                            <Text style={styles.todayButtonText}>
                                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.navIconsPill}>
                            <TouchableOpacity
                                onPress={() => setShowCreateEvent(true)}
                                style={styles.navIcon}
                            >
                                <Feather name="plus" size={22} color="#9DEC2C" />
                            </TouchableOpacity>
                            <View style={styles.headerRightSeparator} />
                            <TouchableOpacity
                                style={styles.navIcon}
                                onPress={() => onFullScreenPress && onFullScreenPress()}
                            >
                                <Feather name="x" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal >

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* EVENT DETAIL - Full Screen with Right Slide Animation */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showEventDetail && selectedEventForDetail && (
                <>
                    <RNAnimated.View
                        style={[
                            eventDetailStyles.fullScreenContainer,
                            { transform: [{ translateX: eventDetailSlideAnim }] }
                        ]}
                        {...eventDetailPanResponder.panHandlers}
                    >
                        <View style={eventDetailStyles.container}>
                            {/* Header */}
                            <View style={eventDetailStyles.header}>
                                <TouchableOpacity
                                    style={eventDetailStyles.circularIconButton}
                                    onPress={handleCloseEventDetail}
                                >
                                    <Feather name="chevron-left" size={22} color="#FFF" />
                                    <Text style={eventDetailStyles.backButtonText}>
                                        {formatHeaderDate(selectedEventForDetail.date)}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={eventDetailStyles.circularIconButton}
                                    onPress={handleEditEvent}
                                >
                                    <Feather name="edit-2" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={eventDetailStyles.content} showsVerticalScrollIndicator={false}>
                                {/* Event Title */}
                                <Text style={eventDetailStyles.eventTitle}>{selectedEventForDetail.title}</Text>

                                {/* Date & Time */}
                                <Text style={eventDetailStyles.dateText}>
                                    {formatEventDetailDate(selectedEventForDetail.date)}
                                </Text>
                                <Text style={eventDetailStyles.timeText}>
                                    {selectedEventForDetail.startTime || '09:00'} – {selectedEventForDetail.endTime || '10:00'}
                                </Text>

                                {/* Timeline Block */}
                                {(() => {
                                    const startHour = parseInt((selectedEventForDetail.startTime || '09:00').split(':')[0]);
                                    const startMin = parseInt((selectedEventForDetail.startTime || '09:00').split(':')[1]);
                                    const endHour = parseInt((selectedEventForDetail.endTime || '10:00').split(':')[0]);
                                    const endMin = parseInt((selectedEventForDetail.endTime || '10:00').split(':')[1]);
                                    const HOUR_HEIGHT = 50;
                                    const LINE_OFFSET = 8; // marginTop of hourSeparator
                                    const VERTICAL_PADDING = 16;
                                    const hoursToShow: number[] = [];
                                    for (let h = startHour; h <= endHour + 1; h++) {
                                        hoursToShow.push(h % 24);
                                    }
                                    const startOffset = startMin / 60 * HOUR_HEIGHT;
                                    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
                                    const eventHeight = (durationMinutes / 60) * HOUR_HEIGHT;
                                    const eventColor = selectedEventForDetail.workoutDay
                                        ? WORKOUT_DAY_COLORS[selectedEventForDetail.workoutDay]
                                        : '#4A90D9';

                                    return (
                                        <View style={eventDetailStyles.timelineContainer}>
                                            {hoursToShow.map((hour, index) => {
                                                const isLastRow = index === hoursToShow.length - 1;
                                                return (
                                                    <View key={`${hour}-${index}`} style={[eventDetailStyles.hourRow, { height: isLastRow ? 16 : HOUR_HEIGHT }]}>
                                                        <Text style={eventDetailStyles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                                                        <View style={eventDetailStyles.hourSeparator} />
                                                    </View>
                                                );
                                            })}

                                            <View style={[
                                                eventDetailStyles.eventBlock,
                                                {
                                                    backgroundColor: eventColor,
                                                    position: 'absolute',
                                                    left: 16 + 50 + 10,
                                                    right: 16,
                                                    top: 24 + LINE_OFFSET + startOffset,
                                                    height: eventHeight,
                                                }
                                            ]}>
                                                <Text style={eventDetailStyles.eventBlockTitle}>{selectedEventForDetail.title}</Text>
                                                <View style={eventDetailStyles.eventBlockTimeRow}>
                                                    <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                                                    <Text style={eventDetailStyles.eventBlockTime}>
                                                        {selectedEventForDetail.startTime || '09:00'} – {selectedEventForDetail.endTime || '10:00'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })()}

                                {/* Settings Container (Calendar, Alert, Second Alert) */}
                                <View style={eventDetailStyles.settingsButtonsContainer}>
                                    {/* Calendar Button (Mocked for UI consistency) */}
                                    <View style={eventDetailStyles.settingButtonRow}>
                                        <View style={eventDetailStyles.settingLabelContainer}>
                                            <Text style={eventDetailStyles.settingLabel}>Calendar</Text>
                                        </View>
                                        <TouchableOpacity
                                            ref={calendarButtonRef}
                                            style={eventDetailStyles.settingValueRow}
                                            onPress={handleOpenCalendarMenu}
                                            disabled={showCalendarMenu}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={eventDetailStyles.settingValue}>
                                                {!calendarPermission
                                                    ? 'Tap to access'
                                                    : deviceCalendars.find(c => c.id === selectedEventForDetail.calendar)?.title || 'Default'
                                                }
                                            </Text>
                                            <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={eventDetailStyles.settingSeparator} />

                                    {/* Alert Button */}
                                    <View style={eventDetailStyles.settingButtonRow}>
                                        <View style={eventDetailStyles.settingLabelContainer}>
                                            <Text style={eventDetailStyles.settingLabel}>Alert</Text>
                                        </View>
                                        <TouchableOpacity
                                            ref={alertButtonRef}
                                            style={eventDetailStyles.settingValueRow}
                                            onPress={handleOpenAlertMenu}
                                            disabled={showAlertMenu}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={eventDetailStyles.settingValue}>
                                                {getAlertLabel(selectedEventForDetail.alertMinutes)}
                                            </Text>
                                            <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={eventDetailStyles.settingSeparator} />

                                    {/* Second Alert Button */}
                                    <View style={eventDetailStyles.settingButtonRow}>
                                        <View style={eventDetailStyles.settingLabelContainer}>
                                            <Text style={eventDetailStyles.settingLabel}>Second Alert</Text>
                                        </View>
                                        <TouchableOpacity
                                            ref={secondAlertButtonRef}
                                            style={eventDetailStyles.settingValueRow}
                                            onPress={handleOpenSecondAlertMenu}
                                            disabled={showSecondAlertMenu}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={eventDetailStyles.settingValue}>
                                                {getAlertLabel(selectedEventForDetail.secondAlertMinutes)}
                                            </Text>
                                            <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Workout Section (Replica of WorkoutEventDetailScreen) */}
                                {workoutCards.length > 0 && (
                                    <View style={eventDetailStyles.workoutsSection}>
                                        <View style={eventDetailStyles.sectionHeaderRow}>
                                            <Text style={eventDetailStyles.sectionTitle}>Workouts</Text>
                                            <TouchableOpacity>
                                                <Text style={eventDetailStyles.seeAllText}>See All</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={eventDetailStyles.workoutGrid}>
                                            {workoutCards.slice(0, 4).map((workout) => {
                                                const SvgIcon = workout.SvgIcon;
                                                // Determine event color
                                                const eventColor = selectedEventForDetail.workoutDay
                                                    ? WORKOUT_DAY_COLORS[selectedEventForDetail.workoutDay]
                                                    : '#4A90D9';

                                                return (
                                                    <TouchableOpacity
                                                        key={workout.workoutId}
                                                        style={eventDetailStyles.workoutCard}
                                                        onPress={() => handleWorkoutPress(workout)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <View style={[eventDetailStyles.cardIconContainer, { backgroundColor: eventColor + '30' }]}>
                                                            {SvgIcon && <SvgIcon width={40} height={40} fill={eventColor} />}
                                                        </View>
                                                        <Text style={eventDetailStyles.cardTitle} numberOfLines={2}>
                                                            {workout.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Additional Spacing */}
                                <View style={{ height: 20 }} />

                                {/* Delete Button (matching WorkoutEventDetailScreen) */}
                                <View style={eventDetailStyles.deleteButtonContainer}>
                                    <TouchableOpacity
                                        ref={deleteButtonRef}
                                        onPress={handleDeleteEvent}
                                        style={eventDetailStyles.deleteButton}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={eventDetailStyles.deleteButtonText}>Delete Workout</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </RNAnimated.View>

                    {/* Calendar Menu Modal */}
                    <Modal
                        transparent
                        visible={isCalendarModalVisible}
                        animationType="none"
                        onRequestClose={() => setIsCalendarModalVisible(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setIsCalendarModalVisible(false)}>
                            <View style={eventDetailStyles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <RNAnimated.View
                            style={[
                                eventDetailStyles.goalMenuAnimatedWrapper,
                                {
                                    top: calendarMenuPosition.top,
                                    right: calendarMenuPosition.right,
                                    opacity: calendarMenuOpacity,
                                    transform: [
                                        { translateX: calendarMenuTranslateX },
                                        { translateY: calendarMenuTranslateY },
                                        { scale: calendarMenuScale }
                                    ],
                                }
                            ]}
                            pointerEvents="auto"
                        >
                            <LiquidGlassCard
                                borderRadius={28}
                                width={260}
                            >
                                {loadingCalendars ? (
                                    <LiquidGlassMenuItem
                                        label="Loading calendars..."
                                        onPress={() => { }}
                                    />
                                ) : deviceCalendars.length === 0 ? (
                                    <LiquidGlassMenuItem
                                        label="No calendars found"
                                        onPress={() => setShowCalendarMenu(false)}
                                    />
                                ) : (
                                    <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                        {deviceCalendars.map((calendar) => (
                                            <LiquidGlassMenuItem
                                                key={calendar.id}
                                                icon={
                                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: calendar.color }} />
                                                }
                                                label={calendar.title}
                                                onPress={() => handleCalendarSelect(calendar.id)}
                                                iconWidth={20}
                                            />
                                        ))}
                                    </ScrollView>
                                )}
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>

                    {/* Alert Menu Modal */}
                    <Modal
                        transparent
                        visible={isAlertModalVisible}
                        animationType="none"
                        onRequestClose={() => setShowAlertMenu(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowAlertMenu(false)}>
                            <View style={eventDetailStyles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <RNAnimated.View
                            style={[
                                eventDetailStyles.goalMenuAnimatedWrapper,
                                {
                                    top: alertMenuPosition.top,
                                    right: alertMenuPosition.right,
                                    opacity: alertMenuOpacity,
                                    transform: [
                                        { translateX: alertMenuTranslateX },
                                        { translateY: alertMenuTranslateY },
                                        { scale: alertMenuScale }
                                    ],
                                }
                            ]}
                            pointerEvents="auto"
                        >
                            <LiquidGlassCard
                                borderRadius={28}
                                width={260}
                            >
                                <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                    {ALERT_OPTIONS.map((opt) => (
                                        <LiquidGlassMenuItem
                                            key={opt.value}
                                            icon={
                                                selectedEventForDetail.alertMinutes === opt.value
                                                    ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" />
                                                    : undefined
                                            }
                                            label={opt.label}
                                            onPress={() => {
                                                handleAlertChange(opt.value);
                                                setShowAlertMenu(false);
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>

                    {/* Second Alert Menu Modal */}
                    <Modal
                        transparent
                        visible={isSecondAlertModalVisible}
                        animationType="none"
                        onRequestClose={() => setShowSecondAlertMenu(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowSecondAlertMenu(false)}>
                            <View style={eventDetailStyles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <RNAnimated.View
                            style={[
                                eventDetailStyles.goalMenuAnimatedWrapper,
                                {
                                    top: secondAlertMenuPosition.top,
                                    right: secondAlertMenuPosition.right,
                                    opacity: secondAlertMenuOpacity,
                                    transform: [
                                        { translateX: secondAlertMenuTranslateX },
                                        { translateY: secondAlertMenuTranslateY },
                                        { scale: secondAlertMenuScale }
                                    ],
                                }
                            ]}
                            pointerEvents="auto"
                        >
                            <LiquidGlassCard
                                borderRadius={28}
                                width={260}
                            >
                                <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                                    {ALERT_OPTIONS.map((opt) => (
                                        <LiquidGlassMenuItem
                                            key={opt.value}
                                            icon={
                                                selectedEventForDetail.secondAlertMinutes === opt.value
                                                    ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" />
                                                    : undefined
                                            }
                                            label={opt.label}
                                            onPress={() => {
                                                handleSecondAlertChange(opt.value);
                                                setShowSecondAlertMenu(false);
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>

                    {/* Delete Confirmation Modal (matching WorkoutEventDetailScreen) */}
                    <Modal
                        transparent
                        visible={isDeleteModalVisible}
                        animationType="none"
                        onRequestClose={() => setShowDeleteModal(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
                            <View style={eventDetailStyles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <RNAnimated.View
                            style={[
                                eventDetailStyles.goalMenuAnimatedWrapper,
                                {
                                    top: deleteMenuPosition.top,
                                    right: deleteMenuPosition.right,
                                    opacity: deleteMenuOpacity,
                                    transform: [
                                        { translateX: deleteMenuTranslateX },
                                        { translateY: deleteMenuTranslateY },
                                        { scale: deleteMenuScale }
                                    ],
                                }
                            ]}
                            pointerEvents="auto"
                        >
                            <LiquidGlassCard borderRadius={28} width={260}>
                                <LiquidGlassMenuItem
                                    label="Delete This Event Only"
                                    textColor="#FF3B30"
                                    textAlign="center"
                                    onPress={handleDeleteThisEventOnly}
                                />
                                {selectedEventForDetail?.workoutDay && (
                                    <LiquidGlassMenuItem
                                        label="Delete All Future Events"
                                        textColor="#FF3B30"
                                        textAlign="center"
                                        onPress={handleDeleteAllFutureEvents}
                                    />
                                )}
                                <LiquidGlassMenuItem
                                    label="Cancel"
                                    textAlign="center"
                                    onPress={() => setShowDeleteModal(false)}
                                />
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* WORKOUT DAY PICKER - Select workout day for a specific date */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showWorkoutDayPicker && (
                <Modal
                    visible={showWorkoutDayPicker}
                    transparent={true}
                    animationType="none"
                >
                    <RNAnimated.View
                        style={[
                            workoutDayPickerStyles.fullScreenContainer,
                            { transform: [{ translateY: workoutDayPickerSlideAnim }] }
                        ]}
                    >
                        <View style={workoutDayPickerStyles.modalContainer}>
                            {/* Drag Handle */}
                            <View style={workoutDayPickerStyles.dragHandle} />

                            {/* Header */}
                            <View style={workoutDayPickerStyles.header}>
                                <TouchableOpacity
                                    onPress={handleCloseWorkoutDayPicker}
                                    style={workoutDayPickerStyles.closeButton}
                                >
                                    <Feather name="x" size={24} color="#FFF" />
                                </TouchableOpacity>

                                <Text style={workoutDayPickerStyles.headerTitle}>
                                    Set Workout Day
                                </Text>

                                <TouchableOpacity
                                    onPress={handleSaveWorkoutDay}
                                    style={workoutDayPickerStyles.saveButton}
                                >
                                    <Feather name="check" size={24} color="#9DEC2C" />
                                </TouchableOpacity>
                            </View>

                            {/* Selected Date Display */}
                            <View style={workoutDayPickerStyles.dateSection}>
                                <Text style={workoutDayPickerStyles.dateText}>
                                    {workoutDayPickerDate.getDate()} {MONTHS_FULL[workoutDayPickerDate.getMonth()]} {workoutDayPickerDate.getFullYear()}
                                </Text>
                                <Text style={workoutDayPickerStyles.dateSubtext}>
                                    {WEEKDAYS_FULL[workoutDayPickerDate.getDay()]}
                                </Text>
                            </View>

                            {/* Workout Days Grid */}
                            <ScrollView
                                style={workoutDayPickerStyles.scrollView}
                                contentContainerStyle={workoutDayPickerStyles.gridContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                {WORKOUT_DAYS.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            workoutDayPickerStyles.dayCard,
                                            selectedWorkoutDayForPicker === day && {
                                                borderColor: WORKOUT_DAY_COLORS[day],
                                                borderWidth: 2,
                                            }
                                        ]}
                                        onPress={() => setSelectedWorkoutDayForPicker(day)}
                                        activeOpacity={0.8}
                                    >
                                        <View
                                            style={[
                                                workoutDayPickerStyles.dayCardColor,
                                                { backgroundColor: WORKOUT_DAY_COLORS[day] }
                                            ]}
                                        />
                                        <Text style={workoutDayPickerStyles.dayCardText}>{day}</Text>
                                        {selectedWorkoutDayForPicker === day && (
                                            <View style={workoutDayPickerStyles.checkmarkContainer}>
                                                <Feather name="check" size={18} color={WORKOUT_DAY_COLORS[day]} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </RNAnimated.View>
                </Modal>
            )}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CREATE EVENT MODAL REMOVED - Logic moved to CreateWorkoutEventScreen */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CREATE EVENT - Full Screen with Bottom Slide Animation */}
            {/* ═══════════════════════════════════════════════════════════════ */}
        </>
    );
}

// Mini month grid for year view
const MiniMonthGrid = ({
    year,
    month,
    onDayPress,
    selectedDate
}: {
    year: number;
    month: number;
    onDayPress: (date: Date) => void;
    selectedDate: Date;
}) => {
    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const days: (Date | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = getDaysInMonth();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <View style={styles.miniGrid}>
            {weeks.map((week, weekIdx) => (
                <View key={weekIdx} style={styles.miniWeek}>
                    {week.map((day, dayIdx) => {
                        if (!day) return <View key={dayIdx} style={styles.miniDay} />;

                        const isSelected = day.toDateString() === selectedDate.toDateString();
                        const now = new Date();
                        const isToday = day.getDate() === now.getDate() && day.getMonth() === now.getMonth() && day.getFullYear() === now.getFullYear();

                        return (
                            <TouchableOpacity
                                key={dayIdx}
                                style={styles.miniDay}
                                onPress={() => onDayPress(day)}
                                activeOpacity={1}
                            >
                                <View style={[
                                    isToday && styles.miniTodayCircle,
                                    isSelected && !isToday && styles.miniSelectedCircle
                                ]}>
                                    <Text style={[
                                        styles.miniDayText,
                                        isToday && styles.miniDayTodayText,
                                        isSelected && !isToday && styles.miniDaySelectedText,
                                    ]}>
                                        {day.getDate()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#000000',
    },
    header: {
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        height: HEADER_HEIGHT,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingLeft: 4,
        paddingRight: 20,
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    yearText: {
        fontSize: 12,
        color: '#ffffffff',
        fontWeight: '600',
        marginLeft: -4,
    },
    backButtonText: {
        fontSize: 19,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerRightPill: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        gap: 8,
    },
    viewModeSelector: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 2,
        marginLeft: 12,
    },
    viewModeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    viewModeButtonActive: {
        backgroundColor: '#48484A',
    },
    viewModeText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
    },
    viewModeTextActive: {
        color: '#FFF',
    },
    goalMenuContainer: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    goalMenuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    goalMenuAnimatedWrapper: {
        position: 'absolute',
        zIndex: 1000,
    },
    headerRightIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRightSeparator: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    todayButton: {
        height: 46,
        borderRadius: 24,
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    navIconsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        height: 50,
        paddingHorizontal: 6,
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    navIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },

    monthTitleContainer: {
        paddingHorizontal: 8,
        paddingLeft: 18, // January'yi M ile hizala (~10px sağa)
        paddingTop: 0, // Reset padding
        paddingBottom: 8,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    monthTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginTop: -5, // Move 5px further up
    },
    dateTitleContainer: {
        display: 'none', // Removed from old position
    },
    dayHeader: {
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: '#000',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#2C2C2E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
        zIndex: 5,
        alignItems: 'center',
    },
    dayHeaderText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    weekdayRow: {
        flexDirection: 'row',
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 4,
    },
    weekday: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    weekendWeekday: {
        color: '#FFFFFF',
    },
    calendarContent: {
        flex: 1,
        overflow: 'hidden',
    },
    gestureHeader: {
        width: '100%',
    },
    weekPane: {
        width: SCREEN_WIDTH,
        flexDirection: 'row',
        paddingHorizontal: 0,
    },
    monthPane: {
        width: '100%',
    },
    weekContainer: {
        paddingHorizontal: 0, // Parent padding removed (child WeekRow has 16px)
        position: 'absolute',
        width: '100%',
        height: DAY_VIEW_HEIGHT,
        top: 0, // ✅ 8'den 0'a

        zIndex: 30,
        overflow: 'visible', // Flying rows için gerekli
    },
    monthGrid: {
        paddingHorizontal: 0,
        paddingTop: 0,
        flex: 1, // Allow it to expand
        overflow: 'visible', // hidden yerine visible
        zIndex: 20, // 10'dan 20'ye yükseltildi
    },

    weekRow: {
        flexDirection: 'row',
        height: WEEK_ROW_HEIGHT, // Force exact height for snapping stability
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    weekRowSeparator: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E', // Slightly darker, cleaner separator
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 9, // ✅ Fixed padding for both views
        height: WEEK_ROW_HEIGHT, // Base height
    },
    dayCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },

    todayCircle: {
        position: 'absolute',
        top: 9,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF3B30',
        backgroundColor: 'rgba(255, 59, 48, 0.15)', // Liquid glass effect (transparent ring+glow)
    },
    selectedCircle: {
        position: 'absolute',
        top: 9,
        backgroundColor: '#FFFFFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayNumber: {
        fontSize: 19,
        color: '#FFFFFF',
        fontWeight: '600',
        height: 42,
        lineHeight: 42,
        textAlignVertical: 'center',
    },
    todayNumber: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dayNumberSelected: {
        color: '#000000',
        fontWeight: '700',
    },
    weekendDayText: {
        color: '#FFFFFF',
    },
    eventLabels: {
        width: '100%',
        alignItems: 'center',
        marginTop: 7, // Reverted to 7 for better spacing
        gap: 1, // Reverted to 1
    },
    eventPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 4, // Increased to 4
        borderRadius: 8,
        width: '90%',
        minHeight: 20, // Increased
    },
    eventDotMini: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 4,
    },
    eventText: {
        fontSize: 12, // Increased to 12
        color: '#FFFFFF',
        fontWeight: '600',
        textAlign: 'left',
    },
    moreEvents: {
        fontSize: 9,
        color: '#8E8E93',
        fontWeight: '500',
    },
    timelineContainer: {
        position: 'absolute',
        top: 60, // DAY_VIEW_HEIGHT
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 5, // 0'dan 5'e yükseltildi
    },

    timelinePane: {
        width: SCREEN_WIDTH,
        flex: 1,
    },
    daySeparator: {
        height: 1,
        backgroundColor: '#333',
        width: '100%',
    },
    timeSlot: {
        height: SLOT_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timeText: {
        width: 50,
        textAlign: 'center',
        fontSize: 11,
        color: '#8E8E93',
        marginTop: -10, // Reverted for original SLOT_HEIGHT
        fontWeight: '600',
    },
    timeLine: {
        width: 0,
        height: 0,
    },
    slotContent: {
        flex: 1,
        paddingHorizontal: 8,
    },
    timelineCard: {
        borderRadius: 6,
        padding: 6,
        borderLeftWidth: 3,
        marginBottom: 2,
    },
    timelineCardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    timelineCardTime: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 2,
    },
    currentTimeContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    currentTimeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        marginLeft: 55,
    },
    currentTimeLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#FF3B30',
    },
    currentTimeLabel: {
        position: 'absolute',
        left: 2,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    currentTimeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Multi Day and List Styles
    multiDayHeaderRow: {
        flexDirection: 'row',
        paddingLeft: 50,
        backgroundColor: '#000',
        borderBottomWidth: 0.5,
        borderBottomColor: '#2C2C2E',
    },
    multiDayHeaderColumn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderLeftWidth: 0.5,
        borderLeftColor: '#2C2C2E',
    },
    multiDayHeaderText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    listItem: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    listItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    listItemTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
    },
    listItemTime: {
        fontSize: 14,
        color: '#8E8E93',
    },
    listItemTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    listItemTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    emptyListContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyListText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
    },
    navIconSeparator: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    yearPickerContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    yearHeader: {
        paddingHorizontal: 8,
        paddingTop: 60,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    yearTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FF3B30',
    },
    yearScroll: {
        flex: 1,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 4,
    },
    miniMonth: {
        width: '33.33%',
        padding: 4,
        marginBottom: 16,
    },
    miniMonthName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 4,
    },
    miniGrid: {
        gap: 1,
    },
    miniWeek: {
        flexDirection: 'row',
        gap: 1,
    },
    miniDay: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniDayText: {
        fontSize: 9,
        color: '#FFFFFF',
    },
    miniDaySelected: {
        color: '#FFFFFF',
    },
    miniTodayCircle: {
        backgroundColor: '#FF3B30',
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center'
    },
    miniSelectedCircle: {
        backgroundColor: '#FFFFFF',
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center'
    },
    miniDayTodayText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 8
    },
    miniDaySelectedText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 8
    },
    yearBottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 32,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#2C2C2E',
    },
});

// Event Detail Modal Styles
const eventDetailStyles = StyleSheet.create({
    goalMenuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    goalMenuAnimatedWrapper: {
        position: 'absolute',
        zIndex: 1000,
    },
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    swipeZone: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 50,
        zIndex: 999,
        backgroundColor: 'transparent',
    },
    dragArea: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 30,
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 12,
    },
    circularIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        gap: 4,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    eventTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 2,
    },
    timeText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 20,
    },
    timelineContainer: {
        // Clean timeline without container - matches daily view style
        backgroundColor: 'transparent',
        paddingTop: 24,
        paddingHorizontal: 0,
        paddingBottom: 16,
        marginBottom: 16,
        position: 'relative',
    },
    hourRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    hourLabel: {
        width: 50,
        fontSize: 12,
        color: '#8E8E93',
    },
    hourSeparator: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 10,
        marginTop: 8,
    },
    eventBlock: {
        borderRadius: 6,
        padding: 10,
        zIndex: 1,
    },
    eventBlockTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    eventBlockTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventBlockTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
    // Updated Settings Styles
    settingsButtonsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    settingButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 17,
        color: '#FFF',
    },
    settingValue: {
        fontSize: 17,
        color: '#8E8E93',
    },
    settingSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 0,
        width: '100%',
    },
    // New Workout Section Styles
    workoutsSection: {
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    seeAllText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    workoutGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    workoutCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
    },
    cardIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
    workoutSection: {
        // Legacy style, kept just in case but replaced content above
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    workoutSectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 16,
    },

    deleteButtonContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        minHeight: 48,
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    alertPickerContainer: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: 400,
    },
    alertPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    alertPickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    alertPickerDone: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '500',
    },
    alertPickerList: {
        paddingBottom: 34,
    },
    alertOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    alertOptionSelected: {
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    alertOptionText: {
        fontSize: 16,
        color: '#FFF',
    },
    alertOptionTextSelected: {
        color: '#007AFF',
    },
    // Delete Modal Styles
    deleteModalContent: {
        backgroundColor: '#2C2C2E',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 24,
        marginBottom: 100,
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    deleteModalTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    deleteModalButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    deleteModalButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelModalButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cancelModalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Edit Modal Styles
    editModalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 100,
    },
    editModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    editModalHeaderButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    editModalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    editModalContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    editCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    editLabel: {
        color: '#FFF',
        fontSize: 16,
    },
    editValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editValue: {
        color: '#8E8E93',
        fontSize: 16,
        marginRight: 4,
    },
    editSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 16,
    },
    editPickerContainer: {
        overflow: 'hidden',
    },
    editPicker: {
        width: '100%',
        height: 180,
    },
    editPickerItem: {
        color: '#FFF',
        fontSize: 18,
    },
    editTextInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    editTextInputLabel: {
        color: '#8E8E93',
        fontSize: 16,
        width: 60,
    },
    editTextInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingVertical: 0,
    },
    editNotesInput: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
});

// Workout Day Picker Modal Styles
const workoutDayPickerStyles = StyleSheet.create({
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1002,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: (SCREEN_HEIGHT * 0.7) - 50,
        paddingBottom: 40,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#666',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(157, 236, 44, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    dateSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    dateText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFF',
    },
    dateSubtext: {
        fontSize: 15,
        color: '#8E8E93',
        marginTop: 4,
    },
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.45,
    },
    gridContainer: {
        padding: 16,
        gap: 12,
    },
    dayCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayCardColor: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 14,
    },
    dayCardText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFF',
        flex: 1,
    },
    checkmarkContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(157, 236, 44, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// Create Event Modal Styles
const createEventStyles = StyleSheet.create({
    fullScreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        marginHorizontal: 0,
        marginTop: 110, // Reduced height by 50px (was 60)
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
    },
    dragHandleArea: {
        paddingTop: 12,
        paddingBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dragHandle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    circularIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    circularAddButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#3A3A3C',
        borderRadius: 16,
        padding: 3,
        marginBottom: 16,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#636366',
    },
    toggleText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    toggleTextActive: {
        color: '#FFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    inputCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 24,
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    cardExpanded: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginBottom: 0,
    },
    titleInput: {
        fontSize: 17,
        color: '#FFF',
        paddingVertical: 14,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    rowLabel: {
        fontSize: 16,
        color: '#FFF',
    },
    rowValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rowValue: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    activeRowValue: {
        color: '#FFFFFF',
    },
    pickerWrapper: {
        backgroundColor: '#3A3A3C',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    pickerItem: {
        color: '#FFF',
        fontSize: 20,
    },
    dateTimeCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        marginBottom: 12,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    dateTimeLabel: {
        fontSize: 16,
        color: '#FFF',
    },
    dateTimeValues: {
        flexDirection: 'row',
        gap: 8,
    },
    datePill: {
        backgroundColor: 'rgba(120,120,128,0.24)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    datePillText: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    timePill: {
        backgroundColor: 'rgba(120,120,128,0.24)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    timePillActive: {
        backgroundColor: 'rgba(255,149,0,0.3)',
    },
    timePillText: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    pillActive: {
        backgroundColor: 'rgba(0,122,255,0.3)',
    },
    pillTextActive: {
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#48484A',
        marginLeft: 0,
    },
    inlinePicker: {
        overflow: 'hidden',
    },
    calendarContainer: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 12,
    },
    monthNavText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    weekdayHeader: {
        flexDirection: 'row',
        paddingBottom: 8,
    },
    weekdayText: {
        width: CREATE_EVENT_DAY_WIDTH,
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
    },
    weekendHeaderText: {
        color: '#666',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: CREATE_EVENT_DAY_WIDTH,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDayNumber: {
        backgroundColor: '#FF3B30',
    },
    todayDayNumber: {
        backgroundColor: 'rgba(255,59,48,0.3)',
    },
    dayText: {
        fontSize: 15,
        color: '#FFF',
    },
    selectedDayText: {
        color: '#FFF',
        fontWeight: '600',
    },
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFF',
        marginHorizontal: 4,
    },
    addEventButton: {
        position: 'absolute',
        bottom: 34,
        left: 16,
        right: 16,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    goalButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalButtonInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: MetricColors.energy,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalMenuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    goalMenuAnimatedWrapper: {
        position: 'absolute',
        zIndex: 100,
    },
    addEventButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
