import React, { useState, useContext, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS, ALL_WORKOUT_DAYS, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';
import { allWorkouts, Workout } from '../constants/workoutData';
import SafeCalendar from '../utils/SafeCalendar';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';

type CreateWorkoutEventScreenProps = StackScreenProps<RootStackParamList, 'CreateWorkoutEventScreen'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

// WORKOUT_DAYS removed, using ALL_WORKOUT_DAYS from manager

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REPEAT_OPTIONS = [
  { label: 'Never', value: 'never' },
  { label: 'Every Day', value: 'daily' },
  { label: 'Every Week', value: 'weekly' },
  { label: 'Every 2 Weeks', value: 'biweekly' },
  { label: 'Every Month', value: 'monthly' },
  { label: 'Every Year', value: 'yearly' },
  { label: 'Custom...', value: 'custom' },
];

const CUSTOM_FREQUENCIES = [
  { label: 'Daily', value: 'daily', unit: 'Day' },
  { label: 'Weekly', value: 'weekly', unit: 'Week' },
  { label: 'Monthly', value: 'monthly', unit: 'Month' },
  { label: 'Yearly', value: 'yearly', unit: 'Year' },
];

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
  { label: '2 days before', value: 2880 },
];

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
  calendar?: string;
  repeat?: string;
  endRepeatDate?: string; // ISO string or 'never'
}

export default function CreateWorkoutEventScreen({ navigation, route }: CreateWorkoutEventScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || {
    background: '#000',
    text: '#FFF',
    cardBackground: '#1C1C1E',
    valueBackground: '#2C2C2E',
  };

  const initialDate = route.params?.date ? new Date(route.params.date) : new Date();
  const editMode = route.params?.editMode || !!route.params?.editingEventId || false;
  const editEventId = route.params?.eventId || route.params?.editingEventId;
  const routeStartTime = route.params?.startTime;
  const routeEndTime = route.params?.endTime;
  const routeWorkoutDay = route.params?.workoutDay as WorkoutDayType | undefined;
  const routeTitle = route.params?.title;

  // Initialize start and end dates with times from route params if provided
  const initializeStartDate = () => {
    const date = new Date(initialDate);
    if (routeStartTime) {
      const [hour, min] = routeStartTime.split(':').map(Number);
      date.setHours(hour, min, 0, 0);
    }
    return date;
  };

  const initializeEndDate = () => {
    const date = new Date(initialDate);
    if (routeEndTime) {
      const [hour, min] = routeEndTime.split(':').map(Number);
      date.setHours(hour, min, 0, 0);
    } else {
      // Default to 1 hour after start
      date.setHours(date.getHours() + 1);
    }
    return date;
  };

  const [eventType, setEventType] = useState<'event' | 'reminder'>('event');
  const [title, setTitle] = useState(routeTitle || '');
  const [startDate, setStartDate] = useState(initializeStartDate());
  const [endDate, setEndDate] = useState(initializeEndDate());
  const [repeat, setRepeat] = useState(route.params?.repeat || 'never');
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDayType>(routeWorkoutDay || 'PUSH DAY');
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]); // New state for selected workouts
  const [alertMinutes, setAlertMinutes] = useState(30);
  const [secondAlertMinutes, setSecondAlertMinutes] = useState(-1); // -1 means none
  const [selectedCalendar, setSelectedCalendar] = useState('Home');
  const [endRepeatDate, setEndRepeatDate] = useState<Date | 'never'>('never');
  const [isLoading, setIsLoading] = useState(editMode);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Custom Repeat Modal state
  const [showCustomRepeatModal, setShowCustomRepeatModal] = useState(false);
  const [customFrequency, setCustomFrequency] = useState<string>('daily');
  const [customInterval, setCustomInterval] = useState<number>(1);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(initialDate);

  // Advanced Custom Repeat state
  const [customRepeatDays, setCustomRepeatDays] = useState<number[]>([new Date().getDay()]); // 0-6
  const [customRepeatMonthlyDays, setCustomRepeatMonthlyDays] = useState<number[]>([new Date().getDate()]); // 1-31
  const [customRepeatYearlyMonths, setCustomRepeatYearlyMonths] = useState<number[]>([new Date().getMonth()]); // 0-11

  // Load event data if in edit mode
  useEffect(() => {
    console.log('CreateWorkoutEventScreen - editMode:', editMode, 'editEventId:', editEventId);
    if (editMode && editEventId) {
      loadEventData();
    }
  }, [editMode, editEventId]);

  const [deviceCalendars, setDeviceCalendars] = useState<any[]>([]);
  const [calendarPermission, setCalendarPermission] = useState<string>('undetermined');
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  // Request calendar permission and load calendars
  const requestCalendarAccess = async () => {
    setLoadingCalendars(true);
    try {
      const authStatus = await SafeCalendar.requestPermissions();
      setCalendarPermission(authStatus);

      if (authStatus === 'authorized') {
        await loadDeviceCalendars();
      }
    } catch (error) {
      console.error('Calendar permission error:', error);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const loadDeviceCalendars = async () => {
    try {
      const calendars = await SafeCalendar.findCalendars();
      const writableCalendars = calendars.filter((cal: any) => cal.allowsModifications);
      setDeviceCalendars(writableCalendars);
      if (writableCalendars.length > 0 && selectedCalendar === 'Home') {
        // If we have calendars and haven't picked one, pick the first one as default
        // or stay with 'Home' if that's the intention
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  };

  useEffect(() => {
    requestCalendarAccess();
  }, []);

  const loadEventData = async () => {
    console.log('loadEventData called, editEventId:', editEventId);
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      console.log('Stored events:', stored ? 'found' : 'not found');
      if (stored) {
        const events: WorkoutEvent[] = JSON.parse(stored);
        console.log('Total events:', events.length);
        const event = events.find(e => e.id === editEventId);
        console.log('Found event:', event ? event.title : 'not found');
        if (event) {
          setTitle(event.title);
          setSelectedWorkoutDay(event.workoutDay);
          setStartDate(new Date(event.date));
          const eventDate = new Date(event.date);
          const [startHour, startMin] = event.startTime.split(':').map(Number);
          const [endHour, endMin] = event.endTime.split(':').map(Number);
          const start = new Date(eventDate);
          start.setHours(startHour, startMin);
          const end = new Date(eventDate);
          end.setHours(endHour, endMin);
          setStartDate(start);
          setEndDate(end);
          setRepeat(event.repeat || 'never');
          if (event.endRepeatDate) {
            setEndRepeatDate(event.endRepeatDate === 'never' ? 'never' : new Date(event.endRepeatDate));
          }
          if (event.workoutIds) setSelectedWorkoutIds(event.workoutIds);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Picker visibility states
  const [activePickerField, setActivePickerField] = useState<'startDate' | 'startTimePicker' | 'endDate' | 'endTimePicker' | 'repeat' | 'endRepeat' | 'workout' | 'alert' | 'secondAlert' | 'calendar' | null>(null);

  // Animated heights for pickers
  const dateTimePickerHeight = useRef(new Animated.Value(0)).current;
  const workoutPickerHeight = useRef(new Animated.Value(0)).current;

  // Calendar picker state


  const formatTime = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDateShort = (date: Date): string => {
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatFullDateTime = (date: Date): string => {
    // e.g. "Jan 15 2024, 10:00"
    return `${MONTHS_SHORT[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} ${date.getFullYear()}, ${formatTime(date)}`;
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDatePill = (date: Date) => {
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Generate repeated events based on repeat option
  const generateRepeatedEvents = (baseEvent: WorkoutEvent, repeatType: string): WorkoutEvent[] => {
    const events: WorkoutEvent[] = [baseEvent];

    if (repeatType === 'never') return events;

    const baseDate = new Date(baseEvent.date);
    const endRepeatDate = baseEvent.endRepeatDate && baseEvent.endRepeatDate !== 'never'
      ? new Date(baseEvent.endRepeatDate)
      : new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate()); // Default to 1 year

    let currentDate = new Date(baseDate);
    let counter = 1;

    while (currentDate < endRepeatDate && counter < 365) {
      if (repeatType.startsWith('custom_')) {
        const parts = repeatType.split('_');
        const freq = parts[1];
        const interval = parseInt(parts[2] || '1');
        const extras = parts[3] ? parts[3].split(',').map(Number) : [];

        if (freq === 'daily') {
          currentDate.setDate(currentDate.getDate() + interval);
        } else if (freq === 'weekly') {
          // If extras (specific days) are provided, we need to find the next valid day
          if (extras.length > 0) {
            let foundNext = false;
            let daysToTry = 1;
            // Iterate day by day until we match one of the selected weekday
            while (daysToTry <= 7 * interval) {
              const nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + 1);
              if (extras.includes(nextDate.getDay())) {
                // If we crossed a "week boundary" (interval), apply the wait if necessary
                // But usually, standard logic is just "any of these days in the valid weeks"
                // For simplicity: just jump to the next matching day that satisfies the interval
                // Standard iOS behavior: "Repeat on Mon, Wed, Fri every 2 weeks" 
                // means in those weeks, repeat on those days.

                // Let's use a simpler logic for now: just find next matching day
                currentDate = nextDate;
                foundNext = true;
                break;
              }
              currentDate = nextDate;
              daysToTry++;
            }
            if (!foundNext) break;
          } else {
            currentDate.setDate(currentDate.getDate() + (7 * interval));
          }
        } else if (freq === 'monthly') {
          if (extras.length > 0) {
            // Find next month (respecting interval) and then next matching day
            // Wait, for monthly grid, it's usually "on these days of the month"
            // Jump to next matching day in same or next valid month
            let foundNext = false;
            let tries = 0;
            while (tries < 365) {
              const nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + 1);
              if (extras.includes(nextDate.getDate())) {
                currentDate = nextDate;
                foundNext = true;
                break;
              }
              currentDate = nextDate;
              tries++;
            }
            if (!foundNext) break;
          } else {
            currentDate.setMonth(currentDate.getMonth() + interval);
          }
        } else if (freq === 'yearly') {
          if (extras.length > 0) {
            let foundNext = false;
            let tries = 0;
            while (tries < 365 * interval) {
              const nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + 1);
              if (extras.includes(nextDate.getMonth())) {
                currentDate = nextDate;
                foundNext = true;
                break;
              }
              currentDate = nextDate;
              tries++;
            }
            if (!foundNext) break;
          } else {
            currentDate.setFullYear(currentDate.getFullYear() + interval);
          }
        } else {
          break;
        }
      } else {
        switch (repeatType) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            return events;
        }
      }

      if (currentDate >= endRepeatDate) break;

      const repeatedEvent: WorkoutEvent = {
        ...baseEvent,
        id: `event_${Date.now()}_${counter}`,
        date: formatDateKey(currentDate),
        repeat: repeatType,
      };
      events.push(repeatedEvent);
      counter++;
    }

    return events;
  };

  const toggleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkoutIds(prev => {
      if (prev.includes(workoutId)) {
        return prev.filter(id => id !== workoutId);
      } else {
        return [...prev, workoutId];
      }
    });
  };

  const handleAdd = async () => {
    console.log('handleAdd called. title:', title, 'editMode:', editMode, 'editEventId:', editEventId, 'repeat:', repeat);
    try {
      const newEvent: WorkoutEvent = {
        id: editMode && editEventId ? editEventId : `event_${Date.now()}`,
        title: title || selectedWorkoutDay.toLowerCase().replace(' day', '') + ' day',
        workoutDay: selectedWorkoutDay,
        date: formatDateKey(startDate),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        alertMinutes: alertMinutes,
        secondAlertMinutes: secondAlertMinutes,
        calendar: selectedCalendar,
        workoutIds: selectedWorkoutIds,
        repeat: repeat,
        endRepeatDate: endRepeatDate === 'never' ? 'never' : endRepeatDate.toISOString(),
      };

      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];

      if (editMode && editEventId) {
        // Update existing event
        console.log('Updating event:', editEventId);
        const index = events.findIndex(e => e.id === editEventId);

        if (index > -1) {
          const oldEvent = events[index];
          const shouldRefreshSeries = oldEvent.repeat !== 'never' || repeat !== 'never';

          let baseEvents = events;
          if (shouldRefreshSeries) {
            // Prevent duplicate future occurrences when a recurring series is edited multiple times.
            const originalDate = new Date(oldEvent.date);
            baseEvents = events.filter((e) => {
              if (e.id === editEventId) return true;
              const sameTitle = e.title === oldEvent.title;
              const sameWorkoutDay = e.workoutDay === oldEvent.workoutDay;
              const sameCalendar = e.calendar === oldEvent.calendar;
              const dateIsFutureOrSame = new Date(e.date) >= originalDate;
              return !(sameTitle && sameWorkoutDay && sameCalendar && dateIsFutureOrSame);
            });
          }

          const updatedIndex = baseEvents.findIndex((e) => e.id === editEventId);
          if (updatedIndex > -1) {
            baseEvents[updatedIndex] = newEvent;
          } else {
            baseEvents.push(newEvent);
          }
          events = baseEvents;

          // If repeat setting changed from never to something else, or changed entirely,
          // we might want to generate future events. 
          // For simplicity, if editing the original event and changing repeat, generate futures.
          if (oldEvent.repeat !== repeat && repeat !== 'never') {
            console.log('Repeat setting changed in edit mode. Generating futures.');
            const newFutures = generateRepeatedEvents(newEvent, repeat);
            // Skip the first one as it's the one we just updated
            events = [...events, ...newFutures.slice(1)];
          }
        } else {
          // If not found (e.g. was a virtual event), just add it and its repeats
          const allEvents = generateRepeatedEvents(newEvent, repeat);
          events = [...events, ...allEvents];
        }
      } else {
        // Generate repeated events for new event
        console.log('Generating new event(s). Repeat:', repeat);
        const allEvents = generateRepeatedEvents(newEvent, repeat);
        events = [...events, ...allEvents];
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      console.log('Successfully saved events. Total:', events.length);

      navigation.goBack();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteThisEventOnly = async () => {
    if (!editEventId) return;

    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
      events = events.filter(e => e.id !== editEventId);
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteAllFutureEvents = async () => {
    if (!editEventId) return;

    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];

      // Find the current event to get its date and workout day
      const currentEvent = events.find(e => e.id === editEventId);
      if (currentEvent) {
        const currentDate = new Date(currentEvent.date);
        // Delete this event and all future events with the same workout day
        events = events.filter(e => {
          if (e.id === editEventId) return false;
          if (e.workoutDay === currentEvent.workoutDay) {
            const eventDate = new Date(e.date);
            if (eventDate >= currentDate) return false;
          }
          return true;
        });
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting events:', error);
    }
  };

  const handleDelete = () => {
    if (!editEventId) return;
    setShowDeleteModal(true);
  };

  // Toggle picker animation
  const toggleDateTimePicker = (field: 'startDate' | 'startTimePicker' | 'endDate' | 'endTimePicker' | 'repeat' | 'endRepeat' | 'alert' | 'secondAlert' | 'calendar' | 'workout' | null) => {
    if (activePickerField === field) {
      // Close picker
      setActivePickerField(null);
      Animated.timing(dateTimePickerHeight, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    } else {
      // Open picker
      setActivePickerField(field);
      // For DateTime and calendar-based pickers (startDate, endDate, endRepeat), we want more height
      const height = field === 'startDate' || field === 'endDate' || field === 'endRepeat' ? 400 : 250;
      Animated.timing(dateTimePickerHeight, {
        toValue: height,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  // Calendar helpers
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

  const isDateSelected = (date: Date, targetDate: Date): boolean => {
    return date.getDate() === targetDate.getDate() &&
      date.getMonth() === targetDate.getMonth() &&
      date.getFullYear() === targetDate.getFullYear();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleDateSelect = (day: Date, isStart: boolean, isRepeatEnd: boolean = false) => {
    if (isRepeatEnd) {
      const newDate = new Date(endRepeatDate === 'never' ? new Date() : endRepeatDate);
      newDate.setFullYear(day.getFullYear());
      newDate.setMonth(day.getMonth());
      newDate.setDate(day.getDate());
      setEndRepeatDate(newDate);
      return;
    }

    if (isStart) {
      const newStartDate = new Date(startDate);
      newStartDate.setFullYear(day.getFullYear());
      newStartDate.setMonth(day.getMonth());
      newStartDate.setDate(day.getDate());
      setStartDate(newStartDate);
    } else {
      const newEndDate = new Date(endDate);
      newEndDate.setFullYear(day.getFullYear());
      newEndDate.setMonth(day.getMonth());
      newEndDate.setDate(day.getDate());
      setEndDate(newEndDate);
    }
  };

  // Time picker values
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const getRepeatDescription = () => {
    if (repeat === 'never') return '';

    if (!repeat.startsWith('custom_')) {
      const option = REPEAT_OPTIONS.find(o => o.value === repeat);
      return `Repeats ${option?.label || ''}`;
    }

    const parts = repeat.split('_');
    const freq = parts[1];
    const interval = parseInt(parts[2] || '1');
    const extrasCsv = parts[3];
    const extras = extrasCsv ? extrasCsv.split(',').map(Number) : [];

    const unitMap: Record<string, string> = { daily: 'Day', weekly: 'Week', monthly: 'Month', yearly: 'Year' };
    const unit = unitMap[freq] || 'Day';

    let description = `Repeats every ${interval > 1 ? interval + ' ' : ''}${unit}${interval > 1 ? 's' : ''}`;

    if (freq === 'weekly' && extras.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      // Sort based on Sunday-last or Monday-first logic? Let's use 1-6, 0 order for display
      const displayOrder = [1, 2, 3, 4, 5, 6, 0];
      const selectedDays = extras
        .sort((a, b) => displayOrder.indexOf(a) - displayOrder.indexOf(b))
        .map(idx => dayNames[idx]);

      if (selectedDays.length === 1) {
        description += ` on ${selectedDays[0]}`;
      } else {
        const lastDay = selectedDays.pop();
        description += ` on ${selectedDays.join(', ')} and ${lastDay}`;
      }
    } else if (freq === 'monthly' && extras.length > 0) {
      description += ` on Day ${extras.sort((a, b) => a - b).join(', ')}`;
    } else if (freq === 'yearly' && extras.length > 0) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      description += ` in ${extras.sort((a, b) => a - b).map(idx => monthNames[idx]).join(', ')}`;
    }

    return description;
  };

  const calendarDays = useMemo(() => getDaysInMonth(pickerMonth), [pickerMonth]);

  const renderCalendarPicker = (target: 'start' | 'end' | 'repeatEnd') => {
    const targetDate = target === 'start' ? startDate : (target === 'end' ? endDate : (endRepeatDate === 'never' ? new Date() : endRepeatDate));
    const setTargetDate = (date: Date) => {
      if (target === 'start') setStartDate(date);
      else if (target === 'end') setEndDate(date);
      else setEndRepeatDate(date);
    };

    return (
      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => {
            const newMonth = new Date(pickerMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            setPickerMonth(newMonth);
          }}>
            <Feather name="chevron-left" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.monthNavText}>
            {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => {
            const newMonth = new Date(pickerMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            setPickerMonth(newMonth);
          }}>
            <Feather name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day, index) => (
            <Text key={index} style={[
              styles.weekdayText,
              index >= 5 && styles.weekendHeaderText,
            ]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const selected = isDateSelected(day, targetDate);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={styles.dayCell}
                onPress={() => handleDateSelect(day, target === 'start' ? true : false, target === 'repeatEnd')}
              >
                <View style={[
                  styles.dayNumber,
                  selected && styles.selectedDayNumber,
                  isToday(day) && !selected && styles.todayDayNumber,
                ]}>
                  <Text style={[
                    { color: '#FFF', fontSize: 20 },
                    isWeekend && !selected && styles.weekendDayText,
                    selected && styles.selectedDayText,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeSpinner = (isStart: boolean) => {
    const targetDate = isStart ? startDate : endDate;
    const setTargetDate = isStart ? setStartDate : setEndDate;

    // Time picker values
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    const selectedHour = String(targetDate.getHours()).padStart(2, '0');
    const selectedMinute = String(Math.floor(targetDate.getMinutes() / 5) * 5).padStart(2, '0');

    return (
      <View style={{ flexDirection: 'row', height: 200, paddingHorizontal: 8 }}>
        <Picker
          selectedValue={selectedHour}
          onValueChange={(value) => {
            const newDate = new Date(targetDate);
            newDate.setHours(parseInt(value as string));
            setTargetDate(newDate);
          }}
          itemStyle={{ color: '#FFF', fontSize: 22 }}
          style={{ flex: 1, height: 200 }}
        >
          {hours.map((hour) => (
            <Picker.Item key={hour} label={hour} value={hour} />
          ))}
        </Picker>
        <Picker
          selectedValue={selectedMinute}
          onValueChange={(value) => {
            const newDate = new Date(targetDate);
            newDate.setMinutes(parseInt(value as string));
            setTargetDate(newDate);
          }}
          itemStyle={{ color: '#FFF', fontSize: 22 }}
          style={{ flex: 1, height: 200 }}
        >
          {minutesList.map((minute) => (
            <Picker.Item key={minute} label={minute} value={minute} />
          ))}
        </Picker>
      </View>
    );
  };

  const renderWeeklySelector = () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday = 1, ..., Sunday = 0

    return (
      <View style={styles.subSelectorContainer}>
        <View style={styles.weeklyDaysList}>
          {days.map((day, idx) => {
            const dayIndex = dayIndices[idx];
            const isSelected = customRepeatDays.includes(dayIndex);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.weeklyDayRow, idx === days.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  if (isSelected) {
                    if (customRepeatDays.length > 1) {
                      setCustomRepeatDays(customRepeatDays.filter(d => d !== dayIndex));
                    }
                  } else {
                    setCustomRepeatDays([...customRepeatDays, dayIndex]);
                  }
                }}
              >
                <Text style={styles.weeklyDayText}>{day}</Text>
                {isSelected && <Feather name="check" size={20} color="#FF3B30" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthlySelector = () => {
    const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
    return (
      <View style={styles.subSelectorContainer}>
        <Text style={styles.gridHeaderTitle}>Each</Text>
        <View style={styles.monthlyGrid}>
          {daysInMonth.map(day => {
            const isSelected = customRepeatMonthlyDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.monthlyDayCell, isSelected && styles.selectedGridCell]}
                onPress={() => {
                  if (isSelected) {
                    if (customRepeatMonthlyDays.length > 1) {
                      setCustomRepeatMonthlyDays(customRepeatMonthlyDays.filter(d => d !== day));
                    }
                  } else {
                    setCustomRepeatMonthlyDays([...customRepeatMonthlyDays, day]);
                  }
                }}
              >
                <Text style={[styles.gridCellText, isSelected && styles.selectedGridCellText]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderYearlySelector = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
      <View style={styles.subSelectorContainer}>
        <View style={styles.yearlyGrid}>
          {months.map((month, idx) => {
            const isSelected = customRepeatYearlyMonths.includes(idx);
            return (
              <TouchableOpacity
                key={month}
                style={[styles.yearlyMonthCell, isSelected && styles.selectedGridCell]}
                onPress={() => {
                  if (isSelected) {
                    if (customRepeatYearlyMonths.length > 1) {
                      setCustomRepeatYearlyMonths(customRepeatYearlyMonths.filter(m => m !== idx));
                    }
                  } else {
                    setCustomRepeatYearlyMonths([...customRepeatYearlyMonths, idx]);
                  }
                }}
              >
                <Text style={[styles.gridCellText, isSelected && styles.selectedGridCellText]}>{month}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Full Modal Container - iOS Calendar style */}
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.circularIconButton}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{editMode ? 'Edit Workout' : 'New Workout'}</Text>

          <TouchableOpacity onPress={handleAdd} style={styles.circularAddButton}>
            <Feather name="check" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Event/Reminder Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, eventType === 'event' && styles.toggleButtonActive]}
            onPress={() => setEventType('event')}
          >
            <Text style={[styles.toggleText, eventType === 'event' && styles.toggleTextActive]}>
              Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, eventType === 'reminder' && styles.toggleButtonActive]}
            onPress={() => setEventType('reminder')}
          >
            <Text style={[styles.toggleText, eventType === 'reminder' && styles.toggleTextActive]}>
              Reminder
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title - Large Input */}
          <TextInput
            style={styles.eventTitleInput}
            placeholder="Title"
            placeholderTextColor="#636366"
            value={title}
            onChangeText={setTitle}
          />

          {/* Unified Settings Container */}
          <View style={styles.unifiedSettingsContainer}>

            {/* Workout Day Row - Only for Event */}
            {eventType === 'event' && (
              <>
                <TouchableOpacity
                  style={[styles.unifiedSettingRow, activePickerField === 'workout' && styles.unifiedSettingRowExpanded]}
                  onPress={() => toggleDateTimePicker('workout')}
                >
                  <Text style={styles.settingLabel}>Workout Day</Text>
                  <View style={styles.settingValueRow}>
                    <Text style={[styles.settingValue, { color: '#FFF' }, activePickerField === 'workout' && { color: '#9DEC2C' }]}>
                      {selectedWorkoutDay}
                    </Text>
                    <Feather name={activePickerField === 'workout' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                  </View>
                </TouchableOpacity>

                {activePickerField === 'workout' && (
                  <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                    <Picker
                      selectedValue={selectedWorkoutDay}
                      onValueChange={(value) => setSelectedWorkoutDay(value as WorkoutDayType)}
                      itemStyle={styles.pickerItem}
                      style={{ height: 200 }}
                    >
                      {ALL_WORKOUT_DAYS.map((day) => (
                        <Picker.Item key={day} label={day} value={day} />
                      ))}
                    </Picker>
                  </Animated.View>
                )}
                <View style={styles.unifiedSettingSeparator} />
              </>
            )}


            {/* Starts Row */}
            <View>
              <View style={styles.unifiedSettingRow}>
                <Text style={styles.settingLabel}>Starts</Text>
                <View style={styles.settingValueRow}>
                  <TouchableOpacity
                    style={[styles.dateTimePill, activePickerField === 'startDate' && styles.dateTimePillActive]}
                    onPress={() => toggleDateTimePicker('startDate')}
                  >
                    <Text style={[styles.dateTimePillText, activePickerField === 'startDate' && { color: '#9DEC2C' }]}>
                      {formatDatePill(startDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePill, activePickerField === 'startTimePicker' && styles.dateTimePillActive]}
                    onPress={() => toggleDateTimePicker('startTimePicker')}
                  >
                    <Text style={[styles.dateTimePillText, activePickerField === 'startTimePicker' && { color: '#9DEC2C' }]}>
                      {formatTime(startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {activePickerField === 'startDate' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  {renderCalendarPicker('start')}
                </Animated.View>
              )}
              {activePickerField === 'startTimePicker' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  {renderTimeSpinner(true)}
                </Animated.View>
              )}
            </View>

            <View style={styles.unifiedSettingSeparator} />

            {/* Ends Row */}
            <View>
              <View style={styles.unifiedSettingRow}>
                <Text style={styles.settingLabel}>Ends</Text>
                <View style={styles.settingValueRow}>
                  <TouchableOpacity
                    style={[styles.dateTimePill, activePickerField === 'endDate' && styles.dateTimePillActive]}
                    onPress={() => toggleDateTimePicker('endDate')}
                  >
                    <Text style={[styles.dateTimePillText, activePickerField === 'endDate' && { color: '#9DEC2C' }]}>
                      {formatDatePill(endDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePill, activePickerField === 'endTimePicker' && styles.dateTimePillActive]}
                    onPress={() => toggleDateTimePicker('endTimePicker')}
                  >
                    <Text style={[styles.dateTimePillText, activePickerField === 'endTimePicker' && { color: '#9DEC2C' }]}>
                      {formatTime(endDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {activePickerField === 'endDate' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  {renderCalendarPicker('end')}
                </Animated.View>
              )}
              {activePickerField === 'endTimePicker' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  {renderTimeSpinner(false)}
                </Animated.View>
              )}
            </View>

            <View style={styles.unifiedSettingSeparator} />

            {/* Repeat Row - Moved to separate container below */}
          </View>

          {/* Repeat Section - Separate Block */}
          <View style={styles.unifiedSettingsContainer}>
            <TouchableOpacity
              style={[styles.unifiedSettingRow, activePickerField === 'repeat' && styles.unifiedSettingRowExpanded]}
              onPress={() => toggleDateTimePicker('repeat')}
            >
              <Text style={styles.settingLabel}>Repeat</Text>
              <View style={styles.settingValueRow}>
                <Text style={[styles.settingValue, { color: '#FFF' }, (activePickerField === 'repeat' || repeat.startsWith('custom_')) && { color: '#9DEC2C' }]}>
                  {repeat.startsWith('custom_') ? 'Custom' : (REPEAT_OPTIONS.find(o => o.value === repeat)?.label || 'Never')}
                </Text>
                <Feather name={activePickerField === 'repeat' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {/* Repeat Picker */}
            {activePickerField === 'repeat' && (
              <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                <Picker
                  selectedValue={repeat.startsWith('custom_') ? 'custom' : repeat}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      if (repeat.startsWith('custom_')) {
                        const parts = repeat.split('_');
                        setCustomFrequency(parts[1] || 'daily');
                        setCustomInterval(parseInt(parts[2] || '1'));
                        const extrasCsv = parts[3];
                        if (extrasCsv) {
                          const extras = extrasCsv.split(',').map(Number);
                          if (parts[1] === 'weekly') setCustomRepeatDays(extras);
                          else if (parts[1] === 'monthly') setCustomRepeatMonthlyDays(extras);
                          else if (parts[1] === 'yearly') setCustomRepeatYearlyMonths(extras);
                        }
                      } else {
                        setCustomFrequency('daily');
                        setCustomInterval(1);
                        setCustomRepeatDays([new Date(startDate).getDay()]);
                      }
                      toggleDateTimePicker(null);
                      setShowCustomRepeatModal(true);
                    } else {
                      setRepeat(value);
                    }
                  }}
                  itemStyle={styles.pickerItem}
                  style={{ height: 200 }}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </Animated.View>
            )}

            {/* Repeat Description / Interaction Row */}
            {repeat !== 'never' && (
              <>
                <View style={styles.unifiedSettingSeparator} />
                <TouchableOpacity
                  style={styles.repeatDescriptionRowInteractive}
                  onPress={() => {
                    if (repeat.startsWith('custom_')) {
                      const parts = repeat.split('_');
                      setCustomFrequency(parts[1] || 'daily');
                      setCustomInterval(parseInt(parts[2] || '1'));
                      const extrasCsv = parts[3];
                      if (extrasCsv) {
                        const extras = extrasCsv.split(',').map(Number);
                        if (parts[1] === 'weekly') setCustomRepeatDays(extras);
                        else if (parts[1] === 'monthly') setCustomRepeatMonthlyDays(extras);
                        else if (parts[1] === 'yearly') setCustomRepeatYearlyMonths(extras);
                      }
                      setShowCustomRepeatModal(true);
                    } else {
                      toggleDateTimePicker('repeat');
                    }
                  }}
                >
                  <Text style={styles.repeatDescriptionTextInteractive}>{getRepeatDescription()}</Text>
                  <Feather name="chevron-right" size={14} color="#8E8E93" />
                </TouchableOpacity>

                <View style={styles.unifiedSettingSeparator} />

                {/* End Repeat Row */}
                <TouchableOpacity
                  style={[styles.unifiedSettingRow, activePickerField === 'endRepeat' && styles.unifiedSettingRowExpanded]}
                  onPress={() => toggleDateTimePicker('endRepeat')}
                >
                  <Text style={styles.settingLabel}>End Repeat</Text>
                  <View style={styles.settingValueRow}>
                    <Text style={[styles.settingValue, { color: '#FFF' }, activePickerField === 'endRepeat' && { color: '#9DEC2C' }]}>
                      {endRepeatDate === 'never' ? 'Repeat Forever' : formatDatePill(endRepeatDate)}
                    </Text>
                    <Feather name={activePickerField === 'endRepeat' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                  </View>
                </TouchableOpacity>

                {activePickerField === 'endRepeat' && (
                  <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                    <View style={styles.neverOptionContainer}>
                      <TouchableOpacity
                        style={[styles.neverOptionButton, endRepeatDate === 'never' && styles.neverOptionButtonActive]}
                        onPress={() => setEndRepeatDate('never')}
                      >
                        <Text style={[styles.neverOptionText, endRepeatDate === 'never' && styles.neverOptionTextActive]}>Repeat Forever</Text>
                      </TouchableOpacity>
                      <View style={styles.unifiedSettingSeparator} />
                    </View>
                    {renderCalendarPicker('repeatEnd')}
                  </Animated.View>
                )}
              </>
            )}
          </View>

          {/* Calendar & Alerts (Reminder Mode Only) inline inside unified container? Or separate? 
                Let's keep them here if active
            */}
          {eventType === 'reminder' && (
            <>
              <View style={styles.unifiedSettingSeparator} />
              <TouchableOpacity
                style={[styles.unifiedSettingRow, activePickerField === 'calendar' && styles.unifiedSettingRowExpanded]}
                onPress={() => toggleDateTimePicker('calendar')}
              >
                <Text style={styles.settingLabel}>Calendar</Text>
                <View style={styles.settingValueRow}>
                  <Text style={[styles.settingValue, { color: '#FFF' }, activePickerField === 'calendar' && { color: '#9DEC2C' }]}>
                    {selectedCalendar}
                  </Text>
                  <Feather name={activePickerField === 'calendar' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                </View>
              </TouchableOpacity>

              {activePickerField === 'calendar' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  <Picker
                    selectedValue={selectedCalendar}
                    onValueChange={(value) => setSelectedCalendar(value)}
                    itemStyle={styles.pickerItem}
                    style={{ height: 200 }}
                  >
                    <Picker.Item label="App Calendar" value="app_internal_calendar" />
                    {deviceCalendars.map((cal) => (
                      <Picker.Item key={cal.id} label={cal.title} value={cal.id} />
                    ))}
                  </Picker>
                </Animated.View>
              )}

              <View style={styles.unifiedSettingSeparator} />

              <TouchableOpacity
                style={[styles.unifiedSettingRow, activePickerField === 'alert' && styles.unifiedSettingRowExpanded]}
                onPress={() => toggleDateTimePicker('alert')}
              >
                <Text style={styles.settingLabel}>Alert</Text>
                <View style={styles.settingValueRow}>
                  <Text style={[styles.settingValue, { color: '#FFF' }, activePickerField === 'alert' && { color: '#9DEC2C' }]}>
                    {ALERT_OPTIONS.find(o => o.value === alertMinutes)?.label || 'None'}
                  </Text>
                  <Feather name={activePickerField === 'alert' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                </View>
              </TouchableOpacity>

              {activePickerField === 'alert' && (
                <Animated.View style={[styles.inlinePickerContainer, { height: dateTimePickerHeight }]}>
                  <Picker
                    selectedValue={alertMinutes}
                    onValueChange={(value) => setAlertMinutes(value)}
                    itemStyle={styles.pickerItem}
                    style={{ height: 200 }}
                  >
                    {ALERT_OPTIONS.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </Animated.View>
              )}

            </>
          )}

          {/* Suggested Workouts Container - Only visible in Event mode */}
          {
            eventType === 'event' && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>
                  Suggested {selectedWorkoutDay.replace(' DAY', '')} Workouts
                </Text>
                <View style={styles.workoutsGrid}>
                  {allWorkouts
                    .filter(w => {
                      const targetMuscles = WORKOUT_DAY_MUSCLE_GROUPS[selectedWorkoutDay] || [];
                      return targetMuscles.includes(w.muscleGroup);
                    })
                    .slice(0, 9)
                    .map((workout) => {
                      const isSelected = selectedWorkoutIds.includes(workout.workoutId);
                      return (
                        <TouchableOpacity
                          key={workout.workoutId}
                          style={[styles.workoutCard, isSelected && styles.workoutCardSelected]}
                          activeOpacity={0.7}
                          onPress={() => toggleWorkoutSelection(workout.workoutId)}
                        >
                          <View style={styles.workoutIconContainer}>
                            <workout.SvgIcon width={40} height={40} fill={isSelected ? '#000' : WORKOUT_DAY_COLORS[selectedWorkoutDay] || '#FFF'} />
                          </View>
                          <Text style={[styles.workoutName, isSelected && styles.workoutNameSelected]} numberOfLines={2}>{workout.name}</Text>
                          <Feather
                            name={isSelected ? "check-circle" : "plus-circle"}
                            size={18}
                            color={isSelected ? '#000' : WORKOUT_DAY_COLORS[selectedWorkoutDay] || '#FFF'}
                            style={styles.addIcon}
                          />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            )
          }

          <View style={{ height: 100 }} />
        </ScrollView>
      </View >

      {/* Custom Repeat Modal */}
      < Modal
        visible={showCustomRepeatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomRepeatModal(false)
        }
      >
        <View style={styles.customRepeatModal}>
          <View style={styles.customRepeatHeader}>
            <TouchableOpacity onPress={() => {
              let repeatValue = `custom_${customFrequency}_${customInterval}`;
              if (customFrequency === 'weekly') repeatValue += `_${customRepeatDays.join(',')}`;
              else if (customFrequency === 'monthly') repeatValue += `_${customRepeatMonthlyDays.join(',')}`;
              else if (customFrequency === 'yearly') repeatValue += `_${customRepeatYearlyMonths.join(',')}`;

              setRepeat(repeatValue);
              setShowCustomRepeatModal(false);
            }} style={{ padding: 4 }}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.customRepeatTitle}>Custom</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.customRepeatContent}>
            <TouchableOpacity style={styles.unifiedSettingRow} onPress={() => setShowFrequencyDropdown(true)}>
              <Text style={styles.settingLabel}>Frequency</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>
                  {CUSTOM_FREQUENCIES.find(f => f.value === customFrequency)?.label || 'Daily'}
                </Text>
                <Feather name="chevron-down" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            <View style={styles.unifiedSettingSeparator} />

            <TouchableOpacity
              style={styles.unifiedSettingRow}
              onPress={() => {
                setShowIntervalDropdown(true);
                setShowFrequencyDropdown(false);
              }}
            >
              <Text style={styles.settingLabel}>Every</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>
                  {customInterval} {CUSTOM_FREQUENCIES.find(f => f.value === customFrequency)?.unit}{customInterval > 1 ? 's' : ''}
                </Text>
                <Feather name="chevron-down" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.customRepeatDescription}>
            Event will occur every {customInterval} {CUSTOM_FREQUENCIES.find(f => f.value === customFrequency)?.unit}{customInterval > 1 ? 's' : ''}.
          </Text>

          <ScrollView style={{ flex: 1 }}>
            {customFrequency === 'weekly' && renderWeeklySelector()}
            {customFrequency === 'monthly' && renderMonthlySelector()}
            {customFrequency === 'yearly' && renderYearlySelector()}
            <View style={{ height: 40 }} />
          </ScrollView>

          <Modal
            transparent
            visible={showFrequencyDropdown}
            animationType="fade"
            onRequestClose={() => setShowFrequencyDropdown(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowFrequencyDropdown(false)}>
              <View style={styles.overlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.menuAnimatedWrapper, { top: 180, left: 40, right: 40 }]} pointerEvents="auto">
              <LiquidGlassCard borderRadius={20} width={SCREEN_WIDTH - 80}>
                {CUSTOM_FREQUENCIES.map(freq => (
                  <LiquidGlassMenuItem
                    key={freq.value}
                    label={freq.label}
                    onPress={() => {
                      setCustomFrequency(freq.value);
                      setShowFrequencyDropdown(false);
                    }}
                    icon={customFrequency === freq.value ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 18 }} />}
                  />
                ))}
              </LiquidGlassCard>
            </View>
          </Modal>

          <Modal
            transparent
            visible={showIntervalDropdown}
            animationType="fade"
            onRequestClose={() => setShowIntervalDropdown(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowIntervalDropdown(false)}>
              <View style={styles.overlay} />
            </TouchableWithoutFeedback>
            <View style={[styles.menuAnimatedWrapper, { top: 180, left: 40, right: 40 }]} pointerEvents="auto">
              <LiquidGlassCard borderRadius={20} width={SCREEN_WIDTH - 80}>
                <View style={{ height: 320 }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                      <LiquidGlassMenuItem
                        key={num}
                        label={String(num)}
                        onPress={() => {
                          setCustomInterval(num);
                          setShowIntervalDropdown(false);
                        }}
                        showCheck={customInterval === num}
                      />
                    ))}
                  </ScrollView>
                </View>
              </LiquidGlassCard>
            </View>
          </Modal>
        </View>
      </Modal >

      {/* Delete/More Options Modal if needed */}

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  circularIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9DEC2C', // Green accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#3A3A3C',
  },
  toggleText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventTitleInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 0,
    marginBottom: 20,
    padding: 0,
  },
  // Unified Settings Styles
  unifiedSettingsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  unifiedSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  unifiedSettingRowExpanded: {
    backgroundColor: 'rgba(157, 236, 44, 0.05)',
  },
  unifiedSettingSeparator: {
    height: 0.5,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 16,
  },
  settingLabel: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '400',
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 17,
    color: '#FFF',
  },
  inlinePickerContainer: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },

  // Calendar styles
  calendarContainer: {
    paddingVertical: 10,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  monthNavText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    width: (SCREEN_WIDTH - 64.1) / 7,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  weekendHeaderText: {
    color: '#8E8E93',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 64.1) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  selectedDayNumber: {
    backgroundColor: '#007AFF', // Blue selection for calendar
  },
  todayDayNumber: {
    backgroundColor: '#3A3A3C',
  },
  dayText: {
    color: '#FFF',
    fontSize: 15,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  weekendDayText: {
    color: '#8E8E93',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSeparator: {
    color: '#FFF',
    fontSize: 20,
    marginHorizontal: 10,
  },

  // Suggested Workouts
  suggestionsContainer: {
    marginTop: 0,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  workoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    height: 110,
  },
  workoutCardSelected: {
    backgroundColor: '#9DEC2C',
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  workoutNameSelected: {
    color: '#000',
    fontWeight: '600',
  },
  addIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  pickerItem: {
    color: '#FFF',
  },

  // Custom Repeat Modal Styles
  customRepeatModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  customRepeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  customRepeatTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  customRepeatContent: {
    marginTop: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    paddingHorizontal: 0, // Reset to allow internal grid alignment
  },
  customRepeatDescription: {
    color: '#8E8E93',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 10,
    lineHeight: 18,
  },
  dateTimePill: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  dateTimePillActive: {
    backgroundColor: 'rgba(157, 236, 44, 0.15)',
  },
  dateTimePillText: {
    color: '#FFF',
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuAnimatedWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Advanced Custom Repeat Styles
  subSelectorContainer: {
    marginTop: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  weeklyDaysList: {
    backgroundColor: '#1C1C1E',
  },
  weeklyDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  weeklyDayText: {
    color: '#FFF',
    fontSize: 16,
  },
  gridHeaderTitle: {
    color: '#8E8E93',
    fontSize: 14,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthlyDayCell: {
    width: (SCREEN_WIDTH - 64.1) / 7,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  yearlyMonthCell: {
    width: (SCREEN_WIDTH - 64.1) / 4,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  gridCellText: {
    color: '#FFF',
    fontSize: 16,
  },
  selectedGridCell: {
    backgroundColor: '#FF3B30',
  },
  selectedGridCellText: {
    fontWeight: '700',
  },
  repeatDescriptionRowInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  repeatDescriptionTextInteractive: {
    color: '#8E8E93',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  neverOptionContainer: {
    backgroundColor: '#1C1C1E',
  },
  neverOptionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  neverOptionButtonActive: {
    backgroundColor: 'rgba(157, 236, 44, 0.1)',
  },
  neverOptionText: {
    color: '#FFF',
    fontSize: 17,
  },
  neverOptionTextActive: {
    color: '#9DEC2C',
    fontWeight: '600',
  },
  recessedPickerContainer: {
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '50%',
    height: 40,
    marginTop: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    zIndex: 0,
  },
  recessedPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  recessedPicker: {
    flex: 1,
    height: 180,
  },
  recessedPickerItem: {
    color: '#FFF',
    fontSize: 22,
    textAlign: 'right',
  },
  recessedPickerUnitContainer: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 30,
  },
  recessedPickerUnitText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 32,
    paddingTop: 2,
  },
});
