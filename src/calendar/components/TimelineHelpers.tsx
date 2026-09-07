import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SLOT_HEIGHT, HEADER_HEIGHT } from '../config/CalendarConfig';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import { Event } from '../models/Event';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const renderEventsForDate = (
    date: Date,
    events: Event[],
    workout: WorkoutDayType | null,
    availableWidth: number,
    onEventPress?: (event: Event) => void,
    isMultiDay?: boolean
) => {
    if (events.length === 0) return null;

    return events.map((event, idx) => {
        if (!event.startTime) return null;

        const startHour = parseInt(event.startTime.split(':')[0]);
        const startMin = parseInt(event.startTime.split(':')[1]);
        const endHour = event.endTime ? parseInt(event.endTime.split(':')[0]) : startHour + 1;
        const endMin = event.endTime ? parseInt(event.endTime.split(':')[1]) : startMin;

        const startOffset = (startHour + startMin / 60) * SLOT_HEIGHT;
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        const height = (duration / 60) * SLOT_HEIGHT;

        const width = availableWidth / Math.max(1, events.length);
        const left = idx * width;

        const eventColor = event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#4A90D9';

        return (
            <TouchableOpacity
                key={event.id}
                style={[
                    styles.eventCard,
                    {
                        top: startOffset,
                        left: left,
                        width: width - 2,
                        height: Math.max(25, height - 2),
                        backgroundColor: eventColor + '30',
                        borderLeftColor: eventColor,
                    }
                ]}
                onPress={() => onEventPress?.(event)}
            >
                <Text style={[styles.eventTitle, { color: eventColor }]} numberOfLines={1}>
                    {event.title}
                </Text>
                {height > 30 && (
                    <Text style={styles.eventTime}>
                        {event.startTime} - {event.endTime || ''}
                    </Text>
                )}
            </TouchableOpacity>
        );
    });
};

export const TimeSlotContent = React.memo(({
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
}: any) => {
    const hasWorkoutAtThisHour = hour === 9 && !!workout;

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
                style={[styles.slotTouchable, { height: SLOT_HEIGHT }]}
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

            {hasWorkoutAtThisHour && (
                <TouchableOpacity
                    style={[
                        styles.workoutCard,
                        {
                            top: 2,
                            left: leftOffsetBase,
                            width: availableWidth - 4,
                            height: SLOT_HEIGHT - 4,
                            backgroundColor: (WORKOUT_DAY_COLORS as any)[workout] + '25',
                            borderLeftColor: (WORKOUT_DAY_COLORS as any)[workout]
                        }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onWorkoutDayPress?.(date, workout)}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.workoutCardTitle, { color: (WORKOUT_DAY_COLORS as any)[workout], fontSize: isMultiDay ? 11 : 13 }]} numberOfLines={1}>{workout}</Text>
                        {!isMultiDay && <Text style={styles.workoutCardTime}>All day</Text>}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
});

export const MultiDayHeaderItem = React.memo(({
    d,
    idx,
    DAY_COLUMN_WIDTH,
    HEADER_HEIGHT,
    isToday
}: any) => {
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

const styles = StyleSheet.create({
    slotTouchable: {
        flex: 1,
    },
    workoutCard: {
        position: 'absolute',
        borderRadius: 8,
        borderLeftWidth: 3,
        padding: 8,
        zIndex: 10,
        justifyContent: 'center',
    },
    workoutCardTitle: {
        fontWeight: '700',
    },
    workoutCardTime: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    eventCard: {
        position: 'absolute',
        borderRadius: 8,
        borderLeftWidth: 3,
        padding: 4,
        paddingLeft: 8,
        zIndex: 20,
    },
    eventTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    eventTime: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
});
