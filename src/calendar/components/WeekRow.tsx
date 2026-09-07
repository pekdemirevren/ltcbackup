import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
} from 'react-native-reanimated';
import { DayCell } from './DayCell';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';
import { CalendarConfig, WEEK_ROW_HEIGHT } from '../config/CalendarConfig';
import type { CalendarEvent } from '../models/Event';
import type { MonthViewMode } from '../models/ViewMode';

const DAY_VIEW_HEIGHT = CalendarConfig.heights.dayView;
const MONTH_VIEW_HEIGHT = CalendarConfig.heights.monthView;

export interface WeekRowProps {
    week: (Date | null)[];
    weekIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    selectedWeekTimestamp: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>;
    multiDayEndDateTimestamp: SharedValue<number>;
    calendarHeight: SharedValue<number>;
    scrollY: SharedValue<number>;
    isMultiDay: boolean;
    isAdjacent: boolean;
    isToday: (date: Date | null) => boolean;
    isSelected: (date: Date | null, selected: Date | null) => boolean;
    getEventsForDate: (date: Date | null) => CalendarEvent[];
    getWorkoutForDate: (date: Date | null) => WorkoutDayType | null;
    selectedDate: Date;
    events: CalendarEvent[];
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

export const WeekRow = React.memo(({
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
    const hasSelectedDay = useMemo(
        () => week.some(day => day && isSelected(day, selectedDate)),
        [week, isSelected, selectedDate]
    );

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

        const isCollapsedNow = calendarHeight.value <= DAY_VIEW_HEIGHT + 10;
        if (isCollapsedNow) {
            const isSelectedWeek = Math.abs(weekTimestamp - selectedWeekTimestamp.value) < 1000 * 60 * 60;
            return {
                opacity: isSelectedWeek ? 1 : 0,
                transform: [{ translateY: 0 }],
                zIndex: isSelectedWeek ? 100 : 0,
            };
        }

        if (calendarHeight.value >= MONTH_VIEW_HEIGHT - 1) {
            return { opacity: 1, transform: [{ translateY: 0 }], zIndex: 1 };
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

        const heroEasedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (isSelectedWeek) {
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

        const baseProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const rowExitProgress = isAbove
            ? Math.pow(baseProgress, 6)
            : baseProgress;

        const rowEasedProgress = 1 - Math.pow(1 - rowExitProgress, 3);

        const direction = isAbove ? -1 : 1;
        const slideDistance = (rowsAway + 1) * WEEK_ROW_HEIGHT * 2.8;
        const translateY = direction * slideDistance * (1 - rowEasedProgress);
        const opacity = interpolate(rowEasedProgress, [0, 0.3, 1], [0, 0.5, 1], 'clamp');

        return {
            opacity,
            transform: [{ translateY }],
            zIndex: progress === 1 ? 1 : (isAbove ? 110 : 1),
        };
    }, [globalWeekIdx]);

    const rowHeight = monthViewMode === 'list' ? 48 : WEEK_ROW_HEIGHT;

    return (
        <Animated.View
            style={[
                styles.weekRow,
                { height: rowHeight },
                monthViewMode !== 'list' && styles.weekRowBorder,
                weekAnimatedStyle
            ]}
        >
            {week.map((day, dayIdx) => {
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
            })}
        </Animated.View>
    );
}, (prevProps, nextProps) => {
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

const styles = StyleSheet.create({
    weekRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 0,
    },
    weekRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
});
