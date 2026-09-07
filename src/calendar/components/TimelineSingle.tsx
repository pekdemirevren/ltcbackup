import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { SLOT_HEIGHT, TIME_COLUMN_WIDTH, SCREEN_WIDTH_CONST } from '../config/CalendarConfig';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import { Event } from '../models/Event';
import { isToday } from '../utils/dateUtils';

import { renderEventsForDate, TimeSlotContent } from './TimelineHelpers';

interface TimelineSingleProps {
    date: Date;
    dayEvents: Event[];
    workout: WorkoutDayType | null;
    timelineAnim: SharedValue<number>;
    dateTitleStyle: any;
    handleOpenCreateEvent: (date: Date) => void;
    handleEventPress: (event: Event) => void;
    handleWorkoutDayPress: (date: Date, workout: WorkoutDayType | null) => void;
    handleNavigateToDailyDetail: (date: Date) => void;
    timelineVerticalScrollRef?: React.RefObject<ScrollView>;
    isCenter?: boolean;
}

const TimeSlotItem = ({
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
}: any) => {
    const hour = parseInt(time.split(':')[0]);
    const availableWidth = SCREEN_WIDTH_CONST - TIME_COLUMN_WIDTH - 12;

    return (
        <View style={styles.timeSlot}>
            <Text style={styles.timeText}>{time}</Text>
            <View style={styles.slotBorder}>
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
};

export const TimelineSingle = React.memo(({
    date,
    dayEvents,
    workout,
    timelineAnim,
    dateTitleStyle,
    handleOpenCreateEvent,
    handleEventPress,
    handleWorkoutDayPress,
    handleNavigateToDailyDetail,
    timelineVerticalScrollRef,
    isCenter
}: TimelineSingleProps) => {
    const timeSlots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.dayHeader, dateTitleStyle]}>
                <Text style={styles.dayHeaderText}>
                    {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()} • {WEEKDAYS_FULL[date.getDay()]}
                </Text>
            </Animated.View>

            <ScrollView
                ref={isCenter ? timelineVerticalScrollRef : undefined}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
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

                    <View
                        pointerEvents="box-none"
                        style={[StyleSheet.absoluteFill, { left: 50, right: 0 }]}
                    >
                        {renderEventsForDate(date, dayEvents, workout, SCREEN_WIDTH_CONST - 50 - 12, handleEventPress, false)}
                    </View>
                </View>

                {isToday(date) && (
                    <View style={[
                        styles.currentTimeContainer,
                        { top: ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * SLOT_HEIGHT }
                    ]}>
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
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: SCREEN_WIDTH_CONST,
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
    scrollContent: {
        paddingBottom: 150,
        paddingTop: 10,
    },
    timeSlot: {
        flexDirection: 'row',
        height: SLOT_HEIGHT,
    },
    timeText: {
        width: 50,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
        paddingRight: 8,
        paddingTop: -6,
    },
    slotBorder: {
        flex: 1,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
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
    currentTimeContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
        pointerEvents: 'none',
    },
    currentTimeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        marginLeft: 46,
    },
    currentTimeLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#FF3B30',
    },
    currentTimeLabel: {
        position: 'absolute',
        left: 4,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentTimeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
    },
});
