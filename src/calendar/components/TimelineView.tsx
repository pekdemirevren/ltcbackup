import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { EventCard, WorkoutCard } from './EventCard';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import type { CalendarEvent } from '../models/Event';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLOT_HEIGHT = 50;
const TIME_COLUMN_WIDTH = 50;
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// Helper functions
const getEventDuration = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) endTotal += 24 * 60;
    return endTotal - startTotal;
};

const getMinutesOffset = (time: string): number => {
    const [, minutes] = time.split(':').map(Number);
    return minutes;
};

export interface TimeSlotProps {
    hour: number;
    date: Date;
    events: CalendarEvent[];
    workout: WorkoutDayType | null;
    onCreateEvent?: (date: Date) => void;
    onEventPress?: (event: CalendarEvent) => void;
    onWorkoutPress?: (date: Date, workout: WorkoutDayType | null) => void;
    isMultiDay?: boolean;
}

const TimeSlot = React.memo(({
    hour,
    date,
    events,
    workout,
    onCreateEvent,
    onEventPress,
    onWorkoutPress,
    isMultiDay = false,
}: TimeSlotProps) => {
    const availableWidth = SCREEN_WIDTH - TIME_COLUMN_WIDTH - 12;
    const hasWorkoutAtThisHour = hour === 9 && !!workout;
    const hourEvents = events.filter(e => {
        if (!e.time) return false;
        const eventHour = parseInt(e.time.split(':')[0]);
        return eventHour === hour;
    });

    return (
        <View style={styles.timeSlot}>
            <Text style={styles.timeText}>{String(hour).padStart(2, '0')}:00</Text>
            <View style={styles.slotContentContainer}>
                <TouchableOpacity
                    style={styles.slotTouchable}
                    onPress={() => {
                        const dateWithTime = new Date(date);
                        dateWithTime.setHours(hour, 0, 0, 0);
                        onCreateEvent?.(dateWithTime);
                    }}
                    onLongPress={() => {
                        const dateWithTime = new Date(date);
                        dateWithTime.setHours(hour, 0, 0, 0);
                        onCreateEvent?.(dateWithTime);
                    }}
                    delayLongPress={1100}
                    activeOpacity={0.7}
                />

                {/* Workout card at hour 9 */}
                {hasWorkoutAtThisHour && (
                    <WorkoutCard
                        workout={workout}
                        date={date}
                        leftOffset={0}
                        width={availableWidth}
                        height={SLOT_HEIGHT - 4}
                        isMultiDay={isMultiDay}
                        onPress={onWorkoutPress}
                    />
                )}

                {/* Event cards */}
                {hourEvents.map((event, idx) => {
                    const totalItems = (hasWorkoutAtThisHour ? 1 : 0) + hourEvents.length;
                    const itemWidth = availableWidth / totalItems;
                    const itemIndex = hasWorkoutAtThisHour ? idx + 1 : idx;
                    const leftOffset = itemIndex * itemWidth;

                    const durationMinutes = event.time ? 60 : 60; // Default 1 hour
                    const minutesOffset = event.time ? getMinutesOffset(event.time) : 0;
                    const eventHeight = Math.max(30, (durationMinutes / 60) * SLOT_HEIGHT);

                    return (
                        <EventCard
                            key={event.id}
                            event={event}
                            topOffset={(minutesOffset / 60) * SLOT_HEIGHT}
                            leftOffset={leftOffset}
                            width={itemWidth}
                            height={eventHeight}
                            isMultiDay={isMultiDay}
                            onPress={onEventPress}
                        />
                    );
                })}
            </View>
        </View>
    );
});

export interface TimelineViewProps {
    date: Date;
    events: CalendarEvent[];
    workout: WorkoutDayType | null;
    timelineAnim?: SharedValue<number>;
    onCreateEvent?: (date: Date) => void;
    onEventPress?: (event: CalendarEvent) => void;
    onWorkoutPress?: (date: Date, workout: WorkoutDayType | null) => void;
    isMultiDay?: boolean;
    scrollToCurrentTime?: boolean;
}

export const TimelineView = React.memo(({
    date,
    events,
    workout,
    timelineAnim,
    onCreateEvent,
    onEventPress,
    onWorkoutPress,
    isMultiDay = false,
    scrollToCurrentTime = true,
}: TimelineViewProps) => {
    const scrollRef = React.useRef<ScrollView>(null);

    // Scroll to current time on mount
    React.useEffect(() => {
        if (scrollToCurrentTime) {
            const now = new Date();
            const currentHour = now.getHours();
            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    y: Math.max(0, (currentHour - 2) * SLOT_HEIGHT),
                    animated: false,
                });
            }, 100);
        }
    }, [scrollToCurrentTime]);

    const animatedStyle = useAnimatedStyle(() => {
        if (!timelineAnim) return { opacity: 1 };
        return { opacity: timelineAnim.value };
    }, [timelineAnim]);

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {HOURS.map((_, hour) => (
                    <TimeSlot
                        key={hour}
                        hour={hour}
                        date={date}
                        events={events}
                        workout={workout}
                        onCreateEvent={onCreateEvent}
                        onEventPress={onEventPress}
                        onWorkoutPress={onWorkoutPress}
                        isMultiDay={isMultiDay}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    timeSlot: {
        flexDirection: 'row',
        height: SLOT_HEIGHT,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    timeText: {
        width: TIME_COLUMN_WIDTH,
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'right',
        paddingRight: 8,
        paddingTop: 4,
    },
    slotContentContainer: {
        flex: 1,
        position: 'relative',
    },
    slotTouchable: {
        flex: 1,
        height: SLOT_HEIGHT,
    },
});
