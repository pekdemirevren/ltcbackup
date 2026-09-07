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
    runOnUI,
    SharedValue,
    useAnimatedScrollHandler,
    FadeInRight,
    SlideInUp,
    withDelay,
    cancelAnimation,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlassCard, LiquidGlassMenuItem } from './LiquidGlass';
import { WORKOUT_DAY_COLORS, WorkoutDayType, loadWorkoutDayCards, setWorkoutDayForDate, getWorkoutDayForDate, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';
import RNCalendarEvents from 'react-native-calendar-events';
import { TimerContext } from '../contexts/TimerContext';
import YearCalendarModal from './YearCalendarModal';
import Theme, { colors } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allWorkouts, Workout } from '../constants/workoutData';
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
    COLLAPSE_DURATION: 350,  // iOS Calendar Style
    TIMELINE_DURATION: 300,
    FADE_DURATION: 250,
    SPRING_CONFIG: {
        damping: 28,      // Softer bounce
        stiffness: 180,   // Quicker start
        mass: 1,
        overshootClamping: false
    },
    EASING: Easing.bezier(0.25, 0.46, 0.45, 0.94), // iOS easeOutQuad
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
    selectedWeekInitialY: SharedValue<number>;
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
}: DayCellProps) => {
    if (!day) return <View style={styles.dayCell} />;

    const today = isToday && (!hasSelectedDayInWeek || isSelected);
    const isTodayHidden = isToday && !today;

    // Pre-calculate timestamp for midnight on JS thread to avoid WorkletsError with Date objects
    const dayTimestamp = useMemo(() => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }, [day]);

    // ✅ SELECTION LOGIC - REACTIVE TO UI THREAD
    // Combined logic into useAnimatedStyle to avoid "Reading from value during render" warnings from useDerivedValue
    const selectionStyle = useAnimatedStyle(() => {
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        const isSelectedWeek = isCollapsed
            ? true
            : Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;

        const selected = isSelectedTimestamp && isSelectedWeek;
        const opacity = (selected && !today) ? selectionAnim.value : 0;
        const scale = selected ? (selectionAnim.value > 0.7 ? 1 : 0.85) : 0.3;

        return {
            opacity,
            transform: [{ scale }],
        };
    });

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
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        return { opacity: isSelectedTimestamp ? 1 : 0 };
    }, [dayTimestamp]);

    // Text color logic for today and selection
    const dayTextProps = useAnimatedStyle(() => {
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
    }, [today, isTodayHidden, dayIdx, dayTimestamp]);

    return (
        <TouchableOpacity
            style={styles.dayCell}
            onPress={() => !isAdjacent && handleDayPress(day)}
            onLongPress={() => !isAdjacent && day && onCreateEvent && onCreateEvent(day)}
            delayLongPress={800}
            activeOpacity={0.6}
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
                {day instanceof Date ? day.getDate() : new Date(day).getDate()}
            </Animated.Text>

            {
                eventOpacity && (
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
                )
            }
        </TouchableOpacity >
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
    selectedWeekInitialY,
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

        const progress = interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [0, 1], // 0: Day, 1: Month
            'clamp'
        );

        // Ay görünümünde satırları kilitle (Stabilite Fix)
        // progress > 0.98 ise tamamen düz çiz, hesaplama hatalarını engelle
        if (progress > 0.98) {
            return {
                opacity: 1,
                transform: [{ translateY: 0 }],
                zIndex: 1,
            };
        }

        // Collapse Progress: 0=Month, 1=Day
        const collapseT = 1 - progress;

        const thisRowOffset = globalWeekIdx * WEEK_ROW_HEIGHT;
        const currentScroll = scrollY.value;
        const thisRowScreenY = thisRowOffset - currentScroll;
        const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;

        if (isSelectedWeek) {
            // Month grid row STAYS PUT, just fades out quickly
            // Overlay (weekContainer) takes over the movement
            const opacity = interpolate(
                progress,
                [0.95, 1], // Fade out INSTANTLY when collapse starts
                [0, 1],
                'clamp'
            );

            return {
                opacity,
                transform: [{ translateY: 0 }], // No movement
                zIndex: 100,
            };
        }

        // Non-Selected Rows: Push completely off-screen
        const relativeIndex = globalWeekIdx - selectedWeekIdx.value;
        const isAbove = relativeIndex < 0;

        // No stagger - move all rows at same speed as selected row
        // collapseT goes 0 (Month) -> 1 (Day/Collapsed)
        // We want opacity to fade out near end: interpolate(collapseT, [0, 0.85, 1], [1, 1, 0])

        const EXTRA = 40; // Buffer distance

        // Calculate target offscreen position relative to current position
        // If above: move UP until bottom is clear
        // If below: move DOWN until top is clear
        const targetOffscreen = isAbove
            ? -(thisRowScreenY + WEEK_ROW_HEIGHT + EXTRA) // Push Up
            : (SCREEN_HEIGHT - thisRowScreenY + EXTRA);   // Push Down

        return {
            opacity: interpolate(collapseT, [0, 0.85, 1], [1, 1, 0], 'clamp'),
            transform: [{ translateY: targetOffscreen * collapseT }],
            zIndex: 1,
        };
    }, [globalWeekIdx, selectedWeekIdx, scrollY, calendarHeight, weekTimestamp, selectedWeekTimestamp, selectedWeekInitialY]);


    // Calculate connected pill for Multi Day mode
    return (
        <Animated.View
            style={[
                {
                    flexDirection: 'row',
                    // height: WEEK_ROW_HEIGHT, // REMOVED - Controlled by Animated Style or fixed?
                    // User asked to animate height or use scaleY.
                    // Let's stick to standard height for now but allow overflow hidden on ROW level
                    alignItems: 'flex-start',
                    paddingHorizontal: 0,
                    overflow: 'hidden', // Clip content at row level
                },
                {
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
                    const dayEvents = getEventsForDate(day, events);
                    const workout = getWorkoutForDate(day, schedule);

                    return (
                        <DayCell
                            key={day ? (day instanceof Date ? day.toISOString() : new Date(day).toISOString()) : `empty-${dayIdx}`}
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
                        />
                    );
                })
            }
        </Animated.View >
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
}

// Helper function to calculate event duration in minutes
const getEventDuration = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
};

// Helper function to get minutes offset within an hour
const getMinutesOffset = (time: string): number => {
    const [, minutes] = time.split(':').map(Number);
    return minutes;
};

const SLOT_HEIGHT = 50; // Height per hour slot in pixels

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
}

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
}: TimeSlotContentProps) => {
    const slotEvents = dayEvents.filter(event => {
        const eventStartHour = event.startTime ? parseInt(event.startTime.split(':')[0]) : -1;
        return eventStartHour === hour && event.startTime && event.endTime;
    });

    // Check if workout exists at this hour (workout shows at hour 9)
    const hasWorkoutAtThisHour = hour === 9 && !!workout;

    // Total items at this slot (workout + events)
    const totalItems = (hasWorkoutAtThisHour ? 1 : 0) + slotEvents.length;
    const itemWidth = totalItems > 0 ? availableWidth / totalItems : availableWidth;

    const hasEvents = totalItems > 0;

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
                style={[styles.slotContent, { height: SLOT_HEIGHT }]}
                onPress={() => {
                    const dateWithTime = new Date(date);
                    dateWithTime.setHours(hour, 0, 0, 0);
                    if (onNavigateToDailyDetail) onNavigateToDailyDetail(dateWithTime);
                }}
                onLongPress={() => {
                    const dateWithTime = new Date(date);
                    dateWithTime.setHours(hour, 0, 0, 0);
                    if (onCreateEvent) onCreateEvent(dateWithTime);
                }}
                delayLongPress={800}
                activeOpacity={hasEvents ? 1 : 0.7}
            />

            {/* Render workout card at hour 9 as first item */}
            {hasWorkoutAtThisHour && (
                <TouchableOpacity
                    style={[
                        styles.timelineCard,
                        {
                            position: 'absolute',
                            top: 0,
                            left: leftOffsetBase,
                            width: itemWidth - 4,
                            height: SLOT_HEIGHT - 4,
                            zIndex: 10,
                            backgroundColor: (WORKOUT_DAY_COLORS as any)[workout] + '20',
                            borderLeftColor: (WORKOUT_DAY_COLORS as any)[workout]
                        }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onWorkoutDayPress && onWorkoutDayPress(date, workout)}
                >
                    <Text style={[styles.timelineCardTitle, { color: (WORKOUT_DAY_COLORS as any)[workout] }]} numberOfLines={1}>{workout}</Text>
                    <Text style={styles.timelineCardTime}>All day</Text>
                </TouchableOpacity>
            )}

            {/* Render events, offset by 1 if workout exists */}
            {slotEvents.map((event, index) => {
                const durationMinutes = getEventDuration(event.startTime as string, event.endTime as string);
                const minutesOffset = getMinutesOffset(event.startTime as string);
                const eventHeight = Math.max(30, (durationMinutes / 60) * SLOT_HEIGHT);
                const topOffset = (minutesOffset / 60) * SLOT_HEIGHT;

                // If workout exists at this hour, events start from index 1
                const itemIndex = hasWorkoutAtThisHour ? index + 1 : index;
                const leftOffset = leftOffsetBase + (itemIndex * itemWidth);

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
                        <Text style={[styles.timelineCardTitle, { color: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#FFF' }]} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.timelineCardTime} numberOfLines={1}>{event.startTime} - {event.endTime}</Text>
                    </TouchableOpacity>
                );
            })}
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
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate || new Date());
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const [daySubMode, setDaySubMode] = useState<DaySubMode>('single');
    const [multiDayStartDate, setMultiDayStartDate] = useState<Date>(new Date(selectedDate));
    // iOS-style 2-day selection range
    const [multiDayEndDate, setMultiDayEndDate] = useState<Date>(() => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [visibleDayIndex, setVisibleDayIndex] = useState<number>(50);
    const [showYearPicker, setShowYearPicker] = useState(false);
    // Sync initial collapsed state with view mode
    const initialCollapsed = initialViewMode !== 'month';
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [showYearModal, setShowYearModal] = useState(false);

    // Event Detail State (Full Screen with slide animation)
    const [showEventDetail, setShowEventDetail] = useState(false);
    const [selectedEventForDetail, setSelectedEventForDetail] = useState<Event | null>(null);
    const [eventDetailWorkouts, setEventDetailWorkouts] = useState<Workout[]>([]);
    const [showAlertPicker, setShowAlertPicker] = useState(false);
    const [showSecondAlertPicker, setShowSecondAlertPicker] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Navigation hook as fallback
    const navigationHook = useNavigation<StackNavigationProp<RootStackParamList>>();
    const nav = navigation || navigationHook;

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
    const viewMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Create Event animation refs (using React Native Animated for picker heights)
    const dateTimePickerHeight = useRef(new RNAnimated.Value(0)).current;
    const workoutPickerHeight = useRef(new RNAnimated.Value(0)).current;
    const createEventSlideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;

    // Ref for title input auto-focus
    const titleInputRef = useRef<TextInput>(null);

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

    // Update state when props change (for navigating back from event detail)
    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    useEffect(() => {
        if (initialSelectedDate) {
            const d = new Date(initialSelectedDate);
            setSelectedDate(d);
            setCurrentMonth(d);
        }
    }, [initialSelectedDate]);

    // Calendar logic
    const formatDateKey = (date: Date): string => {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'invalid-date';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDaysInMonth = (date: Date) => {
        const safeDate = typeof date.getFullYear === 'function' ? date : new Date(date);
        if (isNaN(safeDate.getTime())) return [];

        const year = safeDate.getFullYear();
        const month = safeDate.getMonth();
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
        // Safeguard: Ensure centerDate is a Date object (handling strings/timestamps from runOnJS)
        // Check if getDay exists, if not try to convert
        const safeCenterDate = typeof centerDate.getDay === 'function' ? centerDate : new Date(centerDate);
        // Valid date check
        if (isNaN(safeCenterDate.getTime())) return Array(7).fill(null);

        const days: (Date | null)[] = [];
        const dayOfWeek = safeCenterDate.getDay();
        const monday = new Date(safeCenterDate);
        monday.setDate(safeCenterDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const days = useMemo(() => {
        const safeMonth = typeof currentMonth.getFullYear === 'function' ? currentMonth : new Date(currentMonth);
        return getDaysInMonth(safeMonth);
    }, [currentMonth]);
    const prevMonthDays = useMemo(() => {
        const safeMonth = typeof currentMonth.getFullYear === 'function' ? currentMonth : new Date(currentMonth);
        const prev = new Date(safeMonth);
        prev.setMonth(safeMonth.getMonth() - 1);
        return getDaysInMonth(prev);
    }, [currentMonth]);
    const nextMonthDays = useMemo(() => {
        const safeMonth = typeof currentMonth.getFullYear === 'function' ? currentMonth : new Date(currentMonth);
        const next = new Date(safeMonth);
        next.setMonth(safeMonth.getMonth() + 1);
        return getDaysInMonth(next);
    }, [currentMonth]);

    const weekDays = useMemo(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        return getWeekDays(safeDate);
    }, [selectedDate]);
    const prevWeekDays = useMemo(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const prev = new Date(safeDate);
        prev.setDate(safeDate.getDate() - 7);
        return getWeekDays(prev);
    }, [selectedDate]);
    const nextWeekDays = useMemo(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const next = new Date(safeDate);
        next.setDate(safeDate.getDate() + 7);
        return getWeekDays(next);
    }, [selectedDate]);

    const getWeeksFromDays = (d: (Date | null)[]) => {
        const w = [];
        for (let i = 0; i < d.length; i += 7) {
            w.push(d.slice(i, i + 7));
        }
        return w;
    };

    const weeks = useMemo(() => getWeeksFromDays(days), [days]);
    const prevMonthWeeks = useMemo(() => getWeeksFromDays(prevMonthDays), [prevMonthDays]);
    const nextMonthWeeks = useMemo(() => getWeeksFromDays(nextMonthDays), [nextMonthDays]);




    // Helper for safe date timestamp (prevents state mutation & handles invalid dates)
    // Helper for safe date timestamp (prevents state mutation & handles invalid dates)
    const midnightTs = (d: any) => {
        const copy = d instanceof Date ? new Date(d) : new Date(d ?? Date.now());
        if (isNaN(copy.getTime())) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return now.getTime();
        }
        copy.setHours(0, 0, 0, 0);
        return copy.getTime();
    };

    const getWeekStartTs = (date: Date | string | number) => {
        'worklet';
        const d = new Date(date);
        if (isNaN(d.getTime())) return 0;
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Monday start
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    // ═══════════════════════════════════════════════════════
    // V2 ARCHITECTURE: SINGLE TRUTH DRIVER
    // ═══════════════════════════════════════════════════════
    // 0 = Day View (Collapsed)
    // 1 = Month View (Expanded)
    const collapseProgress = useSharedValue(initialCollapsed ? 0 : 1);

    // Derived values
    // Snapshot for selected week Y position at the moment of collapse
    const selectedWeekInitialY = useSharedValue(0);

    // ✅ UTILITY: Safe Date objects for render/memo logic (prevents crash on serialized string/undefined)
    const safeSelectedDate = useMemo(() => {
        if (!selectedDate) return new Date();
        const d = typeof selectedDate.getTime === 'function' ? selectedDate : new Date(selectedDate);
        // Validate for NaN
        if (isNaN(d.getTime())) return new Date();
        return d;
    }, [selectedDate]);

    const safeCurrentMonth = useMemo(() => {
        if (!currentMonth) return new Date();
        return typeof currentMonth.getTime === 'function' ? currentMonth : new Date(currentMonth);
    }, [currentMonth]);

    const safeMultiDayStartDate = useMemo(() => {
        if (!multiDayStartDate) return new Date(safeSelectedDate);
        return typeof multiDayStartDate.getTime === 'function' ? multiDayStartDate : new Date(multiDayStartDate);
    }, [multiDayStartDate, safeSelectedDate]);

    const safeCreatePickerMonth = useMemo(() => {
        if (!createPickerMonth) return new Date();
        return typeof createPickerMonth.getTime === 'function' ? createPickerMonth : new Date(createPickerMonth);
    }, [createPickerMonth]);

    const safeWorkoutDayPickerDate = useMemo(() => {
        if (!workoutDayPickerDate) return new Date();
        return typeof workoutDayPickerDate.getTime === 'function' ? workoutDayPickerDate : new Date(workoutDayPickerDate);
    }, [workoutDayPickerDate]);

    const calendarHeight = useDerivedValue(() => {
        return interpolate(
            collapseProgress.value,
            [0, 1],
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT]
        );
    });

    const monthTitleAnim = useDerivedValue(() => {
        // Fade in month title only when near fully expanded
        return interpolate(collapseProgress.value, [0.8, 1], [0, 1], 'clamp');
    });

    const timelineAnim = useDerivedValue(() => {
        // Timeline visible when collapsed (Day View), fade out when expanding
        return interpolate(collapseProgress.value, [0, 0.2], [1, 0], 'clamp');
    });

    // Manual anims (keep distinct for now as they might need staggering)
    // ✅ INIT FIX: Pre-calculate initial values to prevent "blink" on first render
    const allWeeks = useMemo(() => [...prevMonthWeeks, ...weeks, ...nextMonthWeeks], [prevMonthWeeks, weeks, nextMonthWeeks]);

    // Initial Week Index
    const initialWeekIdx = useMemo(() => {
        const selectedStr = safeSelectedDate.toDateString();
        return allWeeks.findIndex(week =>
            week.some(day => day && new Date(day).toDateString() === selectedStr)
        );
    }, [allWeeks, safeSelectedDate]);

    // Initial Week Timestamp
    const initialWeekTs = useMemo(() => {
        const copy = new Date(safeSelectedDate);
        const dayOfWeek = copy.getDay();
        const diff = copy.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        copy.setDate(diff);
        copy.setHours(0, 0, 0, 0);
        return copy.getTime();
    }, [safeSelectedDate]);

    // Initial ScrollY
    const initialMonthScrollY = useMemo(() => prevMonthWeeks.length * WEEK_ROW_HEIGHT, [prevMonthWeeks.length]);

    const selectedWeekIdx = useSharedValue(Math.max(0, initialWeekIdx));
    const selectedWeekTimestamp = useSharedValue(initialWeekTs);
    const scrollY = useSharedValue(initialMonthScrollY);
    const dateTitleAnim = useSharedValue(0); // Can be derived but used in specific anims
    const selectionAnim = useSharedValue(1);
    const selectedDateTimestamp = useSharedValue(midnightTs(safeSelectedDate));
    const multiDayEndDateTimestamp = useSharedValue(midnightTs(safeSelectedDate) + 86400000);

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

    // ✅ New refs for multi-day frozen column sync - using useAnimatedRef for Reanimated integration
    const multiDayHorizontalHeaderScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayHorizontalContentScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayVerticalTimeScrollRef = useAnimatedRef<Animated.ScrollView>();
    const multiDayVerticalContentScrollRef = useAnimatedRef<Animated.ScrollView>();

    // Pre-calculate multiDayStartDate timestamp for worklet usage
    const multiDayStartDateTimestamp = useMemo(() => {
        const safeStart = typeof multiDayStartDate.getTime === 'function' ? multiDayStartDate : new Date(multiDayStartDate);
        return safeStart.getTime();
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


    // Initial scroll setup
    useEffect(() => {
        if (!isCollapsed && monthScrollViewRef.current) {
            const prevWeeksCount = prevMonthWeeks.length;
            monthScrollViewRef.current.scrollTo({ y: prevWeeksCount * WEEK_ROW_HEIGHT, animated: false });
        }
    }, [isCollapsed, prevMonthWeeks]);


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
        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === safeSelectedDate.toDateString();
            })
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
    }, [selectedDate, weeks, prevMonthWeeks, nextMonthWeeks]);

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
        const safeMonth = typeof currentMonth.getMonth === 'function' ? currentMonth : new Date(currentMonth);
        const next = new Date(safeMonth);
        next.setMonth(safeMonth.getMonth() + 1);
        setCurrentMonth(next);
    }, [currentMonth]);

    const handlePrevMonth = useCallback(() => {
        const safeMonth = typeof currentMonth.getMonth === 'function' ? currentMonth : new Date(currentMonth);
        const prev = new Date(safeMonth);
        prev.setMonth(safeMonth.getMonth() - 1);
        setCurrentMonth(prev);
    }, [currentMonth]);

    const handleNextDay = useCallback(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const next = new Date(safeDate);
        next.setDate(safeDate.getDate() + 1);
        setSelectedDate(next);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const nextStr = next.toDateString();
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === nextStr;
            })
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handlePrevDay = useCallback(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const prev = new Date(safeDate);
        prev.setDate(safeDate.getDate() - 1);
        setSelectedDate(prev);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const prevStr = prev.toDateString();
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === prevStr;
            })
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handleNextWeek = useCallback(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const next = new Date(safeDate);
        next.setDate(safeDate.getDate() + 7);
        const nextEndDate = new Date(next);
        nextEndDate.setDate(next.getDate() + 1);
        setSelectedDate(next);
        setMultiDayEndDate(nextEndDate);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const nextStr = next.toDateString();
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === nextStr;
            })
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handlePrevWeek = useCallback(() => {
        const safeDate = typeof selectedDate.getDate === 'function' ? selectedDate : new Date(selectedDate);
        const prev = new Date(safeDate);
        prev.setDate(safeDate.getDate() - 7);
        const prevEndDate = new Date(prev);
        prevEndDate.setDate(prev.getDate() + 1);
        setSelectedDate(prev);
        setMultiDayEndDate(prevEndDate);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const prevStr = prev.toDateString();
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === prevStr;
            })
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handleMonthScroll = (e: any) => { };
    const handleMonthScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.y;
        const weekIndex = Math.round(offset / WEEK_ROW_HEIGHT);

        const currentPrevWeeksCount = prevMonthWeeks.length;
        const currentWeeksCount = weeks.length;

        // Handle infinite scroll to prev/next month
        if (weekIndex < currentPrevWeeksCount) {
            const safeMonth = typeof currentMonth.getFullYear === 'function' ? currentMonth : new Date(currentMonth);
            const prevDate = new Date(safeMonth.getFullYear(), safeMonth.getMonth() - 1, 1);
            const targetPrevDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
            const newPrevWeeksCount = getWeeksFromDays(getDaysInMonth(targetPrevDate)).length;

            handlePrevMonth();

            requestAnimationFrame(() => {
                monthScrollViewRef.current?.scrollTo({
                    y: (newPrevWeeksCount + weekIndex) * WEEK_ROW_HEIGHT,
                    animated: false
                });
            });
        } else if (weekIndex >= currentPrevWeeksCount + currentWeeksCount) {
            handleNextMonth();

            requestAnimationFrame(() => {
                monthScrollViewRef.current?.scrollTo({
                    y: (currentWeeksCount + (weekIndex - currentPrevWeeksCount - currentWeeksCount)) * WEEK_ROW_HEIGHT,
                    animated: false
                });
            });
        }
    };

    const handleWeekScrollEnd = useCallback((e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);

        if (page === 0) {
            // Selection'ı görünür tut
            cancelAnimation(selectionAnim);
            selectionAnim.value = 1;
            handlePrevWeek();
            requestAnimationFrame(() => {
                weekScrollViewRef.current?.scrollTo({ x: width, animated: false });
            });
        } else if (page === 2) {
            // Selection'ı görünür tut
            cancelAnimation(selectionAnim);
            selectionAnim.value = 1;
            handleNextWeek();
            requestAnimationFrame(() => {
                weekScrollViewRef.current?.scrollTo({ x: width, animated: false });
            });
        }
    }, [handlePrevWeek, handleNextWeek, selectionAnim]);

    const handleTimelineScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);

        if (page === 0) {
            // Selection'ı görünür tut
            cancelAnimation(selectionAnim);
            selectionAnim.value = 1;
            handlePrevDay();
            timelineHorizontalScrollViewRef.current?.scrollTo({ x: width, animated: false });
        } else if (page === 2) {
            // Selection'ı görünür tut
            cancelAnimation(selectionAnim);
            selectionAnim.value = 1;
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

    // Pan gesture handler - DRIVES collapseProgress
    const panGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((e, sm) => {
            'worklet';
            sm.begin();
        })
        .onTouchesMove((e, sm) => {
            'worklet';
            // Disable pan in timeline area while in Day View (collapsed)
            // Allow touches to pass through to ScrollView
            const isDayView = calendarHeight.value < (DAY_VIEW_HEIGHT + 20);
            const y = e.changedTouches[0].y;
            const TIMELINE_START_Y = 130;  // Approx header (50) + weekrow (60) + margins

            if (isDayView && y > TIMELINE_START_Y) {
                sm.fail();
            } else {
                sm.activate();
            }
        })
        .onUpdate((event) => {
            'worklet';
            const { translationY } = event;
            const maxDist = MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT;
            const progressDelta = translationY / maxDist;

            // Normalize delta logic
            // Expand (Drag Down, +Y): Increases progress (0->1)
            // Collapse (Drag Up, -Y): Decreases progress (1->0)

            // Base progress depends on current state
            // If isCollapsed (Day View, 0): base = 0.
            // If Expanded (Month View, 1): base = 1.

            let newProgress = 0;
            if (isCollapsed) {
                // Starting from 0, add delta
                newProgress = 0 + progressDelta;
            } else {
                // Starting from 1, add delta (delta is negative for drag up)
                newProgress = 1 + progressDelta;
            }

            // Clamp and Rubberband
            if (newProgress < 0) {
                newProgress = 0 + newProgress * 0.2; // Rubberband bottom
            } else if (newProgress > 1) {
                newProgress = 1 + (newProgress - 1) * 0.2; // Rubberband top
            }

            collapseProgress.value = newProgress;
            // Ensure derived values update
        })
        .onEnd((event) => {
            'worklet';
            const { velocityY } = event;

            // Thresholds
            const currentP = collapseProgress.value;
            const isFlungDown = velocityY > 500;
            const isFlungUp = velocityY < -500;

            let target = 0; // Default to collapse

            if (isCollapsed) {
                // We were collapsed.
                // Go to 1 if: Flung Down OR dragged > 30%
                if (isFlungDown || currentP > 0.3) {
                    target = 1;
                } else {
                    target = 0;
                }
            } else {
                // We were expanded.
                // Go to 0 if: Flung Up OR dragged < 70%
                if (isFlungUp || currentP < 0.7) {
                    target = 0;
                } else {
                    target = 1;
                }
            }

            // Animate
            collapseProgress.value = withSpring(target, {
                damping: 28,
                stiffness: 180,
                velocity: velocityY / (MONTH_VIEW_HEIGHT - DAY_VIEW_HEIGHT), // Normalized velocity
            });
        });



    // Unified isCollapsed state management prevents race conditions
    useAnimatedReaction(
        () => calendarHeight.value <= DAY_VIEW_HEIGHT + 0.5,
        (collapsed, prev) => {
            if (collapsed !== prev) {
                runOnJS(setIsCollapsed)(collapsed);
            }
        }
    );

    // Clear overlay when animation completes
    useAnimatedReaction(
        () => collapseProgress.value,
        (progress, prev) => {
            // Animasyon tamamlandığında (veya çok yaklaştığında) overlay'i temizle
            if (prev !== null && Math.abs(progress - 0) < 0.01 && Math.abs(prev - progress) > 0.01) {
                // Day view'a tamamen geçildi, overlay artık gerekli değil
                runOnJS(setOverlayWeek)([]);
            }
        }
    );




    // Animated styles
    const cardStyle = useAnimatedStyle(() => {
        'worklet';
        const progress = interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [0, 1],
            'clamp'
        );

        const scaleMultiplier = MONTH_VIEW_HEIGHT / DAY_VIEW_HEIGHT;

        return {
            height: SCREEN_HEIGHT, // Keep fixed height, we animate transform
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: Platform.OS === 'ios' ? 50 : 20,
            // ✅ TRANSFORM ONLY - Velocity aware via calendarHeight spring
            // Using logic: At progress 0 (Day), we might want to scale down OR just translate
            // But per request: "Transform-Only Animation" for the container.
            // Let's implement the scale on MonthGrid essentially or the container if appropriate.
            // For now, retaining standard styles but ensuring we don't animate HEIGHT layout property here.
            transform: [
                // Currently we rely on calendarHeight driving internal components
                // If we want to scale the whole card, we would do it here.
                // But since internal components (weeks) animate independently,
                // scaling the parent might distort them?
                // User requested "Transform-Only Animation" for the container.
                // Let's implement the scale on MonthGrid essentially or the container if appropriate.
                // For now, retaining standard styles but ensuring we don't animate HEIGHT layout property here.
            ],
        };
    });

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

    const timelineStyle = useAnimatedStyle(() => ({
        opacity: timelineAnim.value,
        zIndex: 0,
        transform: [{
            translateY: interpolate(
                timelineAnim.value,
                [0, 1],
                [60, 0], // ✅ Daha az translateY = daha smooth
                // 4th argument (extrapolate) defaults to extend, removing invalid easing object
            )
        }],
    }));


    const weekContainerStyle = useAnimatedStyle(() => {
        const progress = interpolate(calendarHeight.value, DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT, 0, 1, 'clamp');

        // VISIBILITY: Only visible in Day View (and very end of collapse)
        // Fades in when almost fully collapsed
        const opacity = interpolate(progress, [0.05, 0], [0, 1], 'clamp');

        return {
            opacity,
            zIndex: 30,
            transform: [{ translateY: 0 }], // Static at top
            display: 'flex',
        };
    });


    // OVERLAY for Month->Day transition (SEPARATE from weekContainer which is for Day view ribbon)
    const overlayContainerStyle = useAnimatedStyle(() => {
        const progress = interpolate(calendarHeight.value, DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT, 0, 1, 'clamp');
        // progress: 1=month (expanded), 0=day (collapsed)

        // VISIBILITY: Visible during transition, hides at very end (handover to WeekContainer)
        // Month(1) -> 0.05: Opacity 1 (if active) -- wait, we want fade in at start
        // Start (1): Opacity 0
        // Start+ (0.95): Opacity 1
        // End- (0.05): Opacity 1
        // End (0): Opacity 0 (Handover)
        const opacity = interpolate(progress, [1, 0.95, 0.05, 0], [0, 1, 1, 0], 'clamp');

        // TranslateY: From snapshot position to 0
        const translateY = interpolate(progress, [1, 0], [selectedWeekInitialY.value, 0], 'clamp');

        return {
            opacity,
            transform: [{ translateY }],
        };
    });


    const monthGridStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: 1,
            // Canvas MUST NOT be clipped for rows to slide out
            // height: calendarHeight.value,   // REMOVED
            // overflow: 'hidden',             // REMOVED
            zIndex: 10,
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
        scrollY.value = prevMonthWeeks.length * WEEK_ROW_HEIGHT;
    }, [prevMonthWeeks, scrollY]);

    const isToday = useCallback((date: Date | null | string) => {
        if (!date) return false;
        const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    }, []);

    const isSelected = useCallback((date: Date | null | string, selected: Date | null | string) => {
        if (!date || !selected) return false;
        const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
        const s = typeof selected === 'object' && selected instanceof Date ? selected : new Date(selected);
        if (isNaN(d.getTime()) || isNaN(s.getTime())) return false;
        return d.toDateString() === s.toDateString();
    }, []);

    const getEventsForDate = useCallback((date: Date | null | string, allEvents: any[]) => {
        if (!date) return [];
        const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return [];
        const dateKey = formatDateKey(d);
        return allEvents.filter(e => {
            const eventDateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            return eventDateStr === dateKey;
        });
    }, []);

    const getWorkoutForDate = useCallback((date: Date | null, sched: any) => {
        if (!date) return null;
        const d = date instanceof Date ? date : new Date(date);
        const dateKey = formatDateKey(d);
        return sched[dateKey] || null;
    }, []);

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

    // Event Detail Modal States for Liquid Glass Menus
    const [showCalendarMenu, setShowCalendarMenu] = useState(false);
    const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
    const [calendarMenuPosition, setCalendarMenuPosition] = useState({ top: 0, right: 20 });
    const calendarButtonRef = useRef<View>(null);
    const calendarMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Calendar Data States
    const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>([]);
    const [calendarPermission, setCalendarPermission] = useState<boolean>(false);
    const [loadingCalendars, setLoadingCalendars] = useState<boolean>(false);

    // Workout Cards State
    const [workoutCards, setWorkoutCards] = useState<Workout[]>([]);
    const [overlayWeek, setOverlayWeek] = useState<(Date | null)[]>([]);

    const [showAlertMenu, setShowAlertMenu] = useState(false);
    const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
    const [alertMenuPosition, setAlertMenuPosition] = useState({ top: 0, right: 20 });
    const alertButtonRef = useRef<View>(null);
    const alertMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    const [showSecondAlertMenu, setShowSecondAlertMenu] = useState(false);
    const [isSecondAlertModalVisible, setIsSecondAlertModalVisible] = useState(false);
    const [secondAlertMenuPosition, setSecondAlertMenuPosition] = useState({ top: 0, right: 20 });
    const secondAlertButtonRef = useRef<View>(null);
    const secondAlertMenuAnimation = useRef(new RNAnimated.Value(0)).current;

    // Delete Menu Animation States (matching DailyWorkoutDetailScreen)
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

    // Delete Menu Animation Effect (matching DailyWorkoutDetailScreen)
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
        // Use logic from DailyWorkoutDetailScreen
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

    // Button Animations (match goalButton)
    const viewButtonOpacity = viewMenuAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 0],
    });
    const viewButtonScale = viewMenuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.8],
    });
    const viewButtonTranslateX = viewMenuAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -200],
    });



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
        const SLOT_HEIGHT = 50; // timeSlot height
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


    const lockMonthScroll = (y: number) => {
        monthScrollViewRef.current?.scrollTo({ y, animated: false });
    };

    const handleDayPress = useCallback((date: Date) => {
        'worklet';

        // STEP 1: UI THREAD UPDATES - ZERO LATENCY
        const dateMidnight = new Date(date);
        dateMidnight.setHours(0, 0, 0, 0);
        const dateTimestamp = dateMidnight.getTime();

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const dateString = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
        const weekIdx = allWeeks.findIndex((week) =>
            week.some((day) => {
                if (!day) return false;
                const d = day instanceof Date ? day : new Date(day);
                return d.toDateString() === dateString;
            })
        );

        if (weekIdx !== -1) {
            selectedDateTimestamp.value = dateTimestamp;
            selectedWeekIdx.value = weekIdx;
        }

        const dForWeek = new Date(date);
        const dayOfWeek = dForWeek.getDay();
        const diff = dForWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        dForWeek.setDate(diff);
        dForWeek.setHours(0, 0, 0, 0);
        selectedWeekTimestamp.value = dForWeek.getTime();

        // 🔴 MOST CRITICAL FIX START

        if (isCollapsed) {
            // ✅ DAY VIEW LOGIC - Immediate update (no animation needed)
            // Ayrı animasyon YOK, sadece instant state değişimi
            selectionAnim.value = 1;
            dateTitleAnim.value = 0;
            timelineAnim.value = 0;

            // JS Thread: Deferred update
            runOnJS(setSelectedDate)(date);
            if (onDayPress) runOnJS(onDayPress)(date);
            runOnJS(scrollTimelineToPosition)(dateTimestamp);
            return;
        }

        // ✅ MONTH VIEW LOGIC - SNAPSHOT BASED ANIMATION

        // 1. Calculate Target Week & Timestamp
        const weekTs = getWeekStartTs(date);
        const dayTs = new Date(date);
        dayTs.setHours(0, 0, 0, 0);

        // 2. UI Thread: Snapshot & State Sync (Zero Latency)
        // We calculate values in JS thread and pass primitives to UI thread
        // to avoid "WorkletsError: Trying to access property getTime..."
        const dayTsValue = dayTs.getTime();

        // Prepare Overlay Content (JS Thread)
        if (weekIdx !== -1) {
            const targetWeek = allWeeks[weekIdx];
            if (targetWeek) {
                runOnJS(setOverlayWeek)(targetWeek);
            }
        }

        // Immediate State Update for Zero Latency
        runOnJS(setSelectedDate)(date);

        runOnUI(() => {
            selectedDateTimestamp.value = dayTsValue;

            if (weekIdx >= 0) {
                selectedWeekIdx.value = weekIdx;
                selectedWeekTimestamp.value = weekTs;

                // SNAPSHOT FIX: Explicitly calculate screen Y position
                const globalWeekIdx = weekIdx; // weakIdx is already global index in allWeeks
                const thisRowOffset = globalWeekIdx * WEEK_ROW_HEIGHT;
                const currentScroll = scrollY.value;
                const thisRowScreenY = thisRowOffset - currentScroll;

                // Set initial Y to the precise screen position
                selectedWeekInitialY.value = thisRowScreenY;
            }
        })();

        // 3. JS State Update
        runOnJS(lockMonthScroll)(scrollY.value);
        if (onDayPress) runOnJS(onDayPress)(date);
        runOnJS(scrollTimelineToPosition)(dayTs.getTime());

        const config = {
            duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
            easing: ANIMATION_CONFIG.EASING,
        };

        // 4. Animation
        collapseProgress.value = withTiming(0, config, (finished) => {
            // Animation finished
        });

        selectionAnim.value = withTiming(1, config);
        dateTitleAnim.value = withTiming(1, config);

        // 🔴 MOST CRITICAL FIX END

    }, [
        prevMonthWeeks,
        weeks,
        nextMonthWeeks,
        isCollapsed,
        selectedDateTimestamp,
        selectedWeekIdx,
        selectionAnim,
        dateTitleAnim,
        timelineAnim,
        calendarHeight,
        monthTitleAnim,
        monthTitleAnim,
        onDayPress,
        lockMonthScroll // Dependency added
    ]);
    const handleTodayPress = () => {
        const today = new Date();

        // Calculate week index
        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const todayStr = today.toDateString();
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => {
                if (!day) return false;
                const d = typeof day.toDateString === 'function' ? day : new Date(day);
                return d.toDateString() === todayStr;
            })
        );

        setSelectedDate(today);
        setCurrentMonth(today);

        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        // Önceki animasyonları iptal et
        cancelAnimation(selectionAnim);
        cancelAnimation(dateTitleAnim);
        // cancelAnimation(calendarHeight); // Derived - cannot cancel
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

        // Collapse to Day View (0)
        collapseProgress.value = withTiming(0, animConfig, (finished) => {
            'worklet';
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

    // lockMonthScroll moved up to avoid TDZ

    const handleBackToMonth = () => {
        // ═══════════════════════════════════════════════════════
        // iOS Calendar Style: Back to Month Animation
        // ═══════════════════════════════════════════════════════

        // DAY VIEW -> MONTH VIEW (EXPAND)
        // Animate progress to 1
        const config = { duration: ANIMATION_CONFIG.COLLAPSE_DURATION, easing: ANIMATION_CONFIG.EASING };

        // Day view'da header altındaki satırın mevcut Y'sini "0" kabul edip
        // month'a açılırken başlangıç kilidi veriyoruz:
        selectedWeekInitialY.value = 0;

        dateTitleAnim.value = withTiming(0, config);
        collapseProgress.value = withTiming(1, config, (finished) => {
            if (finished) runOnJS(resetToMonthView)();
        });
    };

    // ═══════════════════════════════════════════════════════════════
    // EVENT DETAIL & CREATE EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleEventPress = async (event: Event) => {
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

        // Close calendar and navigate to DailyWorkoutDetail
        if (onFullScreenPress) {
            onFullScreenPress();
        }

        // Navigate to DailyWorkoutDetail screen
        if (nav) {
            nav.navigate('DailyWorkoutDetail', {
                workoutDay: currentWorkoutDay,
                currentDay: date.getDay() === 0 ? 7 : date.getDay(), // Convert Sunday from 0 to 7
                totalDays: 7,
                dailyCalorieGoal: 1000,
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
            const eventDate = new Date(selectedEventForDetail.date);
            setEditingEventId(selectedEventForDetail.id);
            setCreateEventTitle(selectedEventForDetail.title);
            setCreateEventDate(eventDate);
            setCreateEventEndDate(eventDate);
            setCreateEventStartTime(selectedEventForDetail.startTime || '09:00');
            setCreateEventEndTime(selectedEventForDetail.endTime || '10:00');
            setSelectedWorkoutDay(selectedEventForDetail.workoutDay || 'LEG DAY');
            setCreateEventRepeat('never');
            setCreateEventType('event');
            setActivePickerField(null);
            setCreatePickerMonth(eventDate);

            // Reset picker heights
            dateTimePickerHeight.setValue(0);
            workoutPickerHeight.setValue(0);

            // Close event detail without animation (since we're opening create)
            setShowEventDetail(false);
            eventDetailSlideAnim.setValue(SCREEN_WIDTH);

            setShowCreateEvent(true);

            // Animate from bottom
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
        const d = date instanceof Date ? date : new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const formatDateShort = (date: Date): string => {
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
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
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
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
        const safeDate = typeof date.getDate === 'function' ? date : new Date(date);
        const safeTarget = typeof targetDate.getDate === 'function' ? targetDate : new Date(targetDate);
        return safeDate.getDate() === safeTarget.getDate() &&
            safeDate.getMonth() === safeTarget.getMonth() &&
            safeDate.getFullYear() === safeTarget.getFullYear();
    };

    const isTodayCheck = (date: Date): boolean => {
        if (!date) return false;
        const d = typeof date.getDate === 'function' ? date : new Date(date);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const handleCreateDateSelect = (day: Date, isStart: boolean) => {
        if (!day) return;
        const d = typeof day.getDate === 'function' ? day : new Date(day);
        if (isStart) {
            const newDate = new Date(createEventDate);
            newDate.setFullYear(d.getFullYear());
            newDate.setMonth(d.getMonth());
            newDate.setDate(d.getDate());
            setCreateEventDate(newDate);
        } else {
            const newDate = new Date(createEventEndDate);
            newDate.setFullYear(d.getFullYear());
            newDate.setMonth(d.getMonth());
            newDate.setDate(d.getDate());
            setCreateEventEndDate(newDate);
        }
    };

    // Time picker values
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'], []);

    const createEventCalendarDays = useMemo(() => getCreateEventDaysInMonth(safeCreatePickerMonth), [safeCreatePickerMonth]);

    const handleNavigateToDailyDetail = (date: Date) => {
        const d = date instanceof Date ? date : new Date(date);
        const dateStr = d.toISOString().split('T')[0];
        nav.navigate('DailyWorkoutDetail', {
            workoutDay: selectedWorkoutDay,
            date: dateStr,
        });
    };

    const handleOpenCreateEvent = (date: Date) => {
        const d = date instanceof Date ? date : new Date(date);
        setEditingEventId(null);
        setCreateEventDate(d);
        const endDate = new Date(d);
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
                date: new Date(currentDate).toISOString(),
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
                date: createEventDate.toISOString(),
                startTime: createEventStartTime,
                endTime: createEventEndTime,
                alertMinutes: 30,
            };

            if (editingEventId) {
                // Update existing event
                const existingIndex = storedEvents.findIndex(e => e.id === editingEventId);
                if (existingIndex >= 0) {
                    storedEvents[existingIndex] = { ...storedEvents[existingIndex], ...newEvent };
                }
            } else {
                // Generate repeated events for new event
                const allEvents = generateRepeatedEvents(newEvent, createEventRepeat);
                storedEvents = [...storedEvents, ...allEvents];
            }

            await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storedEvents));
            onEventsChange && onEventsChange(storedEvents);
            handleCloseCreateEvent();

            // Navigate to DailyWorkoutDetail after save
            nav.navigate('DailyWorkoutDetail', {
                workoutDay: newEvent.workoutDay,
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
            // Reset scroll position instantly
            monthScrollViewRef.current?.scrollTo({ y: 0, animated: false });

            // Expand to Month View (1)
            collapseProgress.value = withTiming(1, { duration: ANIMATION_CONFIG.COLLAPSE_DURATION });

            dateTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Month view'da 0
            selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Görünür kalsın
            // timelineAnim derived
            // setIsCollapsed logic moved to useAnimatedReaction
        }

    };

    const timeSlots = useMemo(() => {
        const slots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        return [...slots, '00:00'];
    }, []);

    const renderListPane = (date: Date) => {
        const d = date instanceof Date ? date : new Date(date);
        // Validate date for NaN
        if (isNaN(d.getTime())) {
            const fallback = new Date();
            return (
                <View style={styles.timelinePane}>
                    <View style={styles.dayHeader}>
                        <Text style={[styles.dayHeaderText, { color: '#FFFFFF' }]}>
                            {MONTHS_SHORT[fallback.getMonth()]} {fallback.getDate()}, {fallback.getFullYear()}
                        </Text>
                    </View>
                </View>
            );
        }
        const dayEvents = getEventsForDate(d, events);
        const workout = getWorkoutForDate(d, schedule);

        return (
            <View style={styles.timelinePane}>
                <View style={styles.dayHeader}>
                    <Text style={[styles.dayHeaderText, isToday(d) ? { color: '#FF3B30' } : { color: '#FFFFFF' }]}>
                        {MONTHS_SHORT[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
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
        const d = date instanceof Date ? date : new Date(date);
        // Validate date for NaN to prevent "NaN, NaN" in date titles
        if (isNaN(d.getTime())) {
            const fallback = new Date();
            if (daySubMode === 'list') return renderListPane(fallback);
            return renderListPane(fallback); // Fallback to list view if date invalid
        }
        if (daySubMode === 'list') return renderListPane(d);

        const dayEvents = getEventsForDate(d, events);
        const workout = getWorkoutForDate(d, schedule);

        if (daySubMode === 'multi') {
            // Infinite scroll için 21 günlük buffer (10 geri, 10 ileri)
            const days: Date[] = [];
            for (let i = -10; i <= 10; i++) {
                const d = new Date(safeMultiDayStartDate.getTime() + (i * 86400000));
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
                        snapToInterval={DAY_COLUMN_WIDTH}
                        snapToAlignment="start"
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
                                <View>
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
                                                {days.map((d, idx) => (
                                                    <View
                                                        key={idx}
                                                        style={{
                                                            width: DAY_COLUMN_WIDTH,
                                                            borderRightWidth: 0.5,
                                                            borderRightColor: '#2C2C2E'
                                                        }}
                                                    >
                                                        <TimeSlotContent
                                                            date={d}
                                                            hour={hour}
                                                            dayEvents={getEventsForDate(d, events)}
                                                            workout={getWorkoutForDate(d, schedule)}
                                                            availableWidth={DAY_COLUMN_WIDTH - 4}
                                                            leftOffsetBase={0}
                                                            onCreateEvent={handleOpenCreateEvent}
                                                            onEventPress={handleEventPress}
                                                            onWorkoutDayPress={handleWorkoutDayPress}
                                                            onNavigateToDailyDetail={handleNavigateToDailyDetail}
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })}
                                </View>
                            </Animated.ScrollView>
                        </View>
                    </Animated.ScrollView>
                </View>
            );
        }

        // ============ SINGLE DAY MODE ============
        return (
            <View style={styles.timelinePane}>
                <Animated.View style={[styles.dayHeader, dateTitleStyle]}>
                    <Text style={[styles.dayHeaderText, isToday(d) ? { color: '#FF3B30' } : { color: '#FFFFFF' }]}>
                        {MONTHS_SHORT[d.getMonth()]} {d.getDate()}, {d.getFullYear()} • {WEEKDAYS_FULL[d.getDay()]}
                    </Text>
                </Animated.View>

                <Animated.ScrollView
                    ref={isCenter ? timelineVerticalScrollRef : undefined}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 150, paddingTop: 0 }}
                >
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
                            />
                        );
                    })}

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
                </Animated.ScrollView>
            </View>
        );
    };

    const renderDayCell = (day: Date | null, idx: number, isAdjacent = false) => {
        let weekTimestamp = 0;
        if (day) {
            const d = new Date(day);
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            weekTimestamp = d.getTime();
        }
        return (
            <DayCell
                key={idx}
                day={day}
                dayIdx={idx}
                globalWeekIdx={0}
                selectedWeekIdx={selectedWeekIdx}
                selectedWeekTimestamp={selectedWeekTimestamp}
                selectedDateTimestamp={selectedDateTimestamp}
                multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                selectionAnim={selectionAnim}
                weekTimestamp={weekTimestamp}
                isCollapsed={isCollapsed}
                isToday={isToday(day)}
                isSelected={isSelected(day, selectedDate)}
                handleDayPress={handleDayPress}
                dayEvents={getEventsForDate(day, events)}
                workout={getWorkoutForDate(day, schedule)}
                eventOpacity={null}
                hasSelectedDayInWeek={false}
                isAdjacent={isAdjacent}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
                isMultiDay={daySubMode === 'multi'}
            />
        );
    };



    const renderWeekRow = (week: (Date | null)[], weekIdx: number, isAdjacent = false, globalOffset = 0, monthKey: string = 'current') => {
        const globalWeekIdx = globalOffset + weekIdx;

        // Calculate stable week timestamp (Monday of this week)
        const firstDay = week.find(d => d !== null);
        let weekTimestamp = 0;
        if (firstDay) {
            const d = new Date(firstDay);
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            weekTimestamp = d.getTime();
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
                selectedWeekTimestamp={selectedWeekTimestamp}
                selectedDateTimestamp={selectedDateTimestamp}
                multiDayEndDateTimestamp={multiDayEndDateTimestamp}
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
                weeksLength={weeks.length}
                isCollapsed={isCollapsed}
                selectionAnim={selectionAnim}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
                weekTimestamp={weekTimestamp}
                isMultiDay={daySubMode === 'multi'}
                selectedWeekInitialY={selectedWeekInitialY}
            />
        );
    };

    return (
        <>
            <Animated.View style={[styles.card, cardStyle]}>
                <Animated.View style={styles.gestureHeader}>
                    <GestureDetector gesture={panGesture}>
                        <Animated.View>
                            <View style={styles.header}>
                                <RNAnimated.View style={[
                                    {
                                        opacity: viewButtonOpacity,
                                        transform: [
                                            { scale: viewButtonScale }
                                        ]
                                    }
                                ]}>
                                    <TouchableOpacity onPress={isCollapsed ? handleBackToMonth : handleYearPress} style={styles.backButton} activeOpacity={1}>
                                        <Feather name="chevron-left" size={26} color="#FFF" />
                                        <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>
                                            {isCollapsed ? MONTHS_FULL[safeCurrentMonth.getMonth()] : safeCurrentMonth.getFullYear()}
                                        </Text>
                                    </TouchableOpacity>
                                </RNAnimated.View>

                                <RNAnimated.View style={[
                                    styles.headerRightPill,
                                    {
                                        // Removed viewButtonOpacity, scale, translateX from here
                                        // as they are now applied to the whole pill wrapper
                                    }
                                ]}>
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
                                    <TouchableOpacity
                                        onPress={() => handleOpenCreateEvent(selectedDate)}
                                        style={styles.headerRightIcon}
                                        activeOpacity={1}
                                    >
                                        <Feather name="plus" size={24} color="#9DEC2C" />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />
                                    <TouchableOpacity
                                        onPress={() => onFullScreenPress && onFullScreenPress()}
                                        style={styles.headerRightIcon}
                                        activeOpacity={1}
                                    >
                                        <Feather name="x" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </RNAnimated.View>
                            </View>

                            {/* Month Title - visible only in month view */}
                            <Animated.View style={[styles.monthTitleContainer, monthTitleStyle]}>
                                <Animated.Text style={[styles.monthTitle, monthTitleTextStyle]}>{MONTHS_FULL[safeCurrentMonth.getMonth()]}</Animated.Text>
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
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleWeekScrollEnd}
                            scrollEventThrottle={16}
                            contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                            scrollEnabled={isCollapsed}
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
                        <Animated.ScrollView
                            ref={monthScrollViewRef}
                            key="month-vertical-scroll"
                            showsVerticalScrollIndicator={false}
                            onMomentumScrollEnd={handleMonthScrollEnd}
                            onScroll={scrollHandler}
                            scrollEventThrottle={16}
                            decelerationRate={0.995}
                            contentOffset={{ x: 0, y: prevMonthWeeks.length * WEEK_ROW_HEIGHT }}
                            scrollEnabled={!isCollapsed}
                            removeClippedSubviews={false}
                            nestedScrollEnabled={true}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        >
                            {/* Flat list of all weeks for seamless vertical scroll */}
                            <View>
                                {prevMonthWeeks.map((week, weekIdx) => {
                                    const prevMonth = new Date(safeCurrentMonth);
                                    prevMonth.setMonth(safeCurrentMonth.getMonth() - 1);
                                    const monthKey = `prev-${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, true, 0, monthKey);
                                })}
                                {weeks.map((week, weekIdx) => {
                                    const monthKey = `curr-${safeCurrentMonth.getFullYear()}-${safeCurrentMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, false, prevMonthWeeks.length, monthKey);
                                })}
                                {nextMonthWeeks.map((week, weekIdx) => {
                                    const nextMonth = new Date(safeCurrentMonth);
                                    nextMonth.setMonth(safeCurrentMonth.getMonth() + 1);
                                    const monthKey = `next-${nextMonth.getFullYear()}-${nextMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, true, prevMonthWeeks.length + weeks.length, monthKey);
                                })}
                            </View>
                        </Animated.ScrollView>
                    </Animated.View>

                    {/* Overlay Week Row - Animated snapshot for Month->Day transitions */}
                    <Animated.View style={[styles.overlayContainer, overlayContainerStyle]} pointerEvents="none">
                        {overlayWeek.length > 0 && renderWeekRow(overlayWeek, -1, false, 0, 'overlay')}
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
                            </LiquidGlassCard>
                        </RNAnimated.View>
                    </Modal>

                    {/* Week Selector Modal */}
                    <YearCalendarModal
                        visible={showYearModal}
                        onClose={() => setShowYearModal(false)}
                        onMonthSelect={handleYearModalSelect}
                        initialYear={safeCurrentMonth.getFullYear()}
                    />

                    {/* Timeline view (visible in day mode) */}
                    <Animated.View style={[styles.timelineContainer, timelineStyle]}>
                        <View style={{ flex: 1 }}>
                            {daySubMode === 'multi' ? (
                                // ============ MULTI DAY: NO HORIZONTAL SCROLL ============
                                <View style={{ flex: 1 }}>
                                    {renderTimelinePane(safeSelectedDate, true)}
                                </View>
                            ) : (
                                // ============ SINGLE DAY: HORIZONTAL SCROLL (PREV/CURRENT/NEXT) ============
                                <ScrollView
                                    ref={timelineHorizontalScrollViewRef}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={handleTimelineScrollEnd}
                                    scrollEventThrottle={16}
                                    contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                                    style={{ flex: 1 }}
                                >
                                    {renderTimelinePane(new Date(safeSelectedDate.getTime() - 86400000))}
                                    {renderTimelinePane(safeSelectedDate, true)}
                                    {renderTimelinePane(new Date(safeSelectedDate.getTime() + 86400000))}
                                </ScrollView>
                            )}
                        </View>
                    </Animated.View>

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
                        <Text style={styles.yearTitle}>{safeSelectedDate.getFullYear()}</Text>
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
                                        year={safeSelectedDate.getFullYear()}
                                        month={monthIdx}
                                        onDayPress={(date) => {
                                            setSelectedDate(date);
                                            setCurrentMonth(date);
                                            setShowYearPicker(false);
                                            // Collapse to Day View (0)
                                            collapseProgress.value = withTiming(0, {
                                                duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                                                easing: ANIMATION_CONFIG.EASING,
                                            }, (finished) => {
                                                if (finished) runOnJS(setIsCollapsed)(true);
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

                                {/* Workout Section (Replica of DailyWorkoutDetailScreen) */}
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

                                {/* Delete Button (matching DailyWorkoutDetailScreen) */}
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

                    {/* Delete Confirmation Modal (matching DailyWorkoutDetailScreen) */}
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
                                    {safeWorkoutDayPickerDate.getDate()} {MONTHS_FULL[safeWorkoutDayPickerDate.getMonth()]} {safeWorkoutDayPickerDate.getFullYear()}
                                </Text>
                                <Text style={workoutDayPickerStyles.dateSubtext}>
                                    {WEEKDAYS_FULL[safeWorkoutDayPickerDate.getDay()]}
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
            {/* CREATE EVENT - Full Screen with Bottom Slide Animation */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showCreateEvent && (
                <RNAnimated.View
                    style={[
                        createEventStyles.fullScreenContainer,
                        { transform: [{ translateY: createEventSlideAnim }] }
                    ]}
                >
                    {/* Full Screen Container - iOS Calendar style */}
                    <View style={createEventStyles.modalContainer}>
                        {/* Drag Handle Area */}
                        <View {...createEventPanResponder.panHandlers} style={createEventStyles.dragHandleArea}>
                            <View style={createEventStyles.dragHandle} />
                        </View>

                        {/* Header */}
                        <View style={createEventStyles.header}>
                            <TouchableOpacity onPress={handleCloseCreateEvent} style={createEventStyles.circularIconButton}>
                                <Feather name="x" size={24} color="#FFF" />
                            </TouchableOpacity>

                            <Text style={createEventStyles.headerTitle}>
                                {editingEventId ? 'Edit Workout' : 'New Workout'}
                            </Text>

                            <TouchableOpacity onPress={handleSaveEvent} style={createEventStyles.circularAddButton}>
                                <Feather name="check" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Event/Reminder Toggle */}
                        <View style={createEventStyles.toggleContainer}>
                            <TouchableOpacity
                                style={[createEventStyles.toggleButton, createEventType === 'event' && createEventStyles.toggleButtonActive]}
                                onPress={() => setCreateEventType('event')}
                            >
                                <Text style={[createEventStyles.toggleText, createEventType === 'event' && createEventStyles.toggleTextActive]}>
                                    Event
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[createEventStyles.toggleButton, createEventType === 'reminder' && createEventStyles.toggleButtonActive]}
                                onPress={() => setCreateEventType('reminder')}
                            >
                                <Text style={[createEventStyles.toggleText, createEventType === 'reminder' && createEventStyles.toggleTextActive]}>
                                    Reminder
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={createEventStyles.content} showsVerticalScrollIndicator={false}>
                            {/* Main Attributes Card (Title + Workout Type) */}
                            <View style={[createEventStyles.inputCard, activePickerField === 'workout' && createEventStyles.cardExpanded]}>
                                <TextInput
                                    ref={titleInputRef}
                                    style={createEventStyles.titleInput}
                                    placeholder="Title"
                                    placeholderTextColor="#8E8E93"
                                    value={createEventTitle}
                                    onChangeText={setCreateEventTitle}
                                    autoFocus={false}
                                />
                                <View style={createEventStyles.separator} />
                                <TouchableOpacity onPress={toggleWorkoutPicker} activeOpacity={0.8}>
                                    <View style={createEventStyles.rowContent}>
                                        <Text style={createEventStyles.rowLabel}>Workout Type</Text>
                                        <View style={createEventStyles.rowValueContainer}>
                                            <Text style={createEventStyles.rowValue}>{selectedWorkoutDay}</Text>
                                            <Feather name="chevron-right" size={18} color="#8E8E93" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Workout Picker */}
                            <RNAnimated.View style={[createEventStyles.pickerWrapper, { height: workoutPickerHeight }]}>
                                <Picker
                                    selectedValue={selectedWorkoutDay}
                                    onValueChange={(value) => setSelectedWorkoutDay(value as WorkoutDayType)}
                                    itemStyle={createEventStyles.pickerItem}
                                    style={{ height: 200 }}
                                >
                                    {WORKOUT_DAYS.map((day) => (
                                        <Picker.Item key={day} label={day} value={day} />
                                    ))}
                                </Picker>
                            </RNAnimated.View>

                            {/* Date/Time Container */}
                            <View style={createEventStyles.dateTimeCard}>
                                {/* Starts Row */}
                                <View style={createEventStyles.dateTimeRow}>
                                    <Text style={createEventStyles.dateTimeLabel}>Starts</Text>
                                    <View style={createEventStyles.dateTimeValues}>
                                        <TouchableOpacity
                                            style={[createEventStyles.datePill, activePickerField === 'startDate' && createEventStyles.pillActive]}
                                            onPress={() => toggleDateTimePicker('startDate')}
                                        >
                                            <Text style={[createEventStyles.datePillText, activePickerField === 'startDate' && createEventStyles.pillTextActive]}>
                                                {formatDateShort(createEventDate)}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[createEventStyles.timePill, activePickerField === 'startTime' && createEventStyles.timePillActive]}
                                            onPress={() => toggleDateTimePicker('startTime')}
                                        >
                                            <Text style={[createEventStyles.timePillText, activePickerField === 'startTime' && createEventStyles.pillTextActive]}>
                                                {createEventStartTime}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Start Date/Time Picker */}
                                {(activePickerField === 'startDate' || activePickerField === 'startTime') && (
                                    <RNAnimated.View style={[createEventStyles.inlinePicker, { height: dateTimePickerHeight }]}>
                                        {activePickerField === 'startDate' ? (
                                            // Calendar Picker
                                            <View style={createEventStyles.calendarContainer}>
                                                {/* Month Navigation */}
                                                <View style={createEventStyles.monthNav}>
                                                    <TouchableOpacity onPress={() => {
                                                        const newMonth = new Date(safeCreatePickerMonth);
                                                        newMonth.setMonth(newMonth.getMonth() - 1);
                                                        setCreatePickerMonth(newMonth);
                                                    }}>
                                                        <Feather name="chevron-left" size={20} color="#007AFF" />
                                                    </TouchableOpacity>
                                                    <Text style={createEventStyles.monthNavText}>
                                                        {MONTHS_FULL[safeCreatePickerMonth.getMonth()]} {safeCreatePickerMonth.getFullYear()}
                                                    </Text>
                                                    <TouchableOpacity onPress={() => {
                                                        const newMonth = new Date(safeCreatePickerMonth);
                                                        newMonth.setMonth(newMonth.getMonth() + 1);
                                                        setCreatePickerMonth(newMonth);
                                                    }}>
                                                        <Feather name="chevron-right" size={20} color="#007AFF" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Weekday headers */}
                                                <View style={createEventStyles.weekdayHeader}>
                                                    {WEEKDAYS.map((day, index) => (
                                                        <Text key={index} style={[
                                                            createEventStyles.weekdayText,
                                                            index >= 5 && createEventStyles.weekendHeaderText,
                                                        ]}>
                                                            {day}
                                                        </Text>
                                                    ))}
                                                </View>

                                                {/* Days grid */}
                                                <View style={createEventStyles.daysGrid}>
                                                    {createEventCalendarDays.map((day, index) => {
                                                        if (!day) {
                                                            return <View key={`empty-${index}`} style={createEventStyles.dayCell} />;
                                                        }

                                                        const d = typeof day.getDay === 'function' ? day : new Date(day);
                                                        const dayOfWeek = d.getDay();
                                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                                        const selected = isDateSelected(d, createEventDate);

                                                        return (
                                                            <TouchableOpacity
                                                                key={d.toISOString()}
                                                                style={createEventStyles.dayCell}
                                                                onPress={() => handleCreateDateSelect(d, true)}
                                                            >
                                                                <View style={[
                                                                    createEventStyles.dayNumber,
                                                                    selected && createEventStyles.selectedDayNumber,
                                                                    isTodayCheck(day) && !selected && createEventStyles.todayDayNumber,
                                                                ]}>
                                                                    <Text style={[
                                                                        createEventStyles.dayText,
                                                                        isWeekend && !selected && createEventStyles.weekendDayText,
                                                                        selected && createEventStyles.selectedDayText,
                                                                    ]}>
                                                                        {day.getDate()}
                                                                    </Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        ) : (
                                            // Time Picker
                                            <View style={createEventStyles.timePickerContainer}>
                                                <Picker
                                                    selectedValue={createEventStartTime.split(':')[0]}
                                                    onValueChange={(value) => {
                                                        const mins = createEventStartTime.split(':')[1];
                                                        setCreateEventStartTime(`${value}:${mins}`);
                                                    }}
                                                    itemStyle={createEventStyles.pickerItem}
                                                    style={{ flex: 1, height: 200 }}
                                                >
                                                    {hours.map((hour) => (
                                                        <Picker.Item key={hour} label={hour} value={hour} />
                                                    ))}
                                                </Picker>
                                                <Text style={createEventStyles.timeSeparator}>:</Text>
                                                <Picker
                                                    selectedValue={createEventStartTime.split(':')[1]}
                                                    onValueChange={(value) => {
                                                        const hrs = createEventStartTime.split(':')[0];
                                                        setCreateEventStartTime(`${hrs}:${value}`);
                                                    }}
                                                    itemStyle={createEventStyles.pickerItem}
                                                    style={{ flex: 1, height: 200 }}
                                                >
                                                    {minutes.map((minute) => (
                                                        <Picker.Item key={minute} label={minute} value={minute} />
                                                    ))}
                                                </Picker>
                                            </View>
                                        )}
                                    </RNAnimated.View>
                                )}

                                <View style={createEventStyles.separator} />

                                {/* Ends Row */}
                                <View style={createEventStyles.dateTimeRow}>
                                    <Text style={createEventStyles.dateTimeLabel}>Ends</Text>
                                    <View style={createEventStyles.dateTimeValues}>
                                        <TouchableOpacity
                                            style={[createEventStyles.datePill, activePickerField === 'endDate' && createEventStyles.pillActive]}
                                            onPress={() => toggleDateTimePicker('endDate')}
                                        >
                                            <Text style={[createEventStyles.datePillText, activePickerField === 'endDate' && createEventStyles.pillTextActive]}>
                                                {formatDateShort(createEventEndDate)}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[createEventStyles.timePill, activePickerField === 'endTime' && createEventStyles.timePillActive]}
                                            onPress={() => toggleDateTimePicker('endTime')}
                                        >
                                            <Text style={[createEventStyles.timePillText, activePickerField === 'endTime' && createEventStyles.pillTextActive]}>
                                                {createEventEndTime}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* End Date/Time Picker */}
                                {(activePickerField === 'endDate' || activePickerField === 'endTime') && (
                                    <RNAnimated.View style={[createEventStyles.inlinePicker, { height: dateTimePickerHeight }]}>
                                        {activePickerField === 'endDate' ? (
                                            // Calendar Picker
                                            <View style={createEventStyles.calendarContainer}>
                                                {/* Month Navigation */}
                                                <View style={createEventStyles.monthNav}>
                                                    <TouchableOpacity onPress={() => {
                                                        const newMonth = new Date(safeCreatePickerMonth);
                                                        newMonth.setMonth(newMonth.getMonth() - 1);
                                                        setCreatePickerMonth(newMonth);
                                                    }}>
                                                        <Feather name="chevron-left" size={20} color="#007AFF" />
                                                    </TouchableOpacity>
                                                    <Text style={createEventStyles.monthNavText}>
                                                        {MONTHS_FULL[safeCreatePickerMonth.getMonth()]} {safeCreatePickerMonth.getFullYear()}
                                                    </Text>
                                                    <TouchableOpacity onPress={() => {
                                                        const newMonth = new Date(safeCreatePickerMonth);
                                                        newMonth.setMonth(newMonth.getMonth() + 1);
                                                        setCreatePickerMonth(newMonth);
                                                    }}>
                                                        <Feather name="chevron-right" size={20} color="#007AFF" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Weekday headers */}
                                                <View style={createEventStyles.weekdayHeader}>
                                                    {WEEKDAYS.map((day, index) => (
                                                        <Text key={index} style={[
                                                            createEventStyles.weekdayText,
                                                            index >= 5 && createEventStyles.weekendHeaderText,
                                                        ]}>
                                                            {day}
                                                        </Text>
                                                    ))}
                                                </View>

                                                {/* Days grid */}
                                                <View style={createEventStyles.daysGrid}>
                                                    {createEventCalendarDays.map((day, index) => {
                                                        if (!day) {
                                                            return <View key={`empty-${index}`} style={createEventStyles.dayCell} />;
                                                        }

                                                        const d = typeof day.getDay === 'function' ? day : new Date(day);
                                                        const dayOfWeek = d.getDay();
                                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                                        const selected = isDateSelected(d, createEventEndDate);

                                                        return (
                                                            <TouchableOpacity
                                                                key={d.toISOString()}
                                                                style={createEventStyles.dayCell}
                                                                onPress={() => handleCreateDateSelect(d, false)}
                                                            >
                                                                <View style={[
                                                                    createEventStyles.dayNumber,
                                                                    selected && createEventStyles.selectedDayNumber,
                                                                    isTodayCheck(day) && !selected && createEventStyles.todayDayNumber,
                                                                ]}>
                                                                    <Text style={[
                                                                        createEventStyles.dayText,
                                                                        isWeekend && !selected && createEventStyles.weekendDayText,
                                                                        selected && createEventStyles.selectedDayText,
                                                                    ]}>
                                                                        {day.getDate()}
                                                                    </Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        ) : (
                                            // Time Picker
                                            <View style={createEventStyles.timePickerContainer}>
                                                <Picker
                                                    selectedValue={createEventEndTime.split(':')[0]}
                                                    onValueChange={(value) => {
                                                        const mins = createEventEndTime.split(':')[1];
                                                        setCreateEventEndTime(`${value}:${mins}`);
                                                    }}
                                                    itemStyle={createEventStyles.pickerItem}
                                                    style={{ flex: 1, height: 200 }}
                                                >
                                                    {hours.map((hour) => (
                                                        <Picker.Item key={hour} label={hour} value={hour} />
                                                    ))}
                                                </Picker>
                                                <Text style={createEventStyles.timeSeparator}>:</Text>
                                                <Picker
                                                    selectedValue={createEventEndTime.split(':')[1]}
                                                    onValueChange={(value) => {
                                                        const hrs = createEventEndTime.split(':')[0];
                                                        setCreateEventEndTime(`${hrs}:${value}`);
                                                    }}
                                                    itemStyle={createEventStyles.pickerItem}
                                                    style={{ flex: 1, height: 200 }}
                                                >
                                                    {minutes.map((minute) => (
                                                        <Picker.Item key={minute} label={minute} value={minute} />
                                                    ))}
                                                </Picker>
                                            </View>
                                        )}
                                    </RNAnimated.View>
                                )}

                                <View style={createEventStyles.separator} />

                                {/* Repeat Row */}
                                <TouchableOpacity
                                    style={[createEventStyles.dateTimeRow, { marginTop: 8 }]}
                                    onPress={() => toggleDateTimePicker('repeat')}
                                >
                                    <Text style={createEventStyles.dateTimeLabel}>Repeat</Text>
                                    <View style={createEventStyles.rowValueContainer}>
                                        <Text style={[createEventStyles.rowValue, activePickerField === 'repeat' && createEventStyles.activeRowValue]}>
                                            {REPEAT_OPTIONS.find(o => o.value === createEventRepeat)?.label || 'Never'}
                                        </Text>
                                        <Feather name="chevron-right" size={18} color="#8E8E93" />
                                    </View>
                                </TouchableOpacity>

                                {/* Repeat Picker */}
                                {activePickerField === 'repeat' && (
                                    <RNAnimated.View style={[createEventStyles.inlinePicker, { height: dateTimePickerHeight }]}>
                                        <Picker
                                            selectedValue={createEventRepeat}
                                            onValueChange={(value) => setCreateEventRepeat(value)}
                                            itemStyle={createEventStyles.pickerItem}
                                            style={{ height: 200 }}
                                        >
                                            {REPEAT_OPTIONS.map((option) => (
                                                <Picker.Item key={option.value} label={option.label} value={option.value} />
                                            ))}
                                        </Picker>
                                    </RNAnimated.View>
                                )}
                            </View>

                            {/* Delete Button - only in edit mode */}
                            {editingEventId && (
                                <TouchableOpacity onPress={handleDeleteCreateEvent} style={createEventStyles.deleteButton} activeOpacity={0.9}>
                                    <Feather name="trash-2" size={18} color="#FF3B30" />
                                    <Text style={createEventStyles.deleteButtonText}>Delete Workout</Text>
                                </TouchableOpacity>
                            )}

                            <View style={{ height: 120 }} />
                        </ScrollView>

                        {/* Add/Update Event Button */}
                        <TouchableOpacity onPress={handleSaveEvent} style={createEventStyles.addEventButton} activeOpacity={0.9}>
                            <Text style={createEventStyles.addEventButtonText}>{editingEventId ? 'Update Workout' : 'Add Workout'}</Text>
                        </TouchableOpacity>
                    </View>
                </RNAnimated.View>
            )}
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

                        const safeSel = typeof selectedDate.toDateString === 'function' ? selectedDate : new Date(selectedDate);
                        const isSelected = day.toDateString() === safeSel.toDateString();
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        height: 50,
        paddingHorizontal: 4,
        borderWidth: 0.8,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerRightIcon: {
        width: 46,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRightSeparator: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    todayButton: {
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.8,
        borderColor: 'rgba(255, 255, 255, 0.18)',
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
        top: 0,
        opacity: 0, // Base opacity 0, animated style controls visibility
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
        backgroundColor: '#FF3B30',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 39,
        fontWeight: '500',
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
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 4,
        marginBottom: 4,
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
        bottom: 80,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        borderRadius: 30,
        padding: 4,
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
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 16,
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
    goalMenuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    goalMenuAnimatedWrapper: {
        position: 'absolute',
        zIndex: 100,
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
        maxHeight: SCREEN_HEIGHT * 0.7,
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
        marginTop: 60,
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
        elevation: 8,
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
    weekContainer: {
        position: 'absolute',
        top: 0,
        height: DAY_VIEW_HEIGHT,
        width: SCREEN_WIDTH,
        justifyContent: 'center',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        height: DAY_VIEW_HEIGHT,
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        zIndex: 50, // Higher than weekContainer (30)
    },
});
