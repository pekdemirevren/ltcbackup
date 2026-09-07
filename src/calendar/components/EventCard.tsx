import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import type { CalendarEvent } from '../models/Event';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLOT_HEIGHT = 50;

export interface EventCardProps {
    event: CalendarEvent;
    topOffset: number;
    leftOffset: number;
    width: number;
    height: number;
    isMultiDay?: boolean;
    onPress?: (event: CalendarEvent) => void;
}

export const EventCard = React.memo(({
    event,
    topOffset,
    leftOffset,
    width,
    height,
    isMultiDay = false,
    onPress,
}: EventCardProps) => {
    const eventColor = event.workoutDay && (WORKOUT_DAY_COLORS as any)[event.workoutDay]
        ? (WORKOUT_DAY_COLORS as any)[event.workoutDay]
        : '#8E8E93';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    position: 'absolute',
                    top: topOffset,
                    left: leftOffset,
                    width: width - 4,
                    height: height,
                    backgroundColor: eventColor + '30',
                    borderLeftColor: eventColor,
                }
            ]}
            onPress={() => onPress?.(event)}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <Text
                    style={[styles.title, { color: eventColor, fontSize: isMultiDay ? 11 : 13 }]}
                    numberOfLines={1}
                >
                    {event.title}
                </Text>
                {!isMultiDay && event.time && (
                    <Text style={styles.time} numberOfLines={1}>
                        {event.time}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
});

export interface WorkoutCardProps {
    workout: WorkoutDayType;
    date: Date;
    topOffset?: number;
    leftOffset: number;
    width: number;
    height: number;
    isMultiDay?: boolean;
    onPress?: (date: Date, workout: WorkoutDayType | null) => void;
}

export const WorkoutCard = React.memo(({
    workout,
    date,
    topOffset = 0,
    leftOffset,
    width,
    height,
    isMultiDay = false,
    onPress,
}: WorkoutCardProps) => {
    const color = (WORKOUT_DAY_COLORS as any)[workout] || '#8E8E93';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    position: 'absolute',
                    top: topOffset,
                    left: leftOffset,
                    width: width - 4,
                    height: height,
                    backgroundColor: color + '25',
                    borderLeftColor: color,
                }
            ]}
            onPress={() => onPress?.(date, workout)}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <Text
                    style={[styles.title, { color: color, fontSize: isMultiDay ? 11 : 13 }]}
                    numberOfLines={1}
                >
                    {workout}
                </Text>
                {!isMultiDay && (
                    <Text style={styles.time}>All day</Text>
                )}
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        borderLeftWidth: 3,
        borderRadius: 6,
        padding: 6,
        zIndex: 10,
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: '600',
        marginBottom: 2,
    },
    time: {
        fontSize: 11,
        color: '#8E8E93',
    },
});
