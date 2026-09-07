import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
} from 'react-native-reanimated';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import { CalendarConfig } from '../config/CalendarConfig';
import type { CalendarEvent } from '../models/Event';
import type { MonthViewMode } from '../models/ViewMode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_VIEW_HEIGHT = CalendarConfig.heights.dayView;

export interface DayCellProps {
    day: Date | null;
    dayIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    selectedWeekTimestamp: SharedValue<number>;
    selectionAnim: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>;
    multiDayEndDateTimestamp: SharedValue<number>;
    isCollapsed: boolean;
    isMultiDay: boolean;
    isToday: boolean;
    isSelected: boolean;
    handleDayPress: (d: Date) => void;
    dayEvents: CalendarEvent[];
    workout: WorkoutDayType | null;
    eventOpacity?: any;
    hasSelectedDayInWeek: boolean;
    isAdjacent?: boolean;
    onNavigateToDetail?: (date: Date) => void;
    onCreateEvent?: (date: Date) => void;
    weekTimestamp: number;
    monthViewMode: MonthViewMode;
}

export const DayCell = React.memo(({
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
    const isTodayHidden = false;
    const dayTimestamp = day ? day.getTime() : 0;

    // Selection animation style
    const selectionStyle = useAnimatedStyle(() => {
        'worklet';
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;
        const isSelected = isSelectedTimestamp && isSelectedWeek;
        const opacity = (isSelected && !today) ? selectionAnim.value : 0;
        const scale = isSelected ? (selectionAnim.value > 0.7 ? 1 : 0.85) : 0.3;
        return { opacity, transform: [{ scale }] };
    }, [dayTimestamp, globalWeekIdx, isCollapsed, today]);

    // Range logic for multi-day mode
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
        const isSelectedNow = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        return {
            opacity: 1,
            backgroundColor: isSelectedNow ? '#FF3B30' : 'rgba(255, 59, 48, 0.15)',
            transform: [{ scale: 1 }]
        };
    }, [dayTimestamp]);

    const dayTextProps = useAnimatedStyle(() => {
        'worklet';
        const isSelectedTimestamp = Math.abs(selectedDateTimestamp.value - dayTimestamp) < 1000 * 60 * 60;
        if (today) return { color: isSelectedTimestamp ? '#FFFFFF' : '#FF3B30' };
        if (isSelectedTimestamp) return { color: '#000000' };
        if (isTodayHidden) return { color: '#FF3B30' };
        if (dayIdx >= 5) return { color: '#8E8E93' };
        return { color: '#FFFFFF' };
    }, [dayTimestamp, today, isTodayHidden, dayIdx]);

    // Event indicators
    const renderEventIndicators = () => {
        if (!eventOpacity) return null;
        const allEvents = workout ? [{ id: 'workout', workoutDay: workout }, ...dayEvents] : dayEvents;
        if (allEvents.length === 0) return null;
        if (monthViewMode === 'list') return null;

        if (monthViewMode === 'compact') {
            return (
                <Animated.View style={[styles.eventLabels, eventOpacity, { flexDirection: 'row', gap: 2, justifyContent: 'center' }]}>
                    {allEvents.slice(0, 3).map((event: any, idx: number) => {
                        const eventColor = event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            ? (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            : '#8E8E93';
                        return (
                            <View
                                key={event.id || idx}
                                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: eventColor }}
                            />
                        );
                    })}
                </Animated.View>
            );
        }

        if (monthViewMode === 'stacked') {
            return (
                <Animated.View style={[styles.eventLabels, eventOpacity, { gap: 2 }]}>
                    {allEvents.slice(0, 3).map((event: any, idx: number) => {
                        const eventColor = event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            ? (WORKOUT_DAY_COLORS as any)[event.workoutDay]
                            : '#8E8E93';
                        return (
                            <View
                                key={event.id || idx}
                                style={{ height: 3, backgroundColor: eventColor, borderRadius: 1.5, width: '90%', alignSelf: 'center' }}
                            />
                        );
                    })}
                </Animated.View>
            );
        }

        // Details mode (default)
        return (
            <Animated.View style={[styles.eventLabels, eventOpacity]}>
                {workout && (WORKOUT_DAY_COLORS as any)[workout] && (
                    <View style={[styles.eventPill, { backgroundColor: (WORKOUT_DAY_COLORS as any)[workout] + '40' }]}>
                        <Animated.Text style={[styles.eventText, { color: (WORKOUT_DAY_COLORS as any)[workout] }]} numberOfLines={1}>
                            {workout.replace(' Day', '').replace(' DAY', '')}
                        </Animated.Text>
                    </View>
                )}
                {dayEvents.slice(0, 1).map((event: any) => (
                    <View
                        key={event.id}
                        style={[styles.eventPill, { backgroundColor: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] + '40' : '#2C2C2E' }]}
                    >
                        <Animated.Text style={[styles.eventText, { color: event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay] ? (WORKOUT_DAY_COLORS as any)[event.workoutDay] : '#FFFFFF' }]} numberOfLines={1}>
                            {event.title?.toLowerCase()}
                        </Animated.Text>
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
            {/* Range indicators */}
            <>
                <Animated.View style={[styles.rangeStart, rangeStartStyle]} />
                <Animated.View style={[styles.rangeEnd, rangeEndStyle]} />
                <Animated.View style={[styles.selectedCircle, selectionStyle]} pointerEvents="none" />
            </>

            {/* Today circle */}
            {today && (
                <Animated.View style={[styles.todayCircle, todayCircleStyle]} pointerEvents="none" />
            )}

            {/* Day number */}
            <Animated.Text style={[styles.dayNumber, dayTextProps, isAdjacent && { opacity: 0.3 }]}>
                {day.getDate()}
            </Animated.Text>

            {renderEventIndicators()}
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
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

const styles = StyleSheet.create({
    dayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
        minHeight: 80,
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: '400',
        color: '#FFFFFF',
        zIndex: 2,
    },
    selectedCircle: {
        position: 'absolute',
        top: 9,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        zIndex: 1,
    },
    todayCircle: {
        position: 'absolute',
        top: 9,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF3B30',
        zIndex: 1,
    },
    rangeStart: {
        position: 'absolute',
        height: 40,
        top: 9,
        left: 4,
        right: -2,
        backgroundColor: '#3A3A3C',
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        zIndex: 0,
    },
    rangeEnd: {
        position: 'absolute',
        height: 40,
        top: 9,
        left: -2,
        right: 4,
        backgroundColor: '#3A3A3C',
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 0,
    },
    eventLabels: {
        position: 'absolute',
        bottom: 4,
        left: 2,
        right: 2,
        gap: 1,
    },
    eventPill: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: '#2C2C2E',
    },
    eventText: {
        fontSize: 9,
        fontWeight: '500',
        color: '#FFFFFF',
    },
});
