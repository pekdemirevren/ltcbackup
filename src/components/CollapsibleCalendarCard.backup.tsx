import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    ScrollView,
    Modal,
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
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WORKOUT_DAY_COLORS, WorkoutDayType } from '../utils/WorkoutDayManager';
import YearCalendarModal from './YearCalendarModal';
import Theme, { colors } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iOS Calendar exact heights
const DAY_VIEW_HEIGHT = 60; // Only selected week
const MONTH_VIEW_HEIGHT = SCREEN_HEIGHT * 0.7; // Full month grid - expanded to fill screen
const HEADER_HEIGHT = 60; // Reverted to legacy height
const WEEK_ROW_HEIGHT = 120; // Fixed height for week-by-week scrolling

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ANIMATION_CONFIG = {
    COLLAPSE_DURATION: 600, // 350'den 600'e çıkarıldı - iOS benzeri yumuşak
    FADE_DURATION: 400, // 250'den 400'e
    SPRING_CONFIG: { damping: 25, stiffness: 120 }, // Daha yumuşak spring
    EASING: Easing.bezier(0.25, 0.1, 0.25, 1) // iOS native easing
};



export interface Event {
    id: string;
    title: string;
    workoutDay?: WorkoutDayType;
    date: string;
    startTime?: string;
    endTime?: string;
}

interface CollapsibleCalendarCardProps {
    schedule?: Record<string, WorkoutDayType>;
    events?: Event[];
    onDayPress?: (date: Date) => void;
    onEventPress?: (event: Event) => void;
    onCreateEvent?: (date: Date) => void;
    onFullScreenPress?: () => void;
}

export type ViewMode = 'day' | 'month' | 'year';

// WeekRow component for per-week animations
interface WeekRowProps {
    week: (Date | null)[];
    weekIdx: number;
    globalWeekIdx: number;
    selectedWeekIdx: SharedValue<number>;
    calendarHeight: SharedValue<number>;
    scrollY: SharedValue<number>;
    isAdjacent: boolean;
    isToday: (date: Date | null) => boolean;
    isSelected: (date: Date | null) => boolean;
    getEventsForDate: (date: Date | null) => Event[];
    getWorkoutForDate: (date: Date | null) => WorkoutDayType | null;
    handleDayPress: (date: Date) => void;
    weeksLength: number;
    isCollapsed: boolean;
    selectionAnim: SharedValue<number>;
}

function WeekRow({
    week,
    weekIdx,
    globalWeekIdx,
    selectedWeekIdx,
    calendarHeight,
    scrollY,
    isAdjacent,
    isToday,
    isSelected,
    getEventsForDate,
    getWorkoutForDate,
    handleDayPress,
    weeksLength,
    isCollapsed,
    selectionAnim,
}: WeekRowProps) {
    // YENİ: Bu satırda seçili gün var mı kontrol et (React-based)
    const hasSelectedDay = useMemo(
        () => week.some(day => day && isSelected(day)),
        [week, isSelected]
    );

    // Sadece bu satır seçiliyse beyaz daireyi göster
    const selectionCircleStyle = useAnimatedStyle(() => {
        // Animasyon sırasında hem React state'i hem de animasyon index'ini kullan
        const isSelectedWeek = Math.abs(globalWeekIdx - selectedWeekIdx.value) < 0.5;

        if (!hasSelectedDay || !isSelectedWeek) return { opacity: 0 };

        return {
            opacity: selectionAnim.value
        };
    }, [globalWeekIdx, hasSelectedDay]);




    const eventOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 50, DAY_VIEW_HEIGHT + 150],
            [0, 0, 1], // Daha geç görünmeye başlasın
            'clamp'
        )
    }));


    // Optimized WeekRow animation
    const weekAnimatedStyle = useAnimatedStyle(() => {
        const collapseProgress = interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [1, 0],
            'clamp'
        );

        // Threshold 0.1'den 0.5'e çıkarıldı - daha stabil
        const isSelectedWeek = Math.abs(globalWeekIdx - selectedWeekIdx.value) < 0.5;


        if (isSelectedWeek) {
            return {
                opacity: 1,
                transform: [{ translateY: 0 }],
                zIndex: 10,
            };
        }

        const distance = globalWeekIdx - selectedWeekIdx.value;
        const direction = distance < 0 ? -1 : 1;

        // Daha yumuşak ve optimize edilmiş değerler
        const slideDistance = 300; // 600'den 300'e düşürüldü
        const fadeStart = 0.3; // Daha geç fade başlasın

        return {
            opacity: interpolate(collapseProgress, [0, fadeStart, 1], [1, 1, 0], 'clamp'),
            transform: [{
                translateY: direction * slideDistance * Math.pow(collapseProgress, 1.5) // Easing eklendi
            }],
            zIndex: 1,
        };
    }, [globalWeekIdx]);



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
            {week.map((day, dayIdx) => {
                if (!day) return <View key={dayIdx} style={{ flex: 1, alignItems: 'center', height: WEEK_ROW_HEIGHT }} />;

                const isTodayDay = isToday(day);
                const selected = isSelected(day);
                const isAnyDaySelectedInWeek = week.some(d => d && isSelected(d));
                const today = isTodayDay && (!isCollapsed || !isAnyDaySelectedInWeek || selected);
                const isTodayHidden = isTodayDay && !today;
                const dayEvents = getEventsForDate(day);
                const workout = getWorkoutForDate(day);

                return (
                    <TouchableOpacity
                        key={dayIdx}
                        style={{ flex: 1, alignItems: 'center', height: WEEK_ROW_HEIGHT, paddingTop: 9 }}
                        onPress={() => handleDayPress(day)}
                        activeOpacity={1}
                    >
                        {/* Beyaz daire sadece seçili günde gösterilecek */}
                        {selected && !today && (
                            <Animated.View style={[styles.selectedCircle, selectionCircleStyle]}>
                                <Text style={[
                                    styles.dayNumber,
                                    styles.dayNumberSelected,
                                    dayIdx >= 5 && !isTodayHidden && styles.weekendDayText
                                ]}>
                                    {day.getDate()}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Kırmızı daire bugün için */}
                        {today && (
                            <Animated.View style={styles.todayCircle}>
                                <Text style={[styles.dayNumber, styles.todayNumber]}>
                                    {day.getDate()}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Normal gün (daire yok) */}
                        {!selected && !today && (
                            <View style={styles.dayCircle}>
                                <Text style={[
                                    styles.dayNumber,
                                    isTodayHidden && { color: '#FF3B30' },
                                    dayIdx >= 5 && !isTodayHidden && styles.weekendDayText
                                ]}>
                                    {day.getDate()}
                                </Text>
                            </View>
                        )}

                        <Animated.View style={[styles.eventLabels, eventOpacity]}>
                            {workout && (
                                <View style={[styles.eventPill, { backgroundColor: WORKOUT_DAY_COLORS[workout] + '40' }]}>
                                    <View style={[{ width: 0, height: 0 }]} />
                                    <Text style={[styles.eventText, { color: WORKOUT_DAY_COLORS[workout] }]} numberOfLines={1}>
                                        {workout.replace(' Day', '').replace(' DAY', '')}
                                    </Text>
                                </View>
                            )}
                            {dayEvents.slice(0, 1).map((event) => (
                                <View
                                    key={event.id}
                                    style={[styles.eventPill, { backgroundColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] + '40' : '#2C2C2E' }]}
                                >
                                    <View style={[{ width: 0, height: 0 }]} />
                                    <Text style={[styles.eventText, { color: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#FFFFFF' }]} numberOfLines={1}>
                                        {event.title.toLowerCase()}
                                    </Text>
                                </View>
                            ))}
                            {dayEvents.length > 1 && (
                                <Text style={{ fontSize: 8, color: '#8E8E93', fontWeight: '500' }}>+{dayEvents.length - 1}</Text>
                            )}
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}

        </Animated.View>
    );
}

export default function CollapsibleCalendarCard({
    schedule = {},
    events = [],
    onDayPress,
    onEventPress,
    onCreateEvent,
    onFullScreenPress,
}: CollapsibleCalendarCardProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);

    // Animasyon değerleri
    const calendarHeight = useSharedValue(MONTH_VIEW_HEIGHT);
    const selectedWeekIdx = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const dateTitleAnim = useSharedValue(0);
    const selectionAnim = useSharedValue(1); // Default 1 for month view

    // Scroll Handler
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const monthScrollViewRef = useRef<Animated.ScrollView>(null);
    const weekScrollViewRef = useRef<ScrollView>(null);
    const timelineHorizontalScrollViewRef = useRef<ScrollView>(null);

    // Initial scroll setup
    useEffect(() => {
        if (!isCollapsed && monthScrollViewRef.current) {
            const prevWeeksCount = prevMonthWeeks.length;
            monthScrollViewRef.current.scrollTo({ y: prevWeeksCount * WEEK_ROW_HEIGHT, animated: false });
        }
    }, [isCollapsed]);

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

    // Ensure selection circle is visible when date changes in month view
    useEffect(() => {
        if (!isCollapsed) {
            // Month view'dayken beyaz daire her zaman görünür olmalı
            if (selectionAnim.value !== 1) {
                selectionAnim.value = withTiming(1, { duration: 200 });
            }
        }
    }, [selectedDate, isCollapsed]);


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
        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth]);

    const handlePrevDay = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        setSelectedDate(prev);
        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth]);

    const handleNextWeek = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 7);
        setSelectedDate(next);
        if (next.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    }, [selectedDate, currentMonth]);

    const handlePrevWeek = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 7);
        setSelectedDate(prev);
        if (prev.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
        }
    }, [selectedDate, currentMonth]);

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

    const handleWeekScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);

        if (page === 0) {
            handlePrevWeek();
            weekScrollViewRef.current?.scrollTo({ x: width, animated: false });
        } else if (page === 2) {
            handleNextWeek();
            weekScrollViewRef.current?.scrollTo({ x: width, animated: false });
        }
    };

    const handleTimelineScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = SCREEN_WIDTH;
        const page = Math.round(offset / width);

        if (page === 0) {
            handlePrevDay();
            timelineHorizontalScrollViewRef.current?.scrollTo({ x: width, animated: false });
        } else if (page === 2) {
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
                    selectionAnim.value = interpolate(
                        translationY,
                        [0, 100],
                        [1, 0],
                        'clamp'
                    );
                }
            } else {
                // Vertical drag in month view can collapse
                if (translationY < 0 && Math.abs(translationY) > 50) {
                    calendarHeight.value = Math.max(DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT + translationY);
                    // Collapse sırasında görünür tut
                    selectionAnim.value = 1;
                }
            }
        })
        .onEnd((event) => {
            const { translationY, velocityY } = event;

            if (isCollapsed) {
                // Day view'dayken yukarı çekme
                if (translationY > 100 || velocityY > 500) {
                    // Month view'a genişlet
                    calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG);
                    selectionAnim.value = withTiming(0, { duration: 300 }); // Beyaz daireyi gizle
                } else {
                    // Day view'da kal
                    calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG);
                    selectionAnim.value = withTiming(1, { duration: 300 }); // Beyaz daireyi göster
                }
            } else {
                // Month view'dayken aşağı çekme
                if (translationY < -100 || velocityY < -1000) {
                    // Day view'a daralt
                    calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG);
                    // Beyaz daireyi collapse tamamlandıktan SONRA göster
                    selectionAnim.value = withDelay(200, withTiming(1, { duration: 400 }));
                } else {
                    // Month view'da kal
                    calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, ANIMATION_CONFIG.SPRING_CONFIG);
                    selectionAnim.value = withTiming(0, { duration: 200 }); // Gizli tut
                }
            }
        });



    useAnimatedReaction(
        () => calendarHeight.value <= DAY_VIEW_HEIGHT + 10,
        (collapsed) => {
            if (collapsed !== isCollapsed) {
                runOnJS(setIsCollapsed)(collapsed);

                // Sadece collapse olurken animasyon tetikle
                if (collapsed) {
                    // Day view'a geçerken - beyaz daireyi delay ile göster
                    dateTitleAnim.value = withDelay(150, withTiming(1, { duration: 400 }));
                    selectionAnim.value = withDelay(150, withTiming(1, { duration: 400 }));
                } else {
                    // Month view'a geçerken - animasyonları sıfırla
                    dateTitleAnim.value = 0;
                    selectionAnim.value = 0; // ÖNEMLİ: 0 olmalı, 1 değil!
                }
            }
        },
        [isCollapsed]
    );



    // Animated styles
    const cardStyle = useAnimatedStyle(() => ({
        height: SCREEN_HEIGHT,
    }));

    const monthTitleStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT + 100, MONTH_VIEW_HEIGHT], // Fade in only when expanded enough
            [0, 1]
        ),
        height: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [0, 50]
        ),
    }));

    const monthTitleTextStyle = useAnimatedStyle(() => ({
        fontSize: interpolate(
            calendarHeight.value,
            [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
            [17, 36]
        ),
    }));

    const timelineStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                [1, 0]
            ),
            zIndex: 0, // Ensure it's not hidden by container
            // Slide up effect: Move from 0 (visible) to positive (faded out)
            // At DayView (value=60), output=0.
            // At MonthView (value=600), output=200.
            transform: [{
                translateY: interpolate(
                    calendarHeight.value,
                    [DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
                    [0, 600]
                )
            }],
        };
    });

    const weekContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                calendarHeight.value,
                [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 100], // 5'ten 100'e çıkarıldı
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
                [DAY_VIEW_HEIGHT, DAY_VIEW_HEIGHT + 100], // 5'ten 100'e çıkarıldı
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
        return {
            opacity: dateTitleAnim.value,
            transform: [{
                translateX: interpolate(
                    dateTitleAnim.value,
                    [0, 1],
                    [50, 0] // Slide in from right (0 -> 1)
                )
            }],
        };
    });


    const selectionCircleStyle = useAnimatedStyle(() => ({
        opacity: selectionAnim.value
    }));

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


    const handleDayPress = (date: Date) => {
        // Calculate week index first for shared values
        const allWeeks = [...prevMonthWeeks, ...weeks, ...nextMonthWeeks];
        const weekIdx = allWeeks.findIndex(week =>
            week.some(day => day && day.toDateString() === date.toDateString())
        );

        if (weekIdx !== -1) {
            const targetScrollY = weekIdx * WEEK_ROW_HEIGHT;

            // 1. İlk olarak React state'i güncelle
            setSelectedDate(date);
            onDayPress?.(date);

            // 2. Hemen ardından scroll pozisyonunu ayarla (animasyonsuz)
            monthScrollViewRef.current?.scrollTo({
                y: targetScrollY,
                animated: false
            });

            // 3. Animasyonu başlatmadan ÖNCE shared values'ları güncelle
            requestAnimationFrame(() => {
                scrollY.value = targetScrollY;
                selectedWeekIdx.value = weekIdx;

                // 4. Beyaz daireyi gizle
                selectionAnim.value = 0;

                // 5. Collapse animasyonunu başlat
                calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, {
                    duration: 600,
                    easing: ANIMATION_CONFIG.EASING,
                }, (finished) => {
                    if (finished) {
                        // 6. Collapse tamamlandıktan sonra state ve animasyonları güncelle
                        runOnJS(setIsCollapsed)(true);
                        dateTitleAnim.value = withTiming(1, {
                            duration: 400,
                            easing: Easing.out(Easing.exp),
                        });
                        // 7. Beyaz daireyi yumuşak şekilde göster
                        selectionAnim.value = withTiming(1, {
                            duration: 400,
                            easing: Easing.out(Easing.ease)
                        });
                    }
                });
            });
        } else {
            // Fallback if week not found
            setSelectedDate(date);
            onDayPress?.(date);
        }
    };


    const handleTodayPress = () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today);
        // Reset date title state
        dateTitleAnim.value = 0;
        selectionAnim.value = 1; // Ensure visible

        calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, {
            duration: ANIMATION_CONFIG.COLLAPSE_DURATION,
            easing: ANIMATION_CONFIG.EASING,
        }, (finished) => {
            if (finished) {
                dateTitleAnim.value = withTiming(1, {
                    duration: 300,
                    easing: Easing.out(Easing.exp),
                });
            }
        });

    };

    const resetToToday = () => {
        setSelectedDate(new Date());
        setIsCollapsed(false);
        // Small timeout to allow render to commit before unlocking
        setTimeout(() => {
            // Now safe to show:
            selectionAnim.value = 1;
        }, 50);
    };

    const handleBackToMonth = () => {
        // Calculate the correct scroll offset for the selected week's month
        let targetScrollY = 0;
        const currentIdx = selectedWeekIdx.value;

        if (currentIdx < prevMonthWeeks.length) {
            // Week is in previous month
            targetScrollY = 0;
        } else if (currentIdx < prevMonthWeeks.length + weeks.length) {
            // Week is in current month
            targetScrollY = prevMonthWeeks.length * WEEK_ROW_HEIGHT;
        } else {
            // Week is in next month
            targetScrollY = (prevMonthWeeks.length + weeks.length) * WEEK_ROW_HEIGHT;
        }

        // Reset scroll position instantly to ensure correct context
        monthScrollViewRef.current?.scrollTo({ y: targetScrollY, animated: false });
        scrollY.value = targetScrollY;

        // Reset date title immediately
        dateTitleAnim.value = 0;
        selectionAnim.value = 0; // Hide selection circle immediately

        // Expand to month view - daha yavaş animasyon
        calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, {
            duration: 600, // 500'den 600'e
            easing: ANIMATION_CONFIG.EASING,
        }, (finished) => {
            if (finished) {
                runOnJS(resetToToday)();
            }
        });


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
            calendarHeight.value = withTiming(MONTH_VIEW_HEIGHT, { duration: 300 });
            dateTitleAnim.value = withTiming(1, { duration: 300 });
            setIsCollapsed(false);
        }
    };

    const timeSlots = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    }, []);

    const renderTimelinePane = (date: Date) => {
        const dayEvents = getEventsForDate(date);
        const workout = getWorkoutForDate(date);

        return (
            <View style={styles.timelinePane}>
                <Animated.View style={[styles.dayHeader, dateTitleStyle]}>
                    <Text style={styles.dayHeaderText}>
                        {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()} – {WEEKDAYS_FULL[date.getDay()]}
                    </Text>
                </Animated.View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 150, paddingTop: 0 }}
                >
                    {timeSlots.map((time, idx) => {
                        const hour = parseInt(time.split(':')[0]);
                        const hasEvents = dayEvents.some(e => {
                            const eventHour = e.startTime ? parseInt(e.startTime.split(':')[0]) : -1;
                            return eventHour === hour;
                        }) || (hour === 9 && workout);

                        return (
                            <View
                                key={time}
                            >
                                <TouchableOpacity
                                    style={styles.timeSlot}
                                    onLongPress={() => {
                                        // Long-press to create new event at this hour
                                        const dateWithTime = new Date(date);
                                        dateWithTime.setHours(hour, 0, 0, 0);
                                        if (onCreateEvent) onCreateEvent(dateWithTime);
                                    }}
                                    delayLongPress={500}
                                    activeOpacity={hasEvents ? 1 : 0.7}
                                >
                                    <Text style={styles.timeText}>{time}</Text>
                                    <View style={styles.timeLine} />
                                    <View style={styles.slotContent}>
                                        {hour === 9 && workout && (
                                            <TouchableOpacity
                                                style={[styles.timelineCard, { backgroundColor: WORKOUT_DAY_COLORS[workout] + '20', borderLeftColor: WORKOUT_DAY_COLORS[workout] }]}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.timelineCardTitle, { color: WORKOUT_DAY_COLORS[workout] }]}>{workout}</Text>
                                                <Text style={styles.timelineCardTime}>09:00 - 10:30</Text>
                                            </TouchableOpacity>
                                        )}
                                        {dayEvents.map(event => {
                                            const eventHour = event.startTime ? parseInt(event.startTime.split(':')[0]) : -1;
                                            if (eventHour === hour) {
                                                return (
                                                    <TouchableOpacity
                                                        key={event.id}
                                                        style={[
                                                            styles.timelineCard,
                                                            {
                                                                backgroundColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] + '20' : '#2C2C2E40',
                                                                borderLeftColor: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#8E8E93'
                                                            }
                                                        ]}
                                                        onPress={() => onEventPress && onEventPress(event)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Text style={[styles.timelineCardTitle, { color: event.workoutDay ? WORKOUT_DAY_COLORS[event.workoutDay] : '#FFF' }]}>{event.title}</Text>
                                                        <Text style={styles.timelineCardTime}>{event.startTime} - {event.endTime}</Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                            return null;
                                        })}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {isToday(date) && (
                        <View style={[styles.currentTimeContainer, { top: (new Date().getHours() * 60 + new Date().getMinutes()) * (65 / 60) + 12 }]}>
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
        if (!day) return <View key={idx} style={styles.dayCell} />;

        const isTodayDay = isToday(day);
        const selected = isSelected(day);
        // Hide today marker in collapsed view if another day is selected
        const isAnyDaySelectedInWeek = weekDays.some(d => d && isSelected(d));
        const today = isTodayDay && (!isAnyDaySelectedInWeek || selected);

        const isTodayHidden = isTodayDay && !today;

        return (
            <TouchableOpacity
                key={idx}
                style={styles.dayCell}
                onPress={() => !isAdjacent && handleDayPress(day)}
                disabled={isAdjacent}
                activeOpacity={1}
            >
                <Animated.View style={[
                    styles.dayCircle,
                    selected && !today && styles.selectedCircle,
                    today && styles.todayCircle,
                    selected && !today && selectionCircleStyle
                ]}>
                    <Text style={[
                        styles.dayNumber,
                        today && styles.todayNumber,
                        isTodayHidden && { color: '#FF3B30' },
                        selected && !today && styles.dayNumberSelected,
                        idx >= 5 && !today && !selected && !isTodayHidden && styles.weekendDayText,
                        isAdjacent && { opacity: 0.3 }
                    ]}>
                        {day.getDate()}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderWeekRow = (week: (Date | null)[], weekIdx: number, isAdjacent = false, globalOffset = 0) => {
        const globalWeekIdx = globalOffset + weekIdx;
        return (
            <WeekRow
                key={isAdjacent ? `adj-${weekIdx}` : weekIdx}
                week={week}
                weekIdx={weekIdx}
                globalWeekIdx={globalOffset + weekIdx}
                selectedWeekIdx={selectedWeekIdx}
                calendarHeight={calendarHeight}
                scrollY={scrollY}
                isAdjacent={isAdjacent}
                isToday={isToday}
                isSelected={isSelected}
                getEventsForDate={getEventsForDate}
                getWorkoutForDate={getWorkoutForDate}
                handleDayPress={handleDayPress}
                weeksLength={weeks.length}
                isCollapsed={isCollapsed}
                selectionAnim={selectionAnim}
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
                                <TouchableOpacity onPress={isCollapsed ? handleBackToMonth : handleYearPress} style={styles.backButton} activeOpacity={1}>
                                    <Feather name="chevron-left" size={26} color="#FFF" />
                                    <Text style={[styles.backButtonText, { color: '#FFFFFF' }]}>
                                        {isCollapsed ? MONTHS_FULL[currentMonth.getMonth()] : '2026'}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.headerRightPill}>
                                    <TouchableOpacity onPress={() => { }} style={styles.headerRightIcon} activeOpacity={1}>
                                        <Feather name="grid" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />
                                    <TouchableOpacity onPress={() => { }} style={styles.headerRightIcon} activeOpacity={1}>
                                        <Feather name="search" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                    <View style={styles.headerRightSeparator} />
                                    <TouchableOpacity onPress={() => onCreateEvent && onCreateEvent(selectedDate)} style={styles.headerRightIcon} activeOpacity={1}>
                                        <Feather name="plus" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
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
                                {prevMonthWeeks.map((week, weekIdx) => renderWeekRow(week, weekIdx, true, 0))}
                                {weeks.map((week, weekIdx) => renderWeekRow(week, weekIdx, false, prevMonthWeeks.length))}
                                {nextMonthWeeks.map((week, weekIdx) => renderWeekRow(week, weekIdx, true, prevMonthWeeks.length + weeks.length))}
                            </View>
                        </Animated.ScrollView>
                    </Animated.View>

                    {/* Year View Overlay */}
                    {/* Year Calendar Modal */}
                    <YearCalendarModal
                        visible={showYearModal}
                        onClose={() => setShowYearModal(false)}
                        onMonthSelect={handleYearModalSelect}
                        initialYear={currentMonth.getFullYear()}
                    />

                    {/* Timeline view (visible in day mode) */}
                    <Animated.View style={[styles.timelineContainer, timelineStyle]}>
                        <ScrollView
                            ref={timelineHorizontalScrollViewRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleTimelineScrollEnd}
                            scrollEventThrottle={16}
                            contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
                        >
                            {renderTimelinePane(new Date(selectedDate.getTime() - 86400000))}
                            {renderTimelinePane(selectedDate)}
                            {renderTimelinePane(new Date(selectedDate.getTime() + 86400000))}
                        </ScrollView>
                    </Animated.View>

                </View>

                {/* Bottom navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity onPress={handleTodayPress} style={styles.todayButton} activeOpacity={1}>
                        <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>

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
                            <TouchableOpacity onPress={() => { }} style={styles.headerRightIcon}>
                                <Feather name="search" size={18} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerRightSeparator} />
                            <TouchableOpacity onPress={() => onCreateEvent && onCreateEvent(selectedDate)} style={styles.headerRightIcon}>
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
                                        year={selectedDate.getFullYear()}
                                        month={monthIdx}
                                        onDayPress={(date) => {
                                            setSelectedDate(date);
                                            setCurrentMonth(date);
                                            setShowYearPicker(false);
                                            calendarHeight.value = withTiming(DAY_VIEW_HEIGHT, {
                                                duration: 300,
                                                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                                            });
                                        }}
                                        selectedDate={selectedDate}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.yearBottomNav}>
                        <TouchableOpacity onPress={handleTodayPress} style={styles.todayButton}>
                            <Text style={styles.todayButtonText}>Today</Text>
                        </TouchableOpacity>

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
                    </View>
                </View>
            </Modal >
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333333',
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
        top: 8,
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
        minHeight: 45,
    },
    dayCircle: {
        width: 42, // Matched todayCircle width
        height: 42, // Matched todayCircle height
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
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
        height: 65,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    timeText: {
        width: 60,
        textAlign: 'center',
        fontSize: 12,
        color: '#8E8E93',
        marginTop: -8,
        fontWeight: '500',
    },
    timeLine: {
        width: 1,
        height: '100%',
        backgroundColor: '#2C2C2E',
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
        left: 8,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    currentTimeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
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
