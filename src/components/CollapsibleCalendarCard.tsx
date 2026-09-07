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
    Alert,
    ActivityIndicator,
    Animated as RNAnimated,
    Easing as RNEasing,
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
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlass, LiquidGlassCard, LiquidGlassMenuItem } from './LiquidGlass';
import { WORKOUT_DAY_COLORS, WorkoutDayType, loadWorkoutDayCards, setWorkoutDayForDate, getWorkoutDayForDate, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';

import { TimerContext } from '../contexts/TimerContext';
import YearCalendarModal from './YearCalendarModal';
import Theme, { colors } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { allWorkouts, Workout } from '../constants/workoutData';
import MetricColors from '../constants/MetricColors';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useNavigation } from '@react-navigation/native';
import { useTabBar } from '../contexts/TabBarContext';

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
    COLLAPSE_DURATION: 400, // Daha yavaş ve smooth
    TIMELINE_DURATION: 350, // Timeline için
    FADE_DURATION: 280,
    SPRING_CONFIG: { damping: 25, stiffness: 120 },
    EASING: Easing.bezier(0.25, 0.1, 0.25, 1) // CSS ease - çok smooth
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
    'PUSH DAY',
    'PULL DAY',
    'OFF DAY',
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
    selectedDateTimestamp: SharedValue<number>; // NEW: for reactive selection
    calendarHeight: SharedValue<number>;
    scrollY: SharedValue<number>;
    isAdjacent: boolean;
    isToday: (date: Date | null) => boolean;
    isSelected: (date: Date | null) => boolean;
    getEventsForDate: (date: Date | null) => Event[];
    getWorkoutForDate: (date: Date | null) => WorkoutDayType | null;
    handleDayPress: (date: Date) => void;
    weeksLength: number;
    isCalendarCollapsed: boolean;
    selectionAnim: SharedValue<number>;
    onNavigateToDetail?: (date: Date) => void;
    onCreateEvent?: (date: Date) => void;
}

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
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    weekdayRow: {
        flexDirection: 'row',
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 4,
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
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
        backgroundColor: '#FF3B30',
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCircle: {
        backgroundColor: '#FFFFFF',
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayNumber: {
        fontSize: 19,
        color: '#FFFFFF',
        fontWeight: '600',
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
        color: '#666666',
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
        height: 50,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    timeText: {
        width: 50,
        textAlign: 'center',
        fontSize: 11,
        color: '#8E8E93',
        marginTop: -8,
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
        color: '#8E8E93',
        fontSize: 14,
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
        bottom: 120, // Moved up another 10px (from 110)
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
        paddingBottom: 72, // Moved up another 10px (from 62)
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#2C2C2E',
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


// ✅ NEW: STANDALONE DAY CELL COMPONENT
interface DayCellProps {
    day: Date | null;
    dayIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    selectionAnim: SharedValue<number>;
    selectedDateTimestamp: SharedValue<number>; // NEW: for reactive selection
    isCalendarCollapsed: boolean;
    isToday: (d: Date) => boolean;
    isSelected: (d: Date) => boolean;
    handleDayPress: (d: Date) => void;
    getEventsForDate: (d: Date) => any[];
    getWorkoutForDate: (d: Date) => WorkoutDayType | null;
    eventOpacity: any;
    hasSelectedDayInWeek: boolean;
    isAdjacent?: boolean;
    onNavigateToDetail?: (date: Date) => void;
    onCreateEvent?: (date: Date) => void;
}

function DayCell({
    day,
    dayIdx,
    globalWeekIdx,
    selectedWeekIdx,
    selectionAnim,
    selectedDateTimestamp,
    isCalendarCollapsed,
    isToday,
    isSelected,
    handleDayPress,
    getEventsForDate,
    getWorkoutForDate,
    eventOpacity,
    hasSelectedDayInWeek,
    isAdjacent = false,
    onNavigateToDetail,
    onCreateEvent,
}: DayCellProps) {
    if (!day) return <View style={styles.dayCell} />;

    const isTodayDay = isToday(day);
    const selected = isSelected(day);
    const today = isTodayDay && (!hasSelectedDayInWeek || selected);
    const isTodayHidden = isTodayDay && !today;
    const dayEvents = getEventsForDate(day);
    const workout = getWorkoutForDate(day);

    // Sadece seçili satır için beyaz daire görünür olsun
    const selectionCircleStyle = useAnimatedStyle(() => {
        "worklet";
        const isSelectedWeek = isCalendarCollapsed
            ? true
            : Math.abs(globalWeekIdx - selectedWeekIdx.value) < 0.5;

        if (!isSelectedWeek) return { opacity: 0 };
        return { opacity: selectionAnim.value };
    }, [globalWeekIdx, isCalendarCollapsed]);

    return (
        <TouchableOpacity
            style={styles.dayCell}
            onPress={() => !isAdjacent && handleDayPress(day)}
            onLongPress={() => !isAdjacent && day && onCreateEvent && onCreateEvent(day)}
            delayLongPress={800}
            activeOpacity={1}
            disabled={isAdjacent}
        >
            {/* ✅ YEDEK DOSYADAKİ GİBİ: 3 AYRI CONDITIONAL RENDER */}

            {/* Beyaz daire - sadece seçili ve bugün olmayan günler için */}
            {selected && !today && (
                <Animated.View style={[styles.selectedCircle, selectionCircleStyle]}>
                    <Text style={[
                        styles.dayNumber,
                        styles.dayNumberSelected,
                        isAdjacent && { opacity: 0.3 }
                    ]}>
                        {day.getDate()}
                    </Text>
                </Animated.View>
            )}

            {/* Kırmızı daire - bugün için */}
            {today && (
                <View style={styles.todayCircle}>
                    <Text style={[styles.dayNumber, styles.todayNumber]}>
                        {day.getDate()}
                    </Text>
                </View>
            )}

            {/* Normal gün - seçili değil ve bugün değil */}
            {!selected && !today && (
                <View style={styles.dayCircle}>
                    <Text style={[
                        styles.dayNumber,
                        isTodayHidden && { color: '#FF3B30' },
                        dayIdx >= 5 && !isTodayHidden && styles.weekendDayText,
                        isAdjacent && { opacity: 0.3 }
                    ]}>
                        {day.getDate()}
                    </Text>
                </View>
            )}

            {eventOpacity && (
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
            )}
        </TouchableOpacity>
    );
}

function WeekRow({
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
    getEventsForDate,
    getWorkoutForDate,
    handleDayPress,
    weeksLength,
    isCalendarCollapsed,
    selectionAnim,
    onNavigateToDetail,
    onCreateEvent,
}: WeekRowProps) {
    const hasSelectedDay = useMemo(() => week.some(day => day && isSelected(day)), [week, isSelected]);

    const eventOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 50, DAY_VIEW_HEIGHT + 150],
            [0, 0, 1],
            'clamp'
        )
    }));

    const weekAnimatedStyle = useAnimatedStyle(() => {
        "worklet";
        // ═══════════════════════════════════════════════════════════════════
        // iOS CALENDAR ANİMASYONU - DÜZELTILMIŞ
        // ═══════════════════════════════════════════════════════════════════
        // 
        // progress: 0 = Day view (collapsed), 1 = Month view (expanded)
        // 
        // Mantık:
        // - Seçili satır: Ekrandaki pozisyonundan header altına (0) kayar
        // - Üstteki satırlar: Sadece yukarı kayıp kaybolur (bağımsız)
        // - Alttaki satırlar: Sadece aşağı kayıp kaybolur (bağımsız)
        // ═══════════════════════════════════════════════════════════════════

        const progress = interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [0, 1],
            'clamp'
        );

        // Bu satırın ekrandaki görünür Y pozisyonu
        const thisRowOffset = globalWeekIdx * WEEK_ROW_HEIGHT;
        const currentScroll = scrollY.value;
        const thisRowScreenY = thisRowOffset - currentScroll;

        // Bu satır seçili mi?
        const isSelectedWeek = Math.abs(globalWeekIdx - selectedWeekIdx.value) < 0.5;

        // Bu satırın seçili satıra göre pozisyonu
        const relativeIndex = globalWeekIdx - selectedWeekIdx.value;
        const rowsAway = Math.abs(relativeIndex);
        const isAbove = relativeIndex < 0;

        // Smooth easing - daha yavaş ve akıcı
        const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (isSelectedWeek) {
            // ═══════════════════════════════════════════════════════
            // SEÇİLİ HAFTA: Ekran pozisyonundan header altına kay
            // ═══════════════════════════════════════════════════════
            // progress=1 (Month): translateY = 0 (yerinde)
            // progress=0 (Day): translateY = -thisRowScreenY (header'da)

            const translateY = -thisRowScreenY * (1 - easedProgress);

            return {
                opacity: 1,
                transform: [{ translateY }],
                zIndex: 100,
            };
        }

        // ═══════════════════════════════════════════════════════
        // DİĞER SATIRLAR: Bağımsız olarak yukarı/aşağı kayıp kaybolur
        // Seçili satırla birlikte hareket ETMİYORLAR
        // ═══════════════════════════════════════════════════════

        // Stagger efekti: Yakın satırlar önce, uzak satırlar sonra
        const staggerDelay = Math.min(rowsAway * 0.08, 0.3);
        const adjustedProgress = interpolate(progress, [staggerDelay, 1], [0, 1], 'clamp');

        // Daha yumuşak easing
        const rowEasedProgress = adjustedProgress < 0.5
            ? 2 * adjustedProgress * adjustedProgress
            : 1 - Math.pow(-2 * adjustedProgress + 2, 2) / 2;

        // Kayma mesafesi: Satırın ekrandan çıkması için gereken mesafe
        // Üstteki satırlar: Yukarı çık (negatif)
        // Alttaki satırlar: Aşağı çık (pozitif)
        const direction = isAbove ? -1 : 1;

        // Kayma miktarı: Satır sayısına göre artan mesafe
        const slideDistance = WEEK_ROW_HEIGHT * (1.5 + rowsAway * 0.5);

        // progress=1 (Month): translateY = 0 (yerinde)
        // progress=0 (Day): translateY = direction * slideDistance (kaymış)
        const translateY = direction * slideDistance * (1 - rowEasedProgress);

        // Opacity: Kayarken fade out
        const opacity = interpolate(rowEasedProgress, [0, 0.3, 1], [0, 0.3, 1], 'clamp');

        return {
            opacity,
            transform: [{ translateY }],
            zIndex: 1,
        };
    }, [globalWeekIdx]);


    // Calculate connected pill for Multi Day mode
    return (
        <Animated.View
            style={[
                {
                    flexDirection: 'row',
                    height: WEEK_ROW_HEIGHT,
                    alignItems: 'flex-start',
                    paddingHorizontal: 0,
                },
                weekIdx !== weeksLength - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: '#333',
                },
                weekAnimatedStyle
            ]}
        >
            {
                week.map((day, dayIdx) => (
                    <DayCell
                        key={day ? day.toISOString() : `empty-${dayIdx}`}
                        day={day}
                        dayIdx={dayIdx}
                        globalWeekIdx={globalWeekIdx}
                        selectedWeekIdx={selectedWeekIdx}
                        selectedDateTimestamp={selectedDateTimestamp}
                        selectionAnim={selectionAnim}
                        isCalendarCollapsed={isCalendarCollapsed}
                        isToday={isToday}
                        isSelected={isSelected}
                        handleDayPress={handleDayPress}
                        getEventsForDate={getEventsForDate}
                        getWorkoutForDate={getWorkoutForDate}
                        eventOpacity={eventOpacity}
                        hasSelectedDayInWeek={week.some(d => d && isSelected(d))}
                        onNavigateToDetail={onNavigateToDetail}
                        onCreateEvent={onCreateEvent}
                    />
                ))
            }
        </Animated.View >
    );
}

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
}

function TimeSlotContent({
    date,
    hour,
    dayEvents,
    workout,
    availableWidth,
    leftOffsetBase,
    onCreateEvent,
    onEventPress,
    onWorkoutDayPress,
}: TimeSlotContentProps) {
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
                    // Navigation removed per user request: calendar timeline should not navigate to DailySummaryDetail
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
                            backgroundColor: WORKOUT_DAY_COLORS[workout] + '20',
                            borderLeftColor: WORKOUT_DAY_COLORS[workout]
                        }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onWorkoutDayPress && onWorkoutDayPress(date, workout)}
                >
                    <Text style={[styles.timelineCardTitle, { color: WORKOUT_DAY_COLORS[workout] }]} numberOfLines={1}>{workout}</Text>
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
                                backgroundColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] + '30' : '#2C2C2E60',
                                borderLeftColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#8E8E93'
                            }
                        ]}
                        onPress={() => onEventPress && onEventPress(event)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.timelineCardTitle, { color: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#FFF' }]} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.timelineCardTime} numberOfLines={1}>{event.startTime} - {event.endTime}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

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
}: TimeSlotItemProps) {
    const hour = parseInt(time.split(':')[0]);
    const availableWidth = SCREEN_WIDTH - 50 - 12; // Adjusted for styles.timeText width

    return (
        <View style={styles.timeSlot}>
            <Text style={styles.timeText}>{time}</Text>
            <View style={styles.timeLine} />
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
            />
        </View>
    );
}




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
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);



    // Navigation hook as fallback
    const navigationHook = useNavigation<StackNavigationProp<RootStackParamList>>();
    const nav = navigation || navigationHook;

    // Hide bottom tab bar using TabBarContext
    const { hideTabBar, showTabBar } = useTabBar();

    useEffect(() => {
        // Method 1: TabBarContext
        hideTabBar();

        // Method 2: Direct navigation setOptions (backup for native tab bar)
        nav.getParent()?.setOptions({
            tabBarStyle: {
                height: 0,
                minHeight: 0,
                maxHeight: 0,
                display: 'none',
                opacity: 0,
                position: 'absolute',
                bottom: -100,
            },
        });

        return () => {
            showTabBar();
            // Restore tab bar on unmount
            nav.getParent()?.setOptions({
                tabBarStyle: {
                    backgroundColor: 'rgba(36,43,55,0.8)',
                    height: 85,
                    paddingBottom: 5,
                    paddingTop: 5,
                    display: 'flex',
                    opacity: 1,
                    position: 'relative',
                    bottom: 0,
                },
            });
        };
    }, [hideTabBar, showTabBar, nav]);

    // Workout Day Picker Modal State (for selecting workout day for a date)
    const [showWorkoutDayPicker, setShowWorkoutDayPicker] = useState(false);
    const [workoutDayPickerDate, setWorkoutDayPickerDate] = useState<Date>(new Date());
    const [selectedWorkoutDayForPicker, setSelectedWorkoutDayForPicker] = useState<WorkoutDayType>('LEG DAY');
    const workoutDayPickerSlideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;




    const [showViewMenu, setShowViewMenu] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [viewMenuPosition, setViewMenuPosition] = useState({ top: 0, right: 20 });
    const viewButtonRef = useRef<View>(null);
    const viewMenuAnimation = useRef(new RNAnimated.Value(0)).current;





    // Update state when props change (for navigating back from event detail)
    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    useEffect(() => {
        if (initialSelectedDate) {
            setSelectedDate(initialSelectedDate);
            setCurrentMonth(initialSelectedDate);
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

    const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
    const prevMonthDays = useMemo(() => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        return getDaysInMonth(prev);
    }, [currentMonth]);
    const nextMonthDays = useMemo(() => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        return getDaysInMonth(next);
    }, [currentMonth]);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    const prevWeekDays = useMemo(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 7);
        return getWeekDays(prev);
    }, [selectedDate]);
    const nextWeekDays = useMemo(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 7);
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


    // Animasyon değerleri
    const calendarHeight = useSharedValue(MONTH_VIEW_HEIGHT);
    const selectedWeekIdx = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const dateTitleAnim = useSharedValue(0);
    const selectionAnim = useSharedValue(1); // Seçili gün dairesi görünür başlasın
    const selectedDateTimestamp = useSharedValue(selectedDate.setHours(0, 0, 0, 0)); // NEW: for reactive selection
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

    // ✅ New refs for multi-day frozen column sync
    const multiDayHorizontalHeaderScrollRef = useRef<ScrollView>(null);
    const multiDayHorizontalContentScrollRef = useRef<ScrollView>(null);
    const multiDayVerticalTimeScrollRef = useRef<ScrollView>(null);
    const multiDayVerticalContentScrollRef = useRef<ScrollView>(null);

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
            week.some(day => day && day.toDateString() === selectedDate.toDateString())
        );
        if (weekIdx !== -1 && selectedWeekIdx.value !== weekIdx) {
            selectedWeekIdx.value = weekIdx;
        }
        // Sync selectedDateTimestamp for reactive DayCell updates
        const newTimestamp = new Date(selectedDate).setHours(0, 0, 0, 0);
        if (selectedDateTimestamp.value !== newTimestamp) {
            selectedDateTimestamp.value = newTimestamp;
        }
    }, [selectedDate, weeks, prevMonthWeeks, nextMonthWeeks]);


    const handleNextMonth = useCallback(() => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(next);
    }, [currentMonth]);

    const handlePrevMonth = useCallback(() => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prev);
    }, [currentMonth]);

    const handleNextDay = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        setSelectedDate(next);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === next.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handlePrevDay = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        setSelectedDate(prev);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === prev.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handleNextWeek = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 7);
        setSelectedDate(next);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === next.toDateString())
        );
        if (weekIdx !== -1) {
            selectedWeekIdx.value = weekIdx;
        }

        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth, prevMonthWeeks, weeks, nextMonthWeeks]);

    const handlePrevWeek = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 7);
        setSelectedDate(prev);

        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === prev.toDateString())
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
            const prevDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
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

    // Pan gesture handler - only for card height (collapse/expand)
    const panGesture = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-10, 10])
        .onUpdate((event) => {
            const { translationY } = event;

            if (isCollapsed) {
                // Vertical drag in day view can expand to month view
                if (translationY > 0) {
                    calendarHeight.value = Math.min(MONTH_VIEW_HEIGHT, DAY_VIEW_HEIGHT + translationY);
                    // Seçim dairesini expand sırasında fade out yapma
                    selectionAnim.value = 1; // Genişleme sırasında görünür kalsın
                }
            } else {
                // Vertical drag in month view can collapse
                if (translationY < 0 && Math.abs(translationY) > 50) {
                    calendarHeight.value = Math.max(DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT + translationY);
                    // Collapse sırasında gizli tut
                    selectionAnim.value = 1; // Collapse sırasında da görünür kalsın
                }

            }
        })
        .onEnd((event) => {
            const { translationY, velocityY } = event;

            if (isCollapsed) {
                // Day view'dayken yukarı çekme
                if (translationY > 100 || velocityY > 500) {
                    // Month view'a genişlet
                    calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG, (finished) => {
                        'worklet';
                        if (finished) {
                            runOnJS(resetToMonthView)();
                        }
                    });
                    selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION });
                    dateTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION });
                    timelineAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION });
                    monthTitleAnim.value = 1; // Anında görünür
                } else {
                    // Day view'da kal
                    calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG);
                    selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION });
                }
            } else {
                // Month view'dayken aşağı çekme
                if (calendarHeight.value < (MONTH_VIEW_HEIGHT + DAY_VIEW_HEIGHT) / 2) {
                    // Snap to Day - seçili gün olmadan collapse yapılamaz, bu durumda month'a dön
                    calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, {
                        duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                        easing: ANIMATION_CONFIG.EASING,
                    });
                } else {
                    // Snap to Month (zaten month view'dayız)
                    calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, {
                        duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                        easing: ANIMATION_CONFIG.EASING,
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
                // Day view'a geçerken - beyaz daireyi delay ile göster
                dateTitleAnim.value = withDelay(150, withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }));
                selectionAnim.value = withDelay(150, withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }));
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
        return {
            opacity: timelineAnim.value,
            zIndex: 0,
            // Aşağıdan yukarı kayarak yerleşme animasyonu
            transform: [{
                translateY: interpolate(
                    timelineAnim.value,
                    [0, 1],
                    [100, 0] // 0'da 100px aşağıda, 1'de yerinde
                )
            }],
        };
    });


    const weekContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 200], // Daha geniş aralık - smooth geçiş
                [1, 0],
                'clamp'
            ),
            zIndex: 30,
            transform: [
                {
                    translateY: interpolate(
                        calendarHeight.value,
                        [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                        [0, -10] // Daha yumuşak kayma
                    )
                }
            ],
            display: 'flex',
        };
    });


    const monthGridStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 200], // Daha geniş aralık - smooth geçiş
                [0, 1],
                'clamp'
            ),
            height: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT]
            ),
            zIndex: 10, // Ensure it stays on top of timeline
            overflow: 'visible', // Attempt to let flying rows show
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
        transform: [{
            // İçeriden dışarıya büyüme animasyonu
            scale: interpolate(
                selectionAnim.value,
                [0, 1],
                [0.3, 1] // Küçükten büyüğe
            )
        }]
    }), []);




    useEffect(() => {
        // Initialize scrollY to the offset of the current month
        // This ensures animation works even if user hasn't scrolled yet
        scrollY.value = prevMonthWeeks.length * WEEK_ROW_HEIGHT;
    }, [prevMonthWeeks, scrollY]);

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const now = new Date();
        return date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
    };

    const isSelected = useCallback((date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    }, [selectedDate]);


    const getEventsForDate = (date: Date | null) => {
        if (!date) return [];
        const dateKey = formatDateKey(date);
        return events.filter(e => {
            // Handle both ISO format and YYYY-MM-DD format
            const eventDateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
            return eventDateStr === dateKey;
        });
    };

    const getWorkoutForDate = (date: Date | null) => {
        if (!date) return null;
        const dateKey = formatDateKey(date);
        return schedule[dateKey] || null;
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


    const handleDayPress = (date: Date) => {
        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === date.toDateString())
        );

        if (weekIdx !== -1) {
            setSelectedDate(date);
            onDayPress?.(date);

            if (isCollapsed) {
                // Day view'da farklı bir güne tıklandığında
                cancelAnimation(selectionAnim);
                selectedWeekIdx.value = weekIdx;
                selectionAnim.value = 1;
                return;
            }

            // ═══════════════════════════════════════════════════════
            // iOS Calendar Style: Collapse Animation
            // ═══════════════════════════════════════════════════════

            // Sadece seçili hafta index'ini güncelle
            selectedWeekIdx.value = weekIdx;

            // Önceki animasyonları iptal et
            cancelAnimation(selectionAnim);
            cancelAnimation(dateTitleAnim);
            cancelAnimation(calendarHeight);
            cancelAnimation(timelineAnim);
            cancelAnimation(monthTitleAnim);

            // Değerleri anında sıfırla
            selectionAnim.value = 0;
            dateTitleAnim.value = 0;
            timelineAnim.value = 0;

            // Ana animasyon config
            const animConfig = {
                duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
                easing: ANIMATION_CONFIG.EASING,
            };

            // Timeline için daha hızlı config (iskambil kağıdı efekti)
            const timelineConfig = {
                duration: ANIMATION_CONFIG.TIMELINE_DURATION,
                easing: ANIMATION_CONFIG.EASING,
            };

            // Timestamp'i worklet dışında hesapla
            const dateTimestamp = date.getTime();

            // Scroll'u animasyon başlamadan önce ayarla
            scrollTimelineToPosition(dateTimestamp);

            // Beyaz daire
            selectionAnim.value = withTiming(1, animConfig);
            // Date title: FadeInRight
            dateTitleAnim.value = withTiming(1, animConfig);
            // Timeline: Daha hızlı iskambil animasyonu
            timelineAnim.value = withTiming(1, timelineConfig);
            // Month title: Ghost fade out (kaybolma)
            monthTitleAnim.value = withTiming(0, animConfig);

            // Ana collapse animasyonu
            calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, animConfig, (finished) => {
                "worklet";
                if (finished) {
                    runOnJS(setIsCollapsed)(true);
                }
            });
        } else {
            setSelectedDate(date);
            onDayPress?.(date);
        }
    };


    const handleTodayPress = () => {
        const today = new Date();

        // Calculate week index
        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === today.toDateString())
        );

        setSelectedDate(today);
        setCurrentMonth(today);

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
        calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, animConfig, (finished) => {
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
        (navigation as any).navigate('WorkoutEventDetail', {
            eventId: event.id,
            date: event.date
        });
    };



    // ═══════════════════════════════════════════════════════════════
    // WORKOUT DAY PICKER HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const handleWorkoutDayPress = async (date: Date, currentWorkoutDay: WorkoutDayType | null) => {
        if (!currentWorkoutDay) return;

        // Navigation and fullscreen close removed per user request: calendar timeline should not navigate to DailySummaryDetail

    };

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





    const handleNavigateToDailyDetail = (date: Date) => {
        // Navigation removed per user request: calendar should not navigate to DailySummaryDetail
        /*
        const dateStr = date.toISOString().split('T')[0];
        nav.navigate('DailySummaryDetail', {
            workoutDay: selectedWorkoutDay,
            date: dateStr,
        });
        */
    };

    const handleOpenCreateEvent = (date: Date) => {
        if (onCreateEvent) {
            onCreateEvent(date);
        } else {
            (navigation as any).navigate('CreateWorkoutEventScreen', {
                date: date.toISOString()
            });
        }
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
            calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, { duration: ANIMATION_CONFIG.COLLAPSE_DURATION });
            dateTitleAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Month view'da 0
            selectionAnim.value = withTiming(1, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Görünür kalsın
            timelineAnim.value = withTiming(0, { duration: ANIMATION_CONFIG.FADE_DURATION }); // ✅ Timeline sıfırla
            setIsCollapsed(false);
        }

    };

    const timeSlots = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    }, []);

    const renderListPane = (date: Date) => {
        const dayEvents = getEventsForDate(date);
        const workout = getWorkoutForDate(date);

        return (
            <View style={styles.timelinePane}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>
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

        // ============ GOOGLE SHEETS LAYOUT: FROZEN COLUMN + SYNCED HEADERS ============
        if (daySubMode === 'multi') {
            // 7 günlük range oluştur (-3 günden +3 güne kadar)
            const days: Date[] = [];
            for (let i = -3; i <= 3; i++) {
                const d = new Date(date.getTime() + (i * 86400000));
                days.push(d);
            }

            const TIME_COLUMN_WIDTH = 50;
            const DAY_COLUMN_WIDTH = 200;
            const HEADER_HEIGHT = 36;

            return (
                <View style={styles.timelinePane}>
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* ROW 1: HEADER (Empty Corner + Date Headers)                     */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <View style={{ flexDirection: 'row', height: HEADER_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#2C2C2E' }}>
                        {/* Top-left corner (frozen in both directions) */}
                        <View style={{ width: TIME_COLUMN_WIDTH, borderRightWidth: 0.5, borderRightColor: '#2C2C2E' }} />

                        {/* Date Headers - scrollEnabled=false, synced to content horizontal */}
                        <ScrollView
                            ref={isCenter ? multiDayHorizontalHeaderScrollRef : undefined}
                            horizontal
                            scrollEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            style={{ flex: 1 }}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                {days.map((d, idx) => (
                                    <View key={idx} style={{
                                        width: DAY_COLUMN_WIDTH,
                                        height: HEADER_HEIGHT,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRightWidth: 0.5,
                                        borderRightColor: '#2C2C2E'
                                    }}>
                                        <Text style={[styles.multiDayHeaderText, isToday(d) && { color: '#FF3B30' }]}>
                                            {WEEKDAYS_SHORT[d.getDay()]} {d.getDate()} {MONTHS_SHORT[d.getMonth()]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* ROW 2: CONTENT - Time Column (frozen) + Grid (2D scroll)        */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        {/* TIME COLUMN - Fixed 50px, synced to content's vertical scroll */}
                        <ScrollView
                            ref={isCenter ? multiDayVerticalTimeScrollRef : undefined}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 150 }}
                            style={{
                                width: TIME_COLUMN_WIDTH,
                                minWidth: TIME_COLUMN_WIDTH,
                                maxWidth: TIME_COLUMN_WIDTH,
                                flexShrink: 0,
                                flexGrow: 0,
                                borderRightWidth: 0.5,
                                borderRightColor: '#2C2C2E'
                            }}
                        >
                            {timeSlots.map((time) => (
                                <View key={time} style={{ height: SLOT_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#2C2C2E' }}>
                                    <Text style={styles.timeText}>{time}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* GRID AREA - flex:1, horizontal outer + vertical inner with explicit widths */}
                        <ScrollView
                            ref={isCenter ? multiDayHorizontalContentScrollRef : undefined}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={1}
                            bounces={false}
                            onScroll={isCenter ? (e) => {
                                const offsetX = e.nativeEvent.contentOffset.x;
                                multiDayHorizontalHeaderScrollRef.current?.scrollTo({ x: offsetX, y: 0, animated: false });
                            } : undefined}
                            style={{ flex: 1 }}
                        >
                            <ScrollView
                                ref={isCenter ? multiDayVerticalContentScrollRef : undefined}
                                showsVerticalScrollIndicator={false}
                                scrollEventThrottle={1}
                                bounces={false}
                                contentContainerStyle={{ paddingBottom: 150 }}
                                style={{ width: days.length * DAY_COLUMN_WIDTH }}
                                onScroll={isCenter ? (e) => {
                                    const offsetY = e.nativeEvent.contentOffset.y;
                                    multiDayVerticalTimeScrollRef.current?.scrollTo({ y: offsetY, animated: false });
                                } : undefined}
                            >
                                {timeSlots.map((time) => {
                                    const hour = parseInt(time.split(':')[0]);
                                    return (
                                        <View key={time} style={{ flexDirection: 'row', height: SLOT_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#2C2C2E' }}>
                                            {days.map((d, idx) => (
                                                <View key={idx} style={{ width: DAY_COLUMN_WIDTH, borderRightWidth: 0.5, borderRightColor: '#2C2C2E' }}>
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
                                                    />
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </ScrollView>
                    </View>
                </View>
            );
        }

        // ============ SINGLE DAY MODE (unchanged) ============
        return (
            <View style={styles.timelinePane}>
                <Animated.View style={[styles.dayHeader, dateTitleStyle]}>
                    <Text style={styles.dayHeaderText}>
                        {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()} • {WEEKDAYS_FULL[date.getDay()]}
                    </Text>
                </Animated.View>

                <ScrollView
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
                                key={time}
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
                </ScrollView>
            </View>
        );
    };

    const renderDayCell = (day: Date | null, idx: number, isAdjacent = false) => {
        return (
            <DayCell
                key={idx}
                day={day}
                dayIdx={idx}
                globalWeekIdx={0} // Not used in this context
                selectedWeekIdx={selectedWeekIdx}
                selectedDateTimestamp={selectedDateTimestamp}
                selectionAnim={selectionAnim}
                isCalendarCollapsed={isCollapsed}
                isToday={isToday}
                isSelected={isSelected}
                handleDayPress={handleDayPress}
                getEventsForDate={getEventsForDate}
                getWorkoutForDate={getWorkoutForDate}
                eventOpacity={null} // Don't show events in small grid
                hasSelectedDayInWeek={false} // Simple grid doesn't need this logic for style
                isAdjacent={isAdjacent}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
            />
        );
    };



    const renderWeekRow = (week: (Date | null)[], weekIdx: number, isAdjacent = false, globalOffset = 0, monthKey: string = 'current') => {
        const globalWeekIdx = globalOffset + weekIdx;
        // Create unique key using month identifier and week index
        const uniqueKey = `${monthKey}-week-${weekIdx}`;
        return (
            <WeekRow
                key={uniqueKey}
                week={week}
                weekIdx={weekIdx}
                globalWeekIdx={globalOffset + weekIdx}
                selectedWeekIdx={selectedWeekIdx}
                selectedDateTimestamp={selectedDateTimestamp}
                calendarHeight={calendarHeight}
                scrollY={scrollY}
                isAdjacent={isAdjacent}
                isToday={isToday}
                isSelected={isSelected}
                getEventsForDate={getEventsForDate}
                getWorkoutForDate={getWorkoutForDate}
                handleDayPress={handleDayPress}
                weeksLength={weeks.length}
                isCalendarCollapsed={isCollapsed}
                selectionAnim={selectionAnim}
                onNavigateToDetail={handleNavigateToDailyDetail}
                onCreateEvent={handleOpenCreateEvent}
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
                                            {isCollapsed ? MONTHS_FULL[currentMonth.getMonth()] : '2026'}
                                        </Text>
                                    </TouchableOpacity>
                                </RNAnimated.View>

                                <RNAnimated.View style={[
                                    styles.headerRightPill,
                                    {
                                        opacity: viewButtonOpacity,
                                        transform: [
                                            { scale: viewButtonScale },
                                            { translateX: viewButtonTranslateX }
                                        ]
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
                                    <TouchableOpacity onPress={() => handleOpenCreateEvent(selectedDate)} style={styles.headerRightIcon} activeOpacity={1}>
                                        <Feather name="plus" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />
                                    <TouchableOpacity onPress={onFullScreenPress} style={styles.headerRightIcon} activeOpacity={1}>
                                        <Feather name="x" size={22} color="#FFF" />
                                    </TouchableOpacity>
                                </RNAnimated.View>
                            </View>

                            {/* Month Title - visible only in month view */}
                            <Animated.View style={[styles.monthTitleContainer, monthTitleStyle]}>
                                <Animated.Text style={[styles.monthTitle, monthTitleTextStyle]}>{MONTHS_FULL[currentMonth.getMonth()]}</Animated.Text>
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
                                    const prevMonth = new Date(currentMonth);
                                    prevMonth.setMonth(currentMonth.getMonth() - 1);
                                    const monthKey = `prev-${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, true, 0, monthKey);
                                })}
                                {weeks.map((week, weekIdx) => {
                                    const monthKey = `curr-${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, false, prevMonthWeeks.length, monthKey);
                                })}
                                {nextMonthWeeks.map((week, weekIdx) => {
                                    const nextMonth = new Date(currentMonth);
                                    nextMonth.setMonth(currentMonth.getMonth() + 1);
                                    const monthKey = `next-${nextMonth.getFullYear()}-${nextMonth.getMonth()}`;
                                    return renderWeekRow(week, weekIdx, true, prevMonthWeeks.length + weeks.length, monthKey);
                                })}
                            </View>
                        </Animated.ScrollView>
                    </Animated.View>

                    {/* Year View Overlay */}
                    {/* Calendar View Modal */}
                    <Modal
                        transparent
                        visible={showViewMenu}
                        animationType="fade"
                        onRequestClose={() => setShowViewMenu(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => setShowViewMenu(false)}>
                            <View style={styles.goalMenuOverlay} />
                        </TouchableWithoutFeedback>

                        <View
                            style={[
                                styles.goalMenuAnimatedWrapper,
                                {
                                    top: viewMenuPosition.top,
                                    right: viewMenuPosition.right,
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
                        </View>
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
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={handleTimelineScrollEnd}
                                    scrollEventThrottle={16}
                                    contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                                    style={{ flex: 1 }}
                                >
                                    {renderTimelinePane(new Date(selectedDate.getTime() - 86400000))}
                                    {renderTimelinePane(selectedDate, true)}
                                    {renderTimelinePane(new Date(selectedDate.getTime() + 86400000))}
                                </ScrollView>
                            )}
                        </View>
                    </Animated.View>

                </View>

                {/* Bottom navigation */}
                <View style={styles.bottomNav}>
                    <LiquidGlass borderRadius={25} onPress={handleTodayPress}>
                        <View style={styles.todayButton}>
                            <Text style={styles.todayButtonText}>Today</Text>
                        </View>
                    </LiquidGlass>

                    <LiquidGlass borderRadius={25}>
                        <View style={styles.navIconsPill}>
                            <TouchableOpacity
                                onPress={() => setShowYearPicker(true)}
                                style={styles.navIcon}
                                activeOpacity={1}
                            >
                                <Feather name="calendar" size={18} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerRightSeparator} />
                            <TouchableOpacity style={styles.navIcon} activeOpacity={1}>
                                <Feather name="archive" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </LiquidGlass>
                </View >
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
                            <TouchableOpacity onPress={() => handleOpenCreateEvent(selectedDate)} style={styles.headerRightIcon}>
                                <Feather name="plus" size={22} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerRightSeparator} />
                            <TouchableOpacity onPress={() => setShowYearPicker(false)} style={styles.headerRightIcon}>
                                <Feather name="x" size={20} color="#FFF" />
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
                        <LiquidGlass borderRadius={25} onPress={handleTodayPress}>
                            <View style={styles.todayButton}>
                                <Text style={styles.todayButtonText}>Today</Text>
                            </View>
                        </LiquidGlass>

                        <LiquidGlass borderRadius={25}>
                            <View style={styles.navIconsPill}>
                                <TouchableOpacity
                                    onPress={handleYearPress}
                                    style={styles.navIcon}
                                >
                                    <Feather name="calendar" size={18} color="#FFF" />
                                </TouchableOpacity>
                                <View style={styles.headerRightSeparator} />
                                <TouchableOpacity style={styles.navIcon}>
                                    <Feather name="archive" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </LiquidGlass>
                    </View>
                </View>
            </Modal >

            {/* ═══════════════════════════════════════════════════════════════ */}


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

