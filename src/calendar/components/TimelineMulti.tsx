import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SLOT_HEIGHT, HEADER_HEIGHT, DAY_COLUMN_WIDTH } from '../config/CalendarConfig';
import { MultiDayHeaderItem, TimeSlotContent, renderEventsForDate } from './TimelineHelpers';
import { Event } from '../models/Event';
import { WorkoutDayType } from '../../utils/WorkoutDayManager';

interface TimelineMultiProps {
    days: Date[];
    getEventsForDate: (date: Date) => Event[];
    getWorkoutForDate: (date: Date) => WorkoutDayType | null;
    handleOpenCreateEvent: (date: Date) => void;
    handleEventPress: (event: Event) => void;
    handleWorkoutDayPress: (date: Date, workout: WorkoutDayType | null) => void;
    handleNavigateToDailyDetail: (date: Date) => void;
    multiDayHorizontalContentScrollRef: React.RefObject<any>;
    multiDayVerticalContentScrollRef: React.RefObject<any>;
    multiDayContentHorizontalScrollHandler: any;
    multiDayContentVerticalScrollHandler: any;
    handleMultiDayScrollEnd: (event: any) => void;
    isCenter?: boolean;
}

export const TimelineMulti = React.memo(({
    days,
    getEventsForDate,
    getWorkoutForDate,
    handleOpenCreateEvent,
    handleEventPress,
    handleWorkoutDayPress,
    handleNavigateToDailyDetail,
    multiDayHorizontalContentScrollRef,
    multiDayVerticalContentScrollRef,
    multiDayContentHorizontalScrollHandler,
    multiDayContentVerticalScrollHandler,
    handleMultiDayScrollEnd,
    isCenter
}: TimelineMultiProps) => {
    const timeSlots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    return (
        <Animated.ScrollView
            ref={isCenter ? multiDayHorizontalContentScrollRef : undefined}
            horizontal
            onScroll={isCenter ? multiDayContentHorizontalScrollHandler : undefined}
            onMomentumScrollEnd={isCenter ? handleMultiDayScrollEnd : undefined}
            scrollEventThrottle={16}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={DAY_COLUMN_WIDTH}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            disableScrollViewPanResponder={false}
            style={{ flex: 1 }}
        >
            <View style={{ width: days.length * DAY_COLUMN_WIDTH }}>
                {/* HEADER ROW */}
                <View style={[styles.headerRow, { width: days.length * DAY_COLUMN_WIDTH }]}>
                    {days.map((d, idx) => (
                        <MultiDayHeaderItem
                            key={idx}
                            d={d}
                            idx={idx}
                            DAY_COLUMN_WIDTH={DAY_COLUMN_WIDTH}
                            HEADER_HEIGHT={HEADER_HEIGHT}
                            isToday={false} // Simplified for now
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
                    contentContainerStyle={styles.verticalScrollContent}
                    style={{ flex: 1 }}
                    removeClippedSubviews={true}
                >
                    <View style={{ position: 'relative' }}>
                        {timeSlots.map((time, idx) => {
                            const hour = parseInt(time.split(':')[0]);
                            return (
                                <View
                                    key={`${time}-${idx}`}
                                    style={styles.timeSlotRow}
                                >
                                    {days.map((d, dayIdx) => (
                                        <View
                                            key={dayIdx}
                                            style={styles.dayColumn}
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

                        {/* GLOBAL EVENTS LAYER FOR MULTI-DAY */}
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
    );
});

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        height: HEADER_HEIGHT,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#2C2C2E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    verticalScrollContent: {
        paddingBottom: 150,
    },
    timeSlotRow: {
        flexDirection: 'row',
        height: SLOT_HEIGHT,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    dayColumn: {
        width: DAY_COLUMN_WIDTH,
        borderRightWidth: 0.5,
        borderRightColor: '#2C2C2E',
        position: 'relative',
    },
});
