import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SharedValue } from 'react-native-reanimated';
import { WeekRow } from './WeekRow';
import { WEEK_ROW_HEIGHT } from '../config/CalendarConfig';
import type { CalendarEvent, WeekInfo } from '../models/Event';
import type { MonthViewMode } from '../models/ViewMode';
import type { WorkoutDayType } from '../../utils/WorkoutDayManager';

export interface MonthGridProps {
    weeks: WeekInfo[];
    selectedDate: Date;
    events: CalendarEvent[];
    schedule: Record<string, any>;
    bufferStage: number;
    centerOffsetWeeks: number;
    isCollapsed: boolean;
    isMultiDay: boolean;
    monthViewMode: MonthViewMode;

    // Shared values
    selectedWeekIdx: SharedValue<number>;
    selectedWeekTimestamp: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>;
    multiDayEndDateTimestamp: SharedValue<number>;
    calendarHeight: SharedValue<number>;
    scrollY: SharedValue<number>;
    selectionAnim: SharedValue<number>;

    // Callbacks
    handleDayPress: (date: Date) => void;
    onScrollEnd?: (monthIdx: number, offset: number) => void;
    onCreateEvent?: (date: Date) => void;
    isToday: (date: Date | null) => boolean;
    isSelected: (date: Date | null, selected: Date | null) => boolean;
    getEventsForDate: (date: Date | null) => CalendarEvent[];
    getWorkoutForDate: (date: Date | null) => WorkoutDayType | null;
}

export const MonthGrid = React.memo(({
    weeks,
    selectedDate,
    events,
    schedule,
    bufferStage,
    centerOffsetWeeks,
    isCollapsed,
    isMultiDay,
    monthViewMode,
    selectedWeekIdx,
    selectedWeekTimestamp,
    selectedDateTimestamp,
    multiDayEndDateTimestamp,
    calendarHeight,
    scrollY,
    selectionAnim,
    handleDayPress,
    onScrollEnd,
    onCreateEvent,
    isToday,
    isSelected,
    getEventsForDate,
    getWorkoutForDate,
}: MonthGridProps) => {
    const flashListRef = useRef<any>(null);
    const hasInitialized = useRef(false);

    // Initial scroll to center
    useEffect(() => {
        if (!hasInitialized.current && weeks.length > 0 && centerOffsetWeeks > 0) {
            hasInitialized.current = true;
            setTimeout(() => {
                flashListRef.current?.scrollToOffset({
                    offset: centerOffsetWeeks * WEEK_ROW_HEIGHT,
                    animated: false,
                });
            }, 100);
        }
    }, [weeks.length, centerOffsetWeeks]);

    const renderWeek = useCallback(({ item, index }: { item: WeekInfo; index: number }) => {
        // Progressive rendering: only render weeks within bufferStage
        if (Math.abs(item.bufferIdx) > bufferStage) {
            return <View style={{ height: WEEK_ROW_HEIGHT }} />;
        }

        const week = item.week;
        const firstValidDay = week.find(d => d !== null);
        const weekTimestamp = firstValidDay ? new Date(firstValidDay.getFullYear(), firstValidDay.getMonth(), firstValidDay.getDate()).getTime() : 0;

        return (
            <WeekRow
                week={week}
                weekIdx={index}
                globalWeekIdx={item.globalIdx}
                selectedWeekIdx={selectedWeekIdx}
                selectedWeekTimestamp={selectedWeekTimestamp}
                selectedDateTimestamp={selectedDateTimestamp}
                multiDayEndDateTimestamp={multiDayEndDateTimestamp}
                calendarHeight={calendarHeight}
                scrollY={scrollY}
                isMultiDay={isMultiDay}
                isAdjacent={false}
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
                onCreateEvent={onCreateEvent}
                weekTimestamp={weekTimestamp}
                monthViewMode={monthViewMode}
            />
        );
    }, [
        bufferStage, selectedWeekIdx, selectedWeekTimestamp, selectedDateTimestamp,
        multiDayEndDateTimestamp, calendarHeight, scrollY, isMultiDay, isToday,
        isSelected, selectedDate, events, schedule, getEventsForDate, getWorkoutForDate,
        handleDayPress, isCollapsed, selectionAnim, onCreateEvent, monthViewMode, weeks.length
    ]);

    const keyExtractor = useCallback((item: WeekInfo) => `${item.monthKey}-${item.globalIdx}`, []);

    const handleScrollEndEvent = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (onScrollEnd) {
            const offset = e.nativeEvent.contentOffset.y;
            const weekIdx = Math.round(offset / WEEK_ROW_HEIGHT);

            // Calculate which month is visible
            let count = 0;
            let monthIdx = -1;
            let prevMonthKey = '';
            for (let i = 0; i < weeks.length; i++) {
                if (weeks[i].monthKey !== prevMonthKey) {
                    if (weekIdx < count + 1) {
                        monthIdx = i;
                        break;
                    }
                    prevMonthKey = weeks[i].monthKey;
                }
                count++;
            }

            onScrollEnd(monthIdx, offset);
        }
    }, [onScrollEnd, weeks]);

    return (
        <View style={styles.container}>
            <FlashList
                ref={flashListRef}
                data={weeks}
                renderItem={renderWeek}
                keyExtractor={keyExtractor}
                onMomentumScrollEnd={handleScrollEndEvent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
