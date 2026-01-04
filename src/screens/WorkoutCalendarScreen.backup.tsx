import React, { useState, useCallback, useContext, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  FlatList,
  PanResponder,
  Pressable,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../contexts/ThemeContext';
import { ALL_WORKOUT_DAYS, WorkoutDayType, loadDailySchedule, DailySchedule, WORKOUT_DAY_COLORS } from '../utils/WorkoutDayManager';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

// AnimatedWeekRow component - each row animates independently
interface AnimatedWeekRowProps {
  children: React.ReactNode;
  globalRowIndex: number;
  selectedRowIndex: SharedValue<number>;
  transition: SharedValue<number>;
  rowHeight: number;
}

const AnimatedWeekRow = ({ 
  children, 
  globalRowIndex, 
  selectedRowIndex, 
  transition,
  rowHeight,
}: AnimatedWeekRowProps) => {
  const HEADER_HEIGHT = 110; // Height of sticky header (month name + weekday letters)
  
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const selected = selectedRowIndex.value;
    const t = transition.value;
    
    const isSelected = globalRowIndex === selected;
    const isAbove = globalRowIndex < selected;
    const isBelow = globalRowIndex > selected;
    
    // Calculate how far selected row needs to move up to reach header position
    // Selected row's current Y position relative to scroll view
    const selectedRowCurrentY = selected * rowHeight;
    const targetY = HEADER_HEIGHT; // Where week bar should be
    const selectedRowMoveUp = targetY - selectedRowCurrentY;
    
    if (isSelected) {
      // Selected row - moves up to become week bar
      const translateY = selectedRowMoveUp * t;
      return {
        transform: [{ translateY }],
        opacity: 1,
      };
    } else if (isAbove) {
      // Above selected - move up faster and fade out
      const distanceAbove = selected - globalRowIndex;
      const translateY = (selectedRowMoveUp - (distanceAbove * 150)) * t;
      const opacity = 1 - t;
      return {
        transform: [{ translateY }],
        opacity,
      };
    } else {
      // Below selected - move down and fade out
      const distanceBelow = globalRowIndex - selected;
      const translateY = (400 + distanceBelow * 100) * t;
      const opacity = 1 - t;
      return {
        transform: [{ translateY }],
        opacity,
      };
    }
  });
  
  return (
    <Animated.View style={[{ overflow: 'visible' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

type WorkoutCalendarScreenProps = StackScreenProps<RootStackParamList, 'WorkoutCalendar'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface WorkoutEvent {
  id: string;
  title: string;
  workoutDay: WorkoutDayType;
  date: string;
  startTime: string;
  endTime: string;
  alertMinutes: number;
  secondAlertMinutes?: number;
  workoutIds: string[];
}

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

export default function WorkoutCalendarScreen({ navigation, route }: WorkoutCalendarScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  // Initialize with 2026 year
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(2026, today.getMonth(), today.getDate());
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(2026, today.getMonth(), today.getDate());
  });
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [events, setEvents] = useState<WorkoutEvent[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule>({});
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<(Date | null)[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<{ monthIndex: number; weekIndex: number } | null>(null);
  
  // Ref for month scroll view
  const monthScrollRef = useRef<ScrollView>(null);
  
  // iOS Calendar Transition Animation (Reanimated)
  // 0 = Month view full, 1 = Day view expanded with split door effect
  const transition = useSharedValue(0);
  const selectedRowIndex = useSharedValue(0); // Which week row is selected (0-5)
  
  // Constants for split door animation
  // Row height for month grid - must be defined before useAnimatedStyle
  const ROW_HEIGHT = 60;
  
  const WEEK_BAR_HEIGHT = 130; // Height of week bar at top when expanded (header + weekdays + dates)
  const DOOR_OPEN_HEIGHT = SCREEN_HEIGHT - WEEK_BAR_HEIGHT; // How far doors open
  const DOOR_GAP = 40; // Horizontal gap when doors are fully open
  
  // Spring config for iOS-like animation - smoother and slower
  const springConfig = {
    damping: 25,
    stiffness: 180,
    mass: 1.0,
  };
  
  // Week bar style - slides up and stays at top
  const weekBarAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      transition.value,
      [0, 1],
      [SCREEN_HEIGHT, 0],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      transition.value,
      [0, 0.3, 1],
      [0, 0.7, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });
  
  // Left door pane - opens to the left while moving up
  const leftDoorStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      transition.value,
      [0, 1],
      [0, -DOOR_OPEN_HEIGHT],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      transition.value,
      [0, 0.3, 1],
      [0, 0, -DOOR_GAP],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      transition.value,
      [0, 0.8, 1],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );
    const scaleX = interpolate(
      transition.value,
      [0, 1],
      [1, 0.95],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY },
        { translateX },
        { scaleX },
      ],
      opacity,
    };
  });
  
  // Right door pane - opens to the right while moving up
  const rightDoorStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      transition.value,
      [0, 1],
      [0, -DOOR_OPEN_HEIGHT],
      Extrapolation.CLAMP
    );
    const translateX = interpolate(
      transition.value,
      [0, 0.3, 1],
      [0, 0, DOOR_GAP],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      transition.value,
      [0, 0.8, 1],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );
    const scaleX = interpolate(
      transition.value,
      [0, 1],
      [1, 0.95],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY },
        { translateX },
        { scaleX },
      ],
      opacity,
    };
  });
  
  // Day timeline - fixed behind doors, just fades in
  const dayTimelineAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      transition.value,
      [0, 0.4, 1],
      [0, 0.3, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      transition.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });
  
  // Function to open day view with split door effect
  const openDayView = (date: Date, rowIndex: number) => {
    setSelectedDate(date);
    setCurrentDate(date);
    selectedRowIndex.value = rowIndex;
    setShowDayPlanner(true);
    transition.value = withSpring(1, springConfig);
  };
  
  // Function to close day view
  const closeDayView = () => {
    transition.value = withSpring(0, springConfig, (finished) => {
      if (finished) {
        runOnJS(setShowDayPlanner)(false);
      }
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      loadSchedule();
      // Note: Don't auto-open month picker on focus - only on explicit navigation
      // The showMonthView param should only trigger once, not on every focus
    }, [])
  );
  
  // Handle showMonthView param separately - only on mount or explicit navigation
  useEffect(() => {
    if (route.params?.showMonthView && route.params?.timestamp) {
      setShowMonthPicker(true);
      // Clear the param after handling
      navigation.setParams({ showMonthView: undefined, timestamp: undefined });
    }
  }, [route.params?.showMonthView, route.params?.timestamp]);

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEvents(parsed);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const loaded = await loadDailySchedule();
      setSchedule(loaded);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  // Get week days starting from selected date
  const getWeekDays = (date: Date) => {
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get days in month for monthly view
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
    
    return days;
  };

  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (date: Date): WorkoutEvent[] => {
    const dateKey = formatDateKey(date);
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return formatDateKey(eventDate) === dateKey;
    });
  };

  const getWorkoutDayForDate = (date: Date): WorkoutDayType | null => {
    const dateKey = formatDateKey(date);
    return schedule[dateKey] || null;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'month') {
      setShowMonthPicker(false);
      setViewMode('week');
    }
  };

  const handleEventPress = (event: WorkoutEvent) => {
    navigation.navigate('WorkoutEventDetail', {
      eventId: event.id,
      date: event.date,
    });
  };

  const handleAddEvent = () => {
    navigation.navigate('CreateWorkoutEvent', {
      date: selectedDate.toISOString(),
    });
  };

  const handleTodayPress = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date): boolean => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const formatHeaderDate = () => {
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatSelectedDateTitle = () => {
    const dayOfWeek = selectedDate.getDay();
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()} – ${weekdayNames[dayOfWeek]}`;
  };

  // Generate time slots (08:00 - 23:00)
  const timeSlots: string[] = [];
  for (let h = 8; h <= 23; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(selectedDate);
    const dayEvents = getEventsForDate(selectedDate);
    const workoutDay = getWorkoutDayForDate(selectedDate);
    
    return (
      <View style={styles.weekViewContainer}>
        {/* Week header with day numbers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => {
            const hasEvent = getEventsForDate(day).length > 0 || getWorkoutDayForDate(day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={styles.weekDayCell}
                onPress={() => handleDatePress(day)}
              >
                <Text style={[
                  styles.weekDayLabel,
                  index >= 5 && styles.weekendText,
                ]}>
                  {WEEKDAYS[index]}
                </Text>
                <View style={[
                  styles.weekDayNumber,
                  isToday(day) && styles.todayNumber,
                  isSelected(day) && styles.selectedNumber,
                ]}>
                  <Text style={[
                    styles.weekDayText,
                    index >= 5 && !isToday(day) && !isSelected(day) && styles.weekendDayText,
                    isToday(day) && styles.todayText,
                    isSelected(day) && !isToday(day) && styles.selectedText,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                {hasEvent && !isSelected(day) && (
                  <View style={styles.eventIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Date title */}
        <Text style={styles.selectedDateTitle}>
          {formatSelectedDateTitle()}
        </Text>
        
        {/* Time grid with events */}
        <ScrollView 
          style={styles.timeGrid} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeGridContent}
        >
          {timeSlots.map((time, index) => {
            const hour = parseInt(time.split(':')[0]);
            const eventsAtThisHour = dayEvents.filter((event) => {
              const eventHour = parseInt(event.startTime.split(':')[0]);
              return eventHour === hour;
            });
            const hasWorkoutAtHour = workoutDay && hour === 17 && dayEvents.length === 0;
            const isEmpty = eventsAtThisHour.length === 0 && !hasWorkoutAtHour;
            
            // Create date with selected date and this hour for navigation
            const handleEmptySlotPress = () => {
              const dateWithTime = new Date(selectedDate);
              dateWithTime.setHours(hour, 0, 0, 0);
              navigation.navigate('CreateWorkoutEvent', {
                date: dateWithTime.toISOString(),
              });
            };
            
            return (
              <TouchableOpacity 
                key={time} 
                style={styles.timeSlot}
                onPress={isEmpty ? undefined : undefined}
                onLongPress={() => {
                  // Long press to create new event at this time
                  const dateWithTime = new Date(selectedDate);
                  dateWithTime.setHours(hour, 0, 0, 0);
                  navigation.navigate('CreateWorkoutEvent', {
                    date: dateWithTime.toISOString(),
                  });
                }}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.timeLabel}>{time}</Text>
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeSlotLine} />
                  
                  {/* Render events at this time */}
                  {eventsAtThisHour.map((event) => {
                    const eventColor = WORKOUT_DAY_COLORS[event.workoutDay] || '#4A90D9';
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[styles.eventBlock, { backgroundColor: eventColor }]}
                        onPress={() => handleEventPress(event)}
                      >
                        <Text style={styles.eventBlockTitle}>{event.title}</Text>
                        <View style={styles.eventBlockTimeRow}>
                          <Feather name="clock" size={11} color="#FFF" />
                          <Text style={styles.eventBlockTime}>
                            {event.startTime} – {event.endTime}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {/* Show workout day if scheduled */}
                  {hasWorkoutAtHour && (
                    <TouchableOpacity
                      style={[styles.eventBlock, { backgroundColor: WORKOUT_DAY_COLORS[workoutDay] }]}
                      onPress={() => navigation.navigate('DailyWorkoutDetail', {
                        workoutDay: workoutDay,
                        currentDay: 1,
                        totalDays: 7,
                      })}
                    >
                      <Text style={styles.eventBlockTitle}>
                        {workoutDay.toLowerCase().replace(' day', '')} day
                      </Text>
                      <View style={styles.eventBlockTimeRow}>
                        <Feather name="clock" size={11} color="#FFF" />
                        <Text style={styles.eventBlockTime}>17:00 – 18:00</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Helper to get days for any month
  const getDaysForMonth = (year: number, month: number): (Date | null)[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  };

  // Group days into weeks
  const groupDaysIntoWeeks = (days: (Date | null)[]): (Date | null)[][] => {
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    return weeks;
  };

  // Generate 12 months data starting from current year
  const generate12Months = () => {
    const months = [];
    const startYear = currentDate.getFullYear();
    const startMonth = 0; // January
    
    for (let i = 0; i < 12; i++) {
      const month = startMonth + i;
      const year = startYear + Math.floor(month / 12);
      const actualMonth = month % 12;
      
      months.push({
        year,
        month: actualMonth,
        name: MONTHS[actualMonth],
        days: getDaysForMonth(year, actualMonth),
      });
    }
    return months;
  };

  // State for visible month name
  const [visibleMonthName, setVisibleMonthName] = useState(MONTHS[currentDate.getMonth()]);

  // Calculate month section heights for scroll tracking
  const monthSectionHeights: number[] = [];
  // ROW_HEIGHT is already defined above for animations

  // Memoized year data for FlatList performance
  const yearData = useMemo(() => {
    const years = [];
    for (let y = 2026; y <= 2050; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Get mini calendar for a month - memoized helper
  const getMiniMonthDays = useCallback((year: number, month: number): (number | null)[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (number | null)[] = [];
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(d);
    }
    
    return days;
  }, []);

  // Render a single year item for FlatList
  const renderYearItem = useCallback(({ item: year }: { item: number }) => {
    const today = new Date();
    const isCurrentYear = today.getFullYear() === year || year === 2026;
    
    return (
      <View style={styles.yearSection}>
        {/* Year Title */}
        <Text style={[styles.yearTitle, isCurrentYear && styles.currentYearTitle]}>{year}</Text>
        <View style={styles.yearTitleSeparator} />
        
        {/* 12 months grid for this year */}
        <View style={styles.monthsGrid}>
          {MONTHS.map((monthName, monthIndex) => {
            const days = getMiniMonthDays(year, monthIndex);
            const isCurrentMonth = isCurrentYear && today.getMonth() === monthIndex;
            
            return (
              <TouchableOpacity 
                key={`${year}-${monthName}`}
                style={styles.miniMonthContainer}
                onPress={() => {
                  const newDate = new Date(year, monthIndex, 1);
                  setCurrentDate(newDate);
                  setVisibleMonthName(MONTHS[monthIndex]);
                  setShowYearPicker(false);
                  setTimeout(() => {
                    setShowMonthPicker(true);
                  }, 100);
                }}
              >
                <Text style={[
                  styles.miniMonthTitle,
                  isCurrentMonth && styles.currentMonthTitle,
                ]}>
                  {monthName.substring(0, 3)}
                </Text>
                
                {/* Mini weekday header */}
                <View style={styles.miniWeekdayRow}>
                  {WEEKDAYS.map((day, i) => (
                    <Text key={i} style={styles.miniWeekdayText}>{day}</Text>
                  ))}
                </View>
                
                {/* Mini days grid */}
                <View style={styles.miniDaysGrid}>
                  {days.map((day, dayIndex) => {
                    const isTodayDay = day !== null && 
                      isCurrentYear &&
                      today.getDate() === day && 
                      today.getMonth() === monthIndex;
                    
                    return (
                      <View key={dayIndex} style={styles.miniDayCell}>
                        {day !== null && (
                          <View style={[
                            styles.miniDayCircle,
                            isTodayDay && styles.miniTodayCircle,
                          ]}>
                            <Text style={[
                              styles.miniDayText,
                              isTodayDay && styles.miniTodayText,
                            ]}>
                              {day}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [getMiniMonthDays, setCurrentDate, setVisibleMonthName, setShowYearPicker, setShowMonthPicker]);

  // Render Year Picker (like iOS Calendar yearly view) - optimized with FlatList
  const renderYearPicker = () => {
    return (
      <Modal
        visible={showYearPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={[styles.yearPickerContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.yearPickerHeader}>
            <View style={{ width: 80 }} />
            <View style={styles.yearPickerHeaderRight}>
              <TouchableOpacity style={styles.yearSearchButton}>
                <Feather name="search" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.doneButtonGreen}
                onPress={() => {
                  setShowYearPicker(false);
                  setShowMonthPicker(false);
                  navigation.goBack();
                }}
              >
                <Feather name="check" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* FlatList for years - optimized for performance */}
          <FlatList
            data={yearData}
            renderItem={renderYearItem}
            keyExtractor={(item) => item.toString()}
            style={styles.yearScrollView}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={3}
            windowSize={7}
            removeClippedSubviews={true}
            contentOffset={{ x: 0, y: 0 }}
            getItemLayout={(_, index) => ({
              length: 450,
              offset: 450 * index,
              index,
            })}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
          
          {/* Bottom bar */}
          <View style={styles.yearPickerBottomBar}>
            <TouchableOpacity 
              style={styles.todayPill}
              onPress={() => {
                const today = new Date();
                setCurrentDate(new Date(2026, today.getMonth(), today.getDate()));
                setSelectedDate(new Date(2026, today.getMonth(), today.getDate()));
                setVisibleMonthName(MONTHS[today.getMonth()]);
                setShowYearPicker(false);
                setTimeout(() => {
                  setShowMonthPicker(true);
                }, 100);
              }}
            >
              <Text style={styles.todayPillText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMonthPicker = () => {
    const allMonths = generate12Months();
    
    // Calculate cumulative heights for scroll position detection
    let cumulativeHeight = 0;
    const monthOffsets: number[] = [];
    allMonths.forEach((monthData) => {
      monthOffsets.push(cumulativeHeight);
      const weeks = groupDaysIntoWeeks(monthData.days);
      // Month title height + weeks * row height + separator
      const monthHeight = 50 + (weeks.length * (ROW_HEIGHT + 1)) + 20;
      cumulativeHeight += monthHeight;
    });

    const handleScroll = (event: any) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      // Find which month is currently visible
      for (let i = monthOffsets.length - 1; i >= 0; i--) {
        if (scrollY >= monthOffsets[i] - 50) {
          if (allMonths[i] && visibleMonthName !== allMonths[i].name) {
            setVisibleMonthName(allMonths[i].name);
          }
          break;
        }
      }
    };
    
    return (
      <Modal
        visible={showMonthPicker}
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={[styles.monthPickerContainer, { backgroundColor: colors.background }]}>
          {/* Header with year button and done button */}
          <View style={styles.monthPickerHeader}>
            <TouchableOpacity 
              style={styles.yearButton}
              onPress={() => {
                // Open year picker showing current year's yearly view
                setShowMonthPicker(false);
                setTimeout(() => {
                  setShowYearPicker(true);
                }, 100);
              }}
            >
              <Feather name="chevron-left" size={18} color="#FFF" />
              <Text style={styles.yearButtonText}>{currentDate.getFullYear()}</Text>
            </TouchableOpacity>
            
            <View style={{ flex: 1 }} />
            
            {/* Done button (green circle with white tick) - positioned to right */}
            <TouchableOpacity 
              style={styles.doneButtonGreen}
              onPress={() => {
                setShowMonthPicker(false);
                navigation.goBack();
              }}
            >
              <Feather name="check" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {/* Sticky Month Name + Weekday Header */}
          <View style={styles.stickyHeaderContainer}>
            <Text style={styles.stickyMonthTitle}>{visibleMonthName}</Text>
            <View style={styles.stickyWeekdayRow}>
              {WEEKDAYS.map((day, index) => (
                <Text key={index} style={[
                  styles.stickyWeekdayText,
                  index >= 5 && styles.weekendText,
                ]}>
                  {day}
                </Text>
              ))}
            </View>
          </View>
          
          {/* Scrollable 12 months - with zoom animation */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <ScrollView 
              ref={monthScrollRef}
              style={[styles.monthScrollView, { overflow: 'visible' }]}
              contentContainerStyle={{ overflow: 'visible' }}
              scrollEnabled={!showDayPlanner}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
            {(() => {
              let globalRowIndex = 0;
              return allMonths.map((monthData, monthIndex) => {
              const weeks = groupDaysIntoWeeks(monthData.days);
              
              return (
                <View key={`month-${monthData.year}-${monthData.month}`} style={styles.monthSection}>
                  {/* Month Title in scroll area (for reference) */}
                  <Text style={styles.monthSectionTitleHidden}>{monthData.name}</Text>
                  
                  {/* Weeks with event bars */}
                  {weeks.map((week, weekIndex) => {
                    const currentRowIndex = globalRowIndex;
                    globalRowIndex++;
                    
                    const isExpandedWeek = selectedWeekIndex?.monthIndex === monthIndex && 
                                           selectedWeekIndex?.weekIndex === weekIndex &&
                                           showDayPlanner;
                    
                    return (
                      <AnimatedWeekRow
                        key={`week-${monthIndex}-${weekIndex}`}
                        globalRowIndex={currentRowIndex}
                        selectedRowIndex={selectedRowIndex}
                        transition={transition}
                        rowHeight={ROW_HEIGHT}
                      >
                        <View style={[styles.monthWeekContainer, { minHeight: ROW_HEIGHT }]}>
                          {/* Day numbers row */}
                          <View style={styles.monthDayNumbersRowNew}>
                            {week.map((day, dayIndex) => {
                              if (!day) {
                                return <View key={`empty-${monthIndex}-${weekIndex}-${dayIndex}`} style={styles.monthDayCellNew} />;
                              }
                              
                              const dayOfWeek = day.getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                              
                              return (
                                <TouchableOpacity
                                  key={day.toISOString()}
                                  style={styles.monthDayCellNew}
                                  onPress={() => {
                                    // Set selected row index for animation
                                    selectedRowIndex.value = currentRowIndex;
                                    // Store selected date/week for after animation
                                    setSelectedDate(day);
                                    setCurrentDate(day);
                                    setSelectedWeek(week);
                                    // Start animation
                                    transition.value = withSpring(1, {
                                      damping: 20,
                                      stiffness: 120,
                                      mass: 0.8,
                                    });
                                    // Close modal after animation with delay
                                    setTimeout(() => {
                                      setShowMonthPicker(false);
                                      transition.value = 0;
                                    }, 600);
                                  }}
                                >
                                  <View style={[
                                    styles.monthDayCircle,
                                    isToday(day) && styles.todayCircle,
                                    isSelected(day) && styles.selectedCircle,
                                  ]}>
                                    <Text style={[
                                      styles.monthDayNum,
                                      isWeekend && !isToday(day) && !isSelected(day) && styles.weekendDayText,
                                      isToday(day) && styles.todayDayText,
                                      isSelected(day) && !isToday(day) && styles.selectedDayText,
                                    ]}>
                                      {day.getDate()}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          
                          {/* Event bars row - hide when expanded */}
                          {!isExpandedWeek && (
                            <View style={styles.eventBarsRow}>
                              {week.map((day, dayIndex) => {
                                if (!day) {
                                  return <View key={`event-empty-${monthIndex}-${weekIndex}-${dayIndex}`} style={styles.eventBarCell} />;
                                }
                                
                                const dayEvents = getEventsForDate(day);
                                const workoutDay = getWorkoutDayForDate(day);
                                
                                return (
                                  <TouchableOpacity 
                                    key={`event-${day.toISOString()}`} 
                                    style={styles.eventBarCell}
                                    onPress={() => {
                                      // Set selected row index for animation
                                      selectedRowIndex.value = currentRowIndex;
                                      // Store selected date/week
                                      setSelectedDate(day);
                                      setCurrentDate(day);
                                      setSelectedWeek(week);
                                      // Start animation
                                      transition.value = withSpring(1, {
                                        damping: 20,
                                        stiffness: 120,
                                        mass: 0.8,
                                      });
                                      // Close modal after animation with delay
                                      setTimeout(() => {
                                        setShowMonthPicker(false);
                                        transition.value = 0;
                                      }, 600);
                                    }}
                                  >
                                    {/* Workout day bar */}
                                    {workoutDay && (
                                      <View style={[styles.eventBar, { backgroundColor: WORKOUT_DAY_COLORS[workoutDay] }]}>
                                        <Text style={styles.eventBarText} numberOfLines={1}>
                                          {workoutDay.toLowerCase().replace(' day', '')}
                                        </Text>
                                      </View>
                                    )}
                                    
                                    {/* Calendar events */}
                                    {dayEvents.slice(0, workoutDay ? 1 : 2).map((event) => (
                                      <View 
                                        key={event.id} 
                                        style={[styles.eventBar, { backgroundColor: WORKOUT_DAY_COLORS[event.workoutDay] || '#007AFF' }]}
                                      >
                                        <Text style={styles.eventBarText} numberOfLines={1}>
                                          {event.title}
                                        </Text>
                                      </View>
                                    ))}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                          
                          {/* Row separator */}
                          <View style={styles.weekRowSeparator} />
                        </View>
                      </AnimatedWeekRow>
                    );
                  })}
                  
                  {/* Space between months */}
                  {monthIndex < allMonths.length - 1 && (
                    <View style={styles.monthGap} />
                  )}
                </View>
              );
            });
            })()}
            
            <View style={{ height: 120 }} />
          </ScrollView>
          </View>
          
          {/* Bottom bar - only Today button */}
          <View style={styles.monthPickerBottomBar}>
              <TouchableOpacity 
                style={styles.todayPill}
                onPress={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDate(today);
                  setVisibleMonthName(MONTHS[today.getMonth()]);
                }}
              >
                <Text style={styles.todayPillText}>Today</Text>
              </TouchableOpacity>
            </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft}
          onPress={() => setShowMonthPicker(true)}
        >
          <Feather name="chevron-left" size={20} color="#FFF" />
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          {/* iOS-Style Planlama Ekranı */}
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('PlanlamaEkrani')}
          >
            <Feather name="grid" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Feather name="list" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Feather name="search" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} onPress={handleAddEvent}>
            <Feather name="plus" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Week View */}
      {renderWeekView()}
      
      {/* Month Picker Modal */}
      {renderMonthPicker()}
      
      {/* Year Picker Modal */}
      {renderYearPicker()}
      
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.bottomIconButton}
            onPress={() => setShowMonthPicker(true)}
          >
            <Feather name="calendar" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconButton}>
            <Feather name="inbox" size={22} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerDate: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerIconButton: {
    padding: 6,
  },
  // Week View
  weekViewContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  weekDayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 6,
  },
  weekendText: {
    color: '#666',
  },
  weekDayNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNumber: {
    backgroundColor: '#007AFF',
  },
  selectedNumber: {
    backgroundColor: '#FFF',
  },
  weekDayText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '500',
  },
  weekendDayText: {
    color: '#666',
  },
  todayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  selectedText: {
    color: '#000',
    fontWeight: '600',
  },
  eventIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  selectedDateTitle: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '400',
    textAlign: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  // Time Grid
  timeGrid: {
    flex: 1,
  },
  timeGridContent: {
    paddingBottom: 40,
  },
  timeSlot: {
    height: 50,
    flexDirection: 'row',
    paddingLeft: 16,
  },
  timeLabel: {
    width: 45,
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '400',
  },
  timeSlotContent: {
    flex: 1,
    position: 'relative',
  },
  timeSlotLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
  },
  eventBlock: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 16,
    borderRadius: 6,
    padding: 8,
    minHeight: 44,
  },
  eventBlockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  eventBlockTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  eventBlockTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  todayButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomIconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 20,
  },
  // Month Picker Modal
  monthPickerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  monthPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  monthPickerYear: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  monthPickerActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 4,
  },
  monthPickerAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 16,
  },
  monthPickerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  monthCalendarGrid: {
    paddingHorizontal: 16,
  },
  monthWeekdayHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  monthWeekdayText: {
    width: DAY_WIDTH,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayCell: {
    width: DAY_WIDTH,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '400',
  },
  monthEventIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 2,
    gap: 2,
  },
  monthEventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  monthPickerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    backgroundColor: '#000',
  },
  todayPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  todayPillText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  bottomIconButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // New wide month picker styles
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  monthNavYear: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  monthYearTitle: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  eventBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  // Sticky weekday header
  stickyWeekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  stickyWeekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  monthScrollView: {
    flex: 1,
    paddingHorizontal: 8,
  },
  // Month sections for 12 month view
  monthSection: {
    paddingTop: 16,
  },
  monthSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthWeekRow: {
    marginBottom: 4,
  },
  // Large month week row
  monthWeekRowLarge: {
    flexDirection: 'row',
    minHeight: 70,
    paddingVertical: 8,
  },
  monthDayCellLarge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  monthDayNumberLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayTextLarge: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '400',
  },
  todayNumberLarge: {
    backgroundColor: '#FF3B30',
  },
  todayTextLarge: {
    color: '#FFF',
    fontWeight: '600',
  },
  selectedNumberLarge: {
    backgroundColor: '#007AFF',
  },
  selectedTextLarge: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Event dots for month view
  eventDotsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 3,
  },
  eventDotLarge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Row separator
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  // Month separator
  monthSeparator: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
    marginHorizontal: 8,
  },
  monthDayNumbersRow: {
    flexDirection: 'row',
  },
  monthDayCellWide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
  },
  monthDayNumberWide: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayTextWide: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '400',
  },
  monthEventsRow: {
    flexDirection: 'row',
    minHeight: 40,
    paddingVertical: 2,
  },
  monthEventCell: {
    flex: 1,
    paddingHorizontal: 1,
    gap: 2,
  },
  monthEventPill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  monthEventPillText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 9,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // New styles for updated month picker
  eventBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  eventBadgeDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  eventBadgePillText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
  stickyHeaderContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  stickyMonthTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  stickyWeekdayRow: {
    flexDirection: 'row',
  },
  monthSectionTitleHidden: {
    height: 0,
    opacity: 0,
  },
  monthWeekContainer: {
    paddingVertical: 6,
  },
  monthDayNumbersRowNew: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  monthDayCellNew: {
    flex: 1,
    alignItems: 'center',
  },
  monthDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: '#FF3B30',
  },
  selectedCircle: {
    backgroundColor: '#007AFF',
  },
  monthDayNum: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '400',
  },
  todayDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  eventBarsRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    minHeight: 40,
    gap: 1,
  },
  eventBarCell: {
    flex: 1,
    gap: 2,
    paddingHorizontal: 1,
  },
  eventBar: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 4,
    minHeight: 18,
  },
  eventBarText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  weekRowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
    marginTop: 4,
  },
  monthGap: {
    height: 28,
  },
  // Year button style
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 4,
  },
  yearButtonText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '600',
  },
  // Done button green style
  doneButtonGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Year Picker styles
  yearPickerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  yearPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  yearPickerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearSearchButton: {
    padding: 8,
  },
  yearDoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FF3B30',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  currentYearTitle: {
    color: '#FF3B30',
  },
  yearSection: {
    marginBottom: 16,
  },
  yearTitleSeparator: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  yearScrollView: {
    flex: 1,
    paddingHorizontal: 8,
  },
  yearPickerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: '#000',
  },
  // Mini month grid for year view
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  miniMonthContainer: {
    width: (SCREEN_WIDTH - 48) / 3,
    marginBottom: 24,
  },
  miniMonthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  currentMonthTitle: {
    color: '#FF3B30',
  },
  miniWeekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  miniWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '500',
  },
  miniDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTodayCircle: {
    backgroundColor: '#FF3B30',
  },
  miniDayText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '400',
  },
  miniTodayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Inline Day Planner styles
  inlineDayPlanner: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dayPlannerHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  dayPlannerWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayPlannerDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayPlannerDayName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dayPlannerDayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPlannerSelectedDay: {
    backgroundColor: '#FF3B30',
  },
  dayPlannerDayText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  dayPlannerSelectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  dayPlannerDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  dayPlannerTimeSlots: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dayPlannerTimeSlot: {
    flexDirection: 'row',
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  dayPlannerTimeLabel: {
    width: 50,
    fontSize: 13,
    color: '#8E8E93',
    paddingTop: 4,
  },
  dayPlannerTimeLine: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  dayPlannerEvent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: '50%',
  },
  dayPlannerEventText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  dayPlannerCloseButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    padding: 8,
  },
  // Expanded Time Slots Styles (inline picker-like expansion)
  expandedTimeSlots: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    overflow: 'hidden',
  },
  expandedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  expandedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  expandedCloseButton: {
    padding: 4,
  },
  expandedTimeSlotsScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  expandedTimeSlot: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
    alignItems: 'center',
  },
  expandedTimeLabel: {
    width: 45,
    fontSize: 12,
    color: '#8E8E93',
  },
  expandedTimeLine: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 3,
  },
  expandedEvent: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    maxWidth: '50%',
  },
  expandedEventText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
  // iOS Calendar Day View Styles
  dayViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  dayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  dayViewBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayViewBackText: {
    color: '#007AFF',
    fontSize: 17,
    marginLeft: 4,
  },
  dayViewTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  dayViewAddButton: {
    padding: 4,
  },
  dayViewWeekBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  dayViewWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayViewWeekDayName: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayViewWeekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayViewSelectedCircle: {
    backgroundColor: '#FF3B30',
  },
  dayViewWeekDayNum: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  dayViewSelectedText: {
    color: '#FFF',
    fontWeight: '600',
  },
  dayViewTimeSlots: {
    flex: 1,
    backgroundColor: '#000',
  },
  dayViewTimeSlot: {
    flexDirection: 'row',
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1C1C1E',
    paddingVertical: 4,
  },
  dayViewTimeLabelContainer: {
    width: 55,
    paddingTop: 4,
    paddingLeft: 12,
  },
  dayViewTimeLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dayViewTimeLine: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#333',
    paddingLeft: 12,
    justifyContent: 'center',
    minHeight: 44,
  },
  dayViewEvent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
    marginBottom: 4,
  },
  dayViewEventTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  dayViewEventTitle: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  // Split Door Animation Styles
  dayTimelineContainer: {
    position: 'absolute',
    top: 90, // Below week bar
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 98,
  },
  doorPane: {
    position: 'absolute',
    top: 90, // Start below week bar area
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 99,
    overflow: 'hidden',
  },
  leftDoorPane: {
    left: 0,
    width: SCREEN_WIDTH / 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#1C1C1E',
  },
  rightDoorPane: {
    right: 0,
    width: SCREEN_WIDTH / 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#1C1C1E',
  },
  doorPaneContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  weekBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  // Modal içindeki day view stilleri
  modalDayTimeline: {
    position: 'absolute',
    top: 90, // WEEK_BAR_HEIGHT
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 5,
  },
  modalDoorPane: {
    position: 'absolute',
    top: 90, // WEEK_BAR_HEIGHT
    bottom: 0,
    width: SCREEN_WIDTH / 2 + 20,
    backgroundColor: '#000',
    zIndex: 10,
    overflow: 'hidden',
  },
  modalLeftDoor: {
    left: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#1C1C1E',
  },
  modalRightDoor: {
    right: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#1C1C1E',
  },
  modalWeekBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130, // Updated WEEK_BAR_HEIGHT
    backgroundColor: '#000',
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  // New iOS Calendar Day View Styles
  dayViewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dayViewMonthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayViewMonthText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 2,
  },
  dayViewHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayViewIconButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayViewWeekDayNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  dayViewDayLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  dayViewDateTitleContainer: {
    position: 'absolute',
    top: 130, // Below week bar
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    zIndex: 6,
  },
  dayViewDateTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
