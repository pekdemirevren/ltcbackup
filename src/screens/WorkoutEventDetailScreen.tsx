import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS, loadWorkoutDayCards } from '../utils/WorkoutDayManager';
import { allWorkouts, Workout, findExerciseIcon } from '../constants/workoutData';
import { collectibleWorkouts, CollectibleWorkout, collectibleRarityColors } from '../constants/collectibleWorkouts';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';
import MetricColors from '../constants/MetricColors';
import RNCalendarEvents, { Calendar } from 'react-native-calendar-events';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { Swipeable } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { loadWorkoutSettings } from '../utils/WorkoutSettingsManager';

type WorkoutEventDetailRouteParams = {
  eventId?: string;
  date: string;
  calendar?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  workoutDay?: WorkoutDayType;
};

type WorkoutEventDetailScreenProps = StackScreenProps<RootStackParamList, 'WorkoutEventDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

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
  endRepeatDate?: string | 'never';
}

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
  { label: '1 week before', value: 10080 },
];

const REPEAT_OPTIONS = [
  { label: 'Never', value: '' },
  { label: 'Every Day', value: 'daily' },
  { label: 'Every Week', value: 'weekly' },
  { label: 'Every 2 Weeks', value: 'biweekly' },
  { label: 'Every Month', value: 'monthly' },
  { label: 'Every Year', value: 'yearly' },
  { label: 'Custom...', value: 'custom' },
];

const CUSTOM_FREQUENCIES = [
  { label: 'Daily', value: 'daily', unit: 'day' },
  { label: 'Weekly', value: 'weekly', unit: 'week' },
  { label: 'Monthly', value: 'monthly', unit: 'month' },
  { label: 'Yearly', value: 'yearly', unit: 'year' },
];


// App's internal calendar identifier
const APP_CALENDAR_ID = 'app_internal_calendar';
const APP_CALENDAR = {
  id: APP_CALENDAR_ID,
  title: 'App Calendar',
  color: '#007AFF',
  source: 'Workout App',
};

// Calendar color mapping for different calendar sources
const getCalendarIcon = (source: string): string => {
  const sourceMap: { [key: string]: string } = {
    'icloud': 'cloud',
    'gmail': 'mail',
    'exchange': 'briefcase',
    'caldav': 'server',
    'local': 'calendar',
    'subscribed': 'rss',
  };
  return sourceMap[source.toLowerCase()] || 'calendar';
};

export default function WorkoutEventDetailScreen({ navigation, route }: WorkoutEventDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  const { eventId, date } = route.params as WorkoutEventDetailRouteParams;

  const [event, setEvent] = useState<WorkoutEvent | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]); // Can be Workout or CollectibleWorkout

  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false); // New Modal State
  const [searchQuery, setSearchQuery] = useState(''); // New Search State
  const [selectedWorkoutsToAdd, setSelectedWorkoutsToAdd] = useState<string[]>([]); // New Selection State
  const [deviceCalendars, setDeviceCalendars] = useState<Calendar[]>([]);
  const [calendarPermission, setCalendarPermission] = useState<string>('undetermined');
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [isEditing, setIsEditing] = useState(!eventId);
  const [editTitle, setEditTitle] = useState('');
  const [plannedSettings, setPlannedSettings] = useState<{ [key: string]: any }>({});
  const [actualSessions, setActualSessions] = useState<any[]>([]);

  // Custom Repeat Modal state
  const [showCustomRepeatModal, setShowCustomRepeatModal] = useState(false);
  const [customFrequency, setCustomFrequency] = useState<string>('daily');
  const [customInterval, setCustomInterval] = useState<number>(1);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  // Advanced Custom Repeat state
  const [customRepeatDays, setCustomRepeatDays] = useState<number[]>([new Date().getDay()]); // 0-6
  const [customRepeatMonthlyDays, setCustomRepeatMonthlyDays] = useState<number[]>([new Date().getDate()]); // 1-31
  const [customRepeatYearlyMonths, setCustomRepeatYearlyMonths] = useState<number[]>([new Date().getMonth()]); // 0-11
  const [endRepeatDate, setEndRepeatDate] = useState<Date | 'never'>('never');

  // Inline picker expansion state
  const [expandedSettingRow, setExpandedSettingRow] = useState<'alert' | 'secondAlert' | 'repeat' | 'workoutDay' | 'startTime' | 'endTime' | 'calendar' | 'startDate' | 'startTimePicker' | 'endDate' | 'endTimePicker' | 'endRepeatMenu' | null>(null);
  const pickerRowHeight = useRef(new Animated.Value(0)).current;
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const titleInputRef = useRef<TextInput>(null);

  const toggleSettingRow = (row: 'alert' | 'secondAlert' | 'repeat' | 'workoutDay' | 'startTime' | 'endTime' | 'calendar' | 'endDate') => {
    if (expandedSettingRow === row) {
      Animated.timing(pickerRowHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setExpandedSettingRow(null));
    } else {
      if (expandedSettingRow !== null) {
        Animated.timing(pickerRowHeight, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          setExpandedSettingRow(row);
          const targetHeight = row === 'endDate' ? 440 : 180;
          Animated.timing(pickerRowHeight, {
            toValue: targetHeight,
            duration: 200,
            useNativeDriver: false,
          }).start();
        });
      } else {
        setExpandedSettingRow(row);
        const targetHeight = row === 'endDate' ? 440 : 180;
        Animated.timing(pickerRowHeight, {
          toValue: targetHeight,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const modalScrollRef = useRef<ScrollView>(null);
  const sectionLayouts = useRef<{ [key: string]: number }>({});

  const scrollToLetter = (letter: string) => {
    const y = sectionLayouts.current[letter];
    if (y !== undefined && modalScrollRef.current) {
      modalScrollRef.current.scrollTo({ y, animated: true });
    }
  };

  // ... (maintain existing code)

  const handleSaveEvent = async () => {
    if (!event) return;
    const updatedEvent = { ...event, title: editTitle };
    await saveEventChanges(updatedEvent);
    setIsEditing(false);
  };

  const saveEventChanges = async (updatedEvent: WorkoutEvent) => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
      const index = events.findIndex(e => e.id === updatedEvent.id);

      const eventWithEnd = {
        ...updatedEvent,
        endRepeatDate: endRepeatDate === 'never' ? 'never' : endRepeatDate.toISOString()
      };

      if (index > -1) {
        events[index] = eventWithEnd;
      } else {
        events.push(eventWithEnd);
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setEvent(eventWithEnd);
    } catch (error) {
      console.error('Error saving event changes:', error);
    }
  };

  const handleRemoveWorkout = (workoutId: string) => {
    if (!event) return;
    const newWorkoutIds = event.workoutIds.filter(id => id !== workoutId);
    const updatedEvent = { ...event, workoutIds: newWorkoutIds };
    saveEventChanges(updatedEvent);
  };

  const handleAddSelectedWorkouts = () => {
    if (!event) return;
    // Combine existing and new, ensuring unique
    const uniqueIds = Array.from(new Set([...(event.workoutIds || []), ...selectedWorkoutsToAdd]));
    const updatedEvent = { ...event, workoutIds: uniqueIds };
    saveEventChanges(updatedEvent);

    // Also update local workouts state so the UI reflects immediately
    const newWorkoutObjects = selectedWorkoutsToAdd
      .filter(id => !(event.workoutIds || []).includes(id)) // only truly new
      .map(id => {
        // Try collectibleWorkouts first
        const cw = collectibleWorkouts.find(c => c.id === id);
        if (cw) return cw;
        // Then allWorkouts
        const aw = allWorkouts.find(w => w.workoutId === id || w.id === id);
        if (aw) {
          // Try to map to a collectible
          const mapped = collectibleWorkouts.find(c =>
            c.name === aw.name ||
            c.exercises.some(e => e.name === aw.name)
          );
          return mapped || aw;
        }
        return null;
      })
      .filter(Boolean);

    setWorkouts(prev => [...prev, ...newWorkoutObjects]);
    setShowAddWorkoutModal(false);
    setSelectedWorkoutsToAdd([]);
    setSearchQuery('');
  };

  const toggleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkoutsToAdd(prev => {
      if (prev.includes(workoutId)) {
        return prev.filter(id => id !== workoutId);
      } else {
        return [...prev, workoutId];
      }
    });
  };



  const renderWorkoutActions = (progress: any, dragX: any, workoutId: string) => {
    const BUTTON_SIZE = 56;

    const circleScale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const bodyScaleX = dragX.interpolate({
      inputRange: [-400, -80],
      outputRange: [320, 0],
      extrapolate: 'clamp',
    });

    const bodyTranslateX = dragX.interpolate({
      inputRange: [-400, -80],
      outputRange: [-160, 0],
      extrapolate: 'clamp',
    });

    const iconScale = dragX.interpolate({
      inputRange: [-150, -80, 0],
      outputRange: [1.2, 1, 0.5],
      extrapolate: 'clamp',
    });

    const iconTranslateX = dragX.interpolate({
      inputRange: [-400, -80, 0],
      outputRange: [130, 0, 0],
      extrapolate: 'clamp',
    });

    const leftCapTranslateX = dragX.interpolate({
      inputRange: [-400, -80, 0],
      outputRange: [-320, 0, 0],
      extrapolate: 'clamp',
    });

    const rightCapOpacity = dragX.interpolate({
      inputRange: [-85, -80],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width: 80, justifyContent: 'center', alignItems: 'flex-end' }}>
        <View style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Right Cap (Stationary Base) */}
          <Animated.View
            style={{
              position: 'absolute',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#FF3B30',
              opacity: rightCapOpacity,
              zIndex: 0,
            }}
          />

          {/* Body (Expanding Background) */}
          <Animated.View
            style={{
              position: 'absolute',
              height: BUTTON_SIZE,
              width: 1,
              backgroundColor: '#FF3B30',
              transform: [
                { translateX: bodyTranslateX },
                { scaleX: bodyScaleX }
              ],
              zIndex: 1,
            }}
          />

          {/* Left Cap (The Moving Head with Icon) */}
          <Animated.View
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#FF3B30',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [
                { translateX: leftCapTranslateX },
                { scale: circleScale }
              ],
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => handleRemoveWorkout(workoutId)}
              activeOpacity={0.7}
              style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }, { translateX: iconTranslateX }] }}>
                <Feather name="trash-2" size={24} color="#FFF" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };


  const [notificationPermission, setNotificationPermission] = useState<AuthorizationStatus | null>(null);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const buttonRef = useRef<View>(null);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const hasHandledBack = useRef(false);


  // Request calendar permission and load calendars
  const requestCalendarAccess = async () => {
    setLoadingCalendars(true);
    try {
      // Check current permission status
      const authStatus = await RNCalendarEvents.checkPermissions();

      if (authStatus === 'authorized') {
        setCalendarPermission('authorized');
        await loadDeviceCalendars();
      } else if (authStatus === 'denied') {
        setCalendarPermission('denied');
        Alert.alert(
          'Calendar Access Denied',
          'You need to grant permission from Settings to access your calendars.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings', onPress: () => {
                // On iOS, this will open the app settings
                if (Platform.OS === 'ios') {
                  Alert.alert('Go to Settings > Privacy > Calendars and enable this app.');
                }
              }
            }
          ]
        );
      } else {
        // Request permission
        const requestedAuth = await RNCalendarEvents.requestPermissions();
        setCalendarPermission(requestedAuth);

        if (requestedAuth === 'authorized') {
          await loadDeviceCalendars();
        }
      }
    } catch (error) {
      console.error('Calendar permission error:', error);
      Alert.alert('Error', 'An error occurred while checking calendar permissions.');
    } finally {
      setLoadingCalendars(false);
    }
  };

  const loadDeviceCalendars = async () => {
    try {
      const calendars = await RNCalendarEvents.findCalendars();
      // Filter only calendars that allow modifications
      const writableCalendars = calendars.filter(cal => cal.allowsModifications);
      setDeviceCalendars(writableCalendars);
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  };

  // Request notification permission for alerts
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const settings = await notifee.requestPermission();
      setNotificationPermission(settings.authorizationStatus);

      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        Alert.alert(
          'Notification Permission Required',
          'You need to grant notification permission for reminders. You can enable notifications from Settings.',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => notifee.openNotificationSettings()
            }
          ]
        );
        return false;
      }

      return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  // Check notification permission on mount
  const checkNotificationPermission = async () => {
    try {
      const settings = await notifee.getNotificationSettings();
      setNotificationPermission(settings.authorizationStatus);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  // Handle back navigation (both button and swipe gesture)
  const navigateBackToCalendar = useCallback(() => {
    if (hasHandledBack.current) return;
    hasHandledBack.current = true;

    navigation.navigate('Main', {
      screen: 'Summary',
      params: {
        screen: 'SummaryOverview',
        params: { openCalendar: true, selectedDate: date }
      }
    } as any);
  }, [navigation, date]);

  // Listen for back gesture/hardware back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If we've already handled the navigation, don't prevent it again
      if (hasHandledBack.current) {
        return;
      }

      // Prevent default behavior
      e.preventDefault();

      // Mark as handled and navigate
      hasHandledBack.current = true;
      // Navigate back to calendar with day view
      navigateBackToCalendar();
    });

    return unsubscribe;
  }, [navigation, navigateBackToCalendar]);

  useFocusEffect(
    useCallback(() => {
      loadEvent();
      checkNotificationPermission();
    }, [eventId])
  );


  const loadEvent = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const events: WorkoutEvent[] = JSON.parse(stored);
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
          setEditTitle(foundEvent.title);
          if (foundEvent.endRepeatDate) {
            setEndRepeatDate(foundEvent.endRepeatDate === 'never' ? 'never' : new Date(foundEvent.endRepeatDate));
          } else {
            setEndRepeatDate('never');
          }

          // Initialize internal custom repeat states from repeat string
          if (foundEvent.repeat?.startsWith('custom_')) {
            const parts = foundEvent.repeat.split('_');
            setCustomFrequency(parts[1] || 'daily');
            setCustomInterval(parseInt(parts[2] || '1'));
            const extrasCsv = parts[3];
            if (extrasCsv) {
              const extras = extrasCsv.split(',').map(Number);
              if (parts[1] === 'weekly') setCustomRepeatDays(extras);
              else if (parts[1] === 'monthly') setCustomRepeatMonthlyDays(extras);
              else if (parts[1] === 'yearly') setCustomRepeatYearlyMonths(extras);
            }
          }
          // Load workouts for this event
          const workoutIds = foundEvent.workoutIds || [];
          if (workoutIds.length > 0) {
            const eventWorkouts = workoutIds.map(id => {
              // Priority 1: Direct ID match in collectibleWorkouts
              const found = collectibleWorkouts.find(cw => cw.id === id);
              if (found) return found;

              // Priority 2: Old allWorkouts match, then try to find corresponding collectible
              const oldW = allWorkouts.find(w => w.workoutId === id || w.id === id);
              if (oldW) {
                const mapped = collectibleWorkouts.find(cw =>
                  cw.name === oldW.name ||
                  cw.exercises.some(e => e.name === oldW.name) ||
                  cw.exercises.some(e => oldW.name && oldW.name.includes(e.name))
                );
                return mapped || oldW;
              }
              return null;
            }).filter(Boolean);
            setWorkouts(eventWorkouts);
          } else {
            // Load from workout day cards
            const dayCards = await loadWorkoutDayCards(foundEvent.workoutDay);
            const dayWorkouts = dayCards.map(id => {
              const found = collectibleWorkouts.find(cw => cw.id === id);
              if (found) return found;

              const oldW = allWorkouts.find(w => w.workoutId === id || w.id === id);
              if (oldW) {
                const mapped = collectibleWorkouts.find(cw =>
                  cw.name === oldW.name ||
                  cw.exercises.some(e => e.name === oldW.name) ||
                  cw.exercises.some(e => oldW.name && oldW.name.includes(e.name))
                );
                return mapped || oldW;
              }
              return null;
            }).filter(Boolean).slice(0, 4);

            setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : collectibleWorkouts.filter(cw => cw.position === (foundEvent.workoutDay?.includes('PULL') ? 'PULL' : foundEvent.workoutDay?.includes('PUSH') ? 'PUSH' : 'LEGS')).slice(0, 4));
          }
        } else {
          // Create a default event based on date
          createDefaultEvent();
        }
      } else {
        createDefaultEvent();
      }
    } catch (error) {
      console.error('Error loading event:', error);
      createDefaultEvent();
    }
  };

  const isDateSelected = (day: Date, target: Date | string | 'never') => {
    if (target === 'never') return false;
    let t: Date;
    if (typeof target === 'string') {
      if (target.includes('-')) {
        const parts = target.split('-');
        t = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        t = new Date(target);
      }
    } else {
      t = target;
    }
    return day.getDate() === t.getDate() &&
      day.getMonth() === t.getMonth() &&
      day.getFullYear() === t.getFullYear();
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate();
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    let startDayIdx = firstDay.getDay() - 1; // Monday = 0
    if (startDayIdx < 0) startDayIdx = 6;

    for (let i = 0; i < startDayIdx; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  };

  const calendarDays = useMemo(() => getDaysInMonth(pickerMonth), [pickerMonth]);

  const handleDateSelect = async (day: Date, mode: 'start' | 'end' | 'repeatEnd') => {
    if (mode === 'repeatEnd') {
      setEndRepeatDate(day);
      return;
    }

    const newDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const updatedEvent = { ...event!, date: newDateStr };
    setEvent(updatedEvent);
    await saveEventChanges(updatedEvent);
  };

  const renderCalendarPicker = (target: 'repeatEnd' | 'eventDate') => {
    const targetDate = endRepeatDate === 'never' ? new Date() : endRepeatDate;

    return (
      <View style={styles.calendarPickerContainer}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => {
            const newMonth = new Date(pickerMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            setPickerMonth(newMonth);
          }}>
            <Feather name="chevron-left" size={20} color="#9DEC2C" />
          </TouchableOpacity>
          <Text style={styles.monthNavText}>
            {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => {
            const newMonth = new Date(pickerMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            setPickerMonth(newMonth);
          }}>
            <Feather name="chevron-right" size={20} color="#9DEC2C" />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {WEEKDAYS.map((day, index) => (
            <Text key={index} style={[
              styles.weekdayText,
              index >= 5 && styles.weekendHeaderText,
              index === 0 && { textAlign: 'left' }
            ]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const selected = isDateSelected(day, targetDate);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={styles.dayCell}
                onPress={() => handleDateSelect(day, 'repeatEnd')}
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

  const getRepeatDescription = () => {
    const repeatValue = event?.repeat || '';
    if (repeatValue === 'never' || !repeatValue) return '';

    if (!repeatValue.startsWith('custom_')) {
      const option = REPEAT_OPTIONS.find(o => o.value === repeatValue);
      return `Repeats ${option?.label || ''}`;
    }

    const parts = repeatValue.split('_');
    const freq = parts[1];
    const interval = parseInt(parts[2] || '1');
    const extrasCsv = parts[3];
    const extras = extrasCsv ? extrasCsv.split(',').map(Number) : [];

    const unitMap: Record<string, string> = { daily: 'Week', weekly: 'Week', monthly: 'Month', yearly: 'Year' };
    const unit = unitMap[freq] || 'Week';

    let description = `Repeats every ${interval > 1 ? interval + ' ' : ''}${unit}${interval > 1 ? 's' : ''}`;

    if (freq === 'weekly' && extras.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

  const formatDateLabel = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const loadWorkoutData = useCallback(async () => {
    if (!event) return;
    try {
      const storedSummaries = await AsyncStorage.getItem('workoutSummaries');
      const allSummaries = storedSummaries ? JSON.parse(storedSummaries) : [];

      const targetDate = new Date(event.date);

      const daySummaries = allSummaries.filter((s: any) => {
        const sd = new Date(s.date);
        return sd.getDate() === targetDate.getDate() &&
          sd.getMonth() === targetDate.getMonth() &&
          sd.getFullYear() === targetDate.getFullYear();
      });

      setActualSessions(daySummaries);

      const currentPlannedSettings: { [key: string]: any } = {};
      const workoutIds = event.workoutIds || [];
      if (workoutIds.length > 0) {
        for (const wId of workoutIds) {
          const settings = await loadWorkoutSettings(wId);
          currentPlannedSettings[wId] = settings;
        }
      }
      setPlannedSettings(currentPlannedSettings);
    } catch (error) {
      console.error('Error loading workout data:', error);
    }
  }, [event]);

  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  const createDefaultEvent = async () => {
    const defaultEvent: WorkoutEvent = {
      id: eventId || `event-${Date.now()}`,
      title: (route.params as WorkoutEventDetailRouteParams).title || 'New Workout',
      workoutDay: (route.params as WorkoutEventDetailRouteParams).workoutDay || 'LEG DAY',
      date: date,
      startTime: (route.params as WorkoutEventDetailRouteParams).startTime || '17:15',
      endTime: (route.params as WorkoutEventDetailRouteParams).endTime || '18:15',
      alertMinutes: 30,
      workoutIds: [],
      calendar: (route.params as WorkoutEventDetailRouteParams).calendar || 'pekdemirevren@gmail.com',
    };
    setEvent(defaultEvent);
    setEditTitle(defaultEvent.title);

    // Load workouts for this day
    const dayCards = await loadWorkoutDayCards('LEG DAY');
    const dayWorkouts = dayCards.map(id => {
      const found = collectibleWorkouts.find(cw => cw.id === id);
      if (found) return found;

      const oldW = allWorkouts.find(w => w.workoutId === id || w.id === id);
      if (oldW) {
        const mapped = collectibleWorkouts.find(cw =>
          cw.name === oldW.name ||
          cw.exercises.some(e => e.name === oldW.name)
        );
        return mapped || oldW;
      }
      return null;
    }).filter(Boolean).slice(0, 4);

    setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : collectibleWorkouts.filter(cw => cw.position === 'LEGS').slice(0, 4));
  };


  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this workout event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
              if (stored) {
                let events: WorkoutEvent[] = JSON.parse(stored);
                events = events.filter(e => e.id !== eventId);
                await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
              }
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting event:', error);
            }
          }
        }
      ]
    );
  };

  const handleAlertChange = async (minutes: number) => {
    // Request notification permission if setting an alert (not "None")
    if (minutes >= 0) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setExpandedSettingRow(null);
        return;
      }
    }

    if (event) {
      const updatedEvent = { ...event, alertMinutes: minutes };
      saveEventChanges(updatedEvent);
    }
    setExpandedSettingRow(null);
  };

  const handleSecondAlertChange = async (minutes: number) => {
    // Request notification permission if setting an alert (not "None")
    if (minutes >= 0) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setExpandedSettingRow(null);
        return;
      }
    }

    if (event) {
      const updatedEvent = { ...event, secondAlertMinutes: minutes };
      saveEventChanges(updatedEvent);
    }
    setExpandedSettingRow(null);
  };

  const handleCalendarChange = async (calendarValue: string) => {
    // If selecting a device calendar (not app calendar), ensure we have permission
    if (calendarValue !== APP_CALENDAR_ID) {
      const authStatus = await RNCalendarEvents.checkPermissions();
      if (authStatus !== 'authorized') {
        const requestedAuth = await RNCalendarEvents.requestPermissions();
        if (requestedAuth !== 'authorized') {
          Alert.alert(
            'Calendar Permission Required',
            'You need to grant calendar access permission to use this calendar.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings', onPress: () => {
                  if (Platform.OS === 'ios') {
                    Alert.alert('Go to Settings > Privacy > Calendars and enable this app.');
                  }
                }
              }
            ]
          );
          return;
        }
      }
    }

    if (event) {
      const updatedEvent = { ...event, calendar: calendarValue };
      saveEventChanges(updatedEvent);
    }
    setExpandedSettingRow(null);
  };

  const handleWorkoutDayChange = async (day: WorkoutDayType) => {
    if (!event) return;
    const updatedEvent = { ...event, workoutDay: day };
    setEvent(updatedEvent);

    // Refresh workouts for the new day
    const dayCards = await loadWorkoutDayCards(day);
    const dayWorkouts = dayCards.map(id => {
      const found = collectibleWorkouts.find(cw => cw.id === id);
      if (found) return found;
      const oldW = allWorkouts.find(w => w.workoutId === id || w.id === id);
      if (oldW) {
        const mapped = collectibleWorkouts.find(cw =>
          cw.name === oldW.name || cw.exercises.some(e => e.name === oldW.name)
        );
        return mapped || oldW;
      }
      return null;
    }).filter(Boolean);

    setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : collectibleWorkouts.filter(cw => cw.position === (day.includes('PULL') ? 'PULL' : day.includes('PUSH') ? 'PUSH' : 'LEGS')).slice(0, 4));
  };

  // handleTimeChange is now defined below with async save support

  const getAlertLabel = (minutes: number): string => {
    const option = ALERT_OPTIONS.find(o => o.value === minutes);
    return option?.label || 'None';
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const weekday = d.toLocaleString('en-US', { weekday: 'long' });
    return `${day} ${month} ${year} ${weekday}`;
  };

  const formatHeaderDate = (dateStr: string): string => {
    // Para YYYY-MM-DD formatını güvenli bir şekilde yerel saatte parse edelim
    const parts = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const monthStr = d.toLocaleString('en-US', { month: 'short' });
      return `${monthStr} ${day}`;
    }
    const d = new Date(dateStr);
    const day = d.getDate();
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    return `${monthStr} ${day}`;
  };

  // Calendar / Date helpers for inline pickers


  const formatDatePill = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  };

  const parseTimeToDate = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    return d;
  };

  const handleTimeChange = async (isStart: boolean, hour: string, minute: string) => {
    const newTime = `${hour}:${minute}`;
    const updatedEvent = isStart
      ? { ...event!, startTime: newTime }
      : { ...event!, endTime: newTime };
    setEvent(updatedEvent);
    await saveEventChanges(updatedEvent);
  };

  const DAY_WIDTH_EDIT = (SCREEN_WIDTH - 80) / 7;

  const renderEditCalendarPicker = (isStart: boolean) => {
    const dateStr = event!.date;
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {/* Month Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => {
            const nm = new Date(pickerMonth);
            nm.setMonth(nm.getMonth() - 1);
            setPickerMonth(nm);
          }}>
            <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>
              {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()} {'>'}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => {
              const nm = new Date(pickerMonth);
              nm.setMonth(nm.getMonth() - 1);
              setPickerMonth(nm);
            }}>
              <Feather name="chevron-left" size={20} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              const nm = new Date(pickerMonth);
              nm.setMonth(nm.getMonth() + 1);
              setPickerMonth(nm);
            }}>
              <Feather name="chevron-right" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {WEEKDAYS.map((day, index) => (
            <Text key={index} style={{
              flex: 1,
              textAlign: 'center',
              color: '#8E8E93',
              fontSize: 13,
              fontWeight: '600',
            }}>
              {day}
            </Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {calendarDays.map((day, index) => {
            if (!day) return <View key={`empty-${index}`} style={{ width: (SCREEN_WIDTH - 50.1) / 7, height: 40 }} />;
            const selected = isDateSelected(day, dateStr);
            const todayDay = isToday(day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={{ width: (SCREEN_WIDTH - 50.1) / 7, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleDateSelect(day, isStart ? 'start' : 'end')}
              >
                <View style={[
                  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
                  selected && { backgroundColor: '#FF3B30' },
                  todayDay && !selected && { borderWidth: 1, borderColor: '#FF3B30' },
                ]}>
                  <Text style={[
                    { color: '#FFF', fontSize: 20 },
                    selected && { color: '#FFF', fontWeight: '700' },
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
    const timeStr = isStart ? event!.startTime : event!.endTime;
    const [h, m] = timeStr.split(':');
    const selectedHour = h;
    const selectedMinute = String(Math.floor(parseInt(m) / 5) * 5).padStart(2, '0');
    return (
      <View style={{ flexDirection: 'row', height: 200, paddingHorizontal: 8 }}>
        <Picker
          selectedValue={selectedHour}
          onValueChange={(value) => handleTimeChange(isStart, value as string, selectedMinute)}
          itemStyle={{ color: '#FFF', fontSize: 22 }}
          style={{ flex: 1, height: 200 }}
        >
          {hours.map((hour) => (
            <Picker.Item key={hour} label={hour} value={hour} />
          ))}
        </Picker>
        <Picker
          selectedValue={selectedMinute}
          onValueChange={(value) => handleTimeChange(isStart, selectedHour, value as string)}
          itemStyle={{ color: '#FFF', fontSize: 22 }}
          style={{ flex: 1, height: 200 }}
        >
          {minutes.map((minute) => (
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
  const handleOpenMenu = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ top: y - 90, right: 20 });
      setShowMenu(true);
    });
  };

  const handleSetAllSets = () => {
    setShowMenu(false);
    // Navigate to sets setting or show picker
    Alert.alert('Set All Sets', 'This will set the number of sets for all workouts in this event.');
  };

  const handleSetAllReps = () => {
    setShowMenu(false);
    // Navigate to reps setting or show picker
    Alert.alert('Set All Reps', 'This will set the number of reps for all workouts in this event.');
  };

  // Animation interpolations
  const buttonOpacity = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const buttonScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const buttonTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const eventColor = WORKOUT_DAY_COLORS[event.workoutDay] || '#4A90D9';

  // Generate time slots for the timeline - dynamic based on event duration
  const startHour = parseInt(event.startTime.split(':')[0]);
  const startMin = parseInt(event.startTime.split(':')[1]);
  const endHour = parseInt(event.endTime.split(':')[0]);
  const endMin = parseInt(event.endTime.split(':')[1]);

  // Show hours from one hour before start to one hour after end (minimum 3 hours)
  const hoursToShow: number[] = [];
  const displayStartHour = Math.max(0, startHour);
  const displayEndHour = Math.min(23, endHour + 1);
  for (let h = displayStartHour; h <= displayEndHour; h++) {
    hoursToShow.push(h);
  }
  // Ensure at least 3 hours are shown
  while (hoursToShow.length < 3) {
    const lastHour = hoursToShow[hoursToShow.length - 1];
    if (lastHour < 23) {
      hoursToShow.push(lastHour + 1);
    } else {
      break;
    }
  }

  // Calculate event position - each hour slot is 60px for better visibility
  const HOUR_HEIGHT = 60;
  const VERTICAL_PADDING = 16; // Equal top and bottom padding
  const firstHour = hoursToShow[0];

  // Calculate minutes from the start of timeline to event start
  const eventStartTotalMinutes = startHour * 60 + startMin;
  const timelineStartMinutes = firstHour * 60;
  const offsetMinutes = eventStartTotalMinutes - timelineStartMinutes;
  const eventTop = (offsetMinutes / 60) * HOUR_HEIGHT;

  // Calculate event height based on duration (minimum 30px for very short events)
  const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
  const calculatedHeight = (durationMinutes / 60) * HOUR_HEIGHT;
  const eventHeight = Math.max(30, calculatedHeight);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circularIconButton}
          onPress={isEditing && eventId ? () => setIsEditing(false) : navigateBackToCalendar}
        >
          <Feather name={isEditing && eventId ? "x" : "chevron-left"} size={22} color="#FFF" />
          {(!isEditing || !eventId) && <Text style={styles.backButtonText}>{isEditing ? "Cancel" : "Calendar"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circularIconButton}
          onPress={() => {
            if (isEditing) {
              handleSaveEvent();
            } else {
              if (event) {
                navigation.navigate('CreateWorkoutEventScreen', {
                  eventId: event.id,
                  editMode: true,
                  date: event.date,
                  startTime: event.startTime,
                  endTime: event.endTime,
                  workoutDay: event.workoutDay,
                  title: event.title,
                  repeat: event.repeat,
                });
              }
            }
          }}
        >
          <Text style={[styles.backButtonText, isEditing && { color: '#9DEC2C' }]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title */}
        {isEditing ? (
          <View style={{ backgroundColor: '#1C1C1E', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <TextInput
              ref={titleInputRef}
              style={[styles.eventTitleInput, { marginBottom: 0, paddingVertical: 8, paddingHorizontal: 0 }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus={true}
              selectionColor="#FF3B30"
            />
          </View>
        ) : (
          <Text style={styles.eventTitle}>{event.title}</Text>
        )}

        {/* Date & Time */}
        <Text style={styles.dateText}>{formatDate(event.date)}</Text>
        <Text style={styles.timeText}>{event.startTime} – {event.endTime}</Text>

        {/* Timeline Block (View Mode) or Settings (Edit Mode) */}
        {!isEditing ? (
          <View style={[styles.timelineContainer, { paddingTop: VERTICAL_PADDING, paddingBottom: 0 }]}>
            {/* Hour Rows */}
            {hoursToShow.map((hour, index) => {
              const isLastRow = index === hoursToShow.length - 1;
              return (
                <View key={`${hour}-${index}`} style={[styles.hourRow, { height: isLastRow ? VERTICAL_PADDING : HOUR_HEIGHT }]}>
                  <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                  <View style={styles.hourSeparator} />
                </View>
              );
            })}

            {/* Event Card */}
            <View style={[
              styles.eventBlock,
              {
                backgroundColor: eventColor,
                position: 'absolute',
                left: 66,
                right: 16,
                top: VERTICAL_PADDING + eventTop,
                height: eventHeight,
              }
            ]}>
              <Text style={styles.eventBlockTitle}>{event.title}</Text>
              <Text style={styles.eventBlockTime}>{event.startTime} – {event.endTime}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.editSettingsBox}>
            {/* Workout Day Selection */}
            <TouchableOpacity
              style={styles.unifiedSettingRow}
              onPress={() => toggleSettingRow('workoutDay')}
            >
              <Text style={styles.settingLabel}>Workout Day</Text>
              <View style={styles.settingValueRow}>
                <View style={[styles.dayIndicator, { backgroundColor: WORKOUT_DAY_COLORS[event.workoutDay] }]} />
                <Text style={styles.settingValue}>{event.workoutDay}</Text>
                <Feather name="chevron-down" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {expandedSettingRow === 'workoutDay' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                {['PUSH DAY', 'PULL DAY', 'LEG DAY', 'OFF DAY'].map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, event.workoutDay === day && { backgroundColor: WORKOUT_DAY_COLORS[day] }]}
                    onPress={() => handleWorkoutDayChange(day as WorkoutDayType)}
                  >
                    <Text style={[styles.dayChipText, event.workoutDay === day && { color: '#000' }]}>{day.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.unifiedSettingSeparator} />

            {/* Starts Row */}
            <View>
              <View style={styles.unifiedSettingRow}>
                <Text style={styles.settingLabel}>Starts</Text>
                <View style={styles.settingValueRow}>
                  <TouchableOpacity
                    style={[styles.dateTimePill, expandedSettingRow === 'startDate' && styles.dateTimePillActive]}
                    onPress={() => setExpandedSettingRow(expandedSettingRow === 'startDate' ? null : 'startDate')}
                  >
                    <Text style={[styles.dateTimePillText, expandedSettingRow === 'startDate' && { color: '#FF3B30' }]}>
                      {formatDatePill(event.date)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePill, expandedSettingRow === 'startTimePicker' && styles.dateTimePillActive]}
                    onPress={() => setExpandedSettingRow(expandedSettingRow === 'startTimePicker' ? null : 'startTimePicker')}
                  >
                    <Text style={[styles.dateTimePillText, expandedSettingRow === 'startTimePicker' && { color: '#FF3B30' }]}>
                      {event.startTime}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {expandedSettingRow === 'startDate' && renderEditCalendarPicker(true)}
              {expandedSettingRow === 'startTimePicker' && renderTimeSpinner(true)}
            </View>

            <View style={styles.unifiedSettingSeparator} />

            {/* Ends Row */}
            <View>
              <View style={styles.unifiedSettingRow}>
                <Text style={styles.settingLabel}>Ends</Text>
                <View style={styles.settingValueRow}>
                  <TouchableOpacity
                    style={[styles.dateTimePill, expandedSettingRow === 'endDate' && styles.dateTimePillActive]}
                    onPress={() => setExpandedSettingRow(expandedSettingRow === 'endDate' ? null : 'endDate')}
                  >
                    <Text style={[styles.dateTimePillText, expandedSettingRow === 'endDate' && { color: '#FF3B30' }]}>
                      {formatDatePill(event.date)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePill, expandedSettingRow === 'endTimePicker' && styles.dateTimePillActive]}
                    onPress={() => setExpandedSettingRow(expandedSettingRow === 'endTimePicker' ? null : 'endTimePicker')}
                  >
                    <Text style={[styles.dateTimePillText, expandedSettingRow === 'endTimePicker' && { color: '#FF3B30' }]}>
                      {event.endTime}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {expandedSettingRow === 'endDate' && renderEditCalendarPicker(false)}
              {expandedSettingRow === 'endTimePicker' && renderTimeSpinner(false)}
            </View>
          </View>
        )}

        {/* Calendar, Alerts & Repeat Container */}
        <View style={styles.unifiedSettingsContainer}>
          {/* Calendar Row */}
          <TouchableOpacity
            style={styles.unifiedSettingRow}
            onPress={
              async (e) => {
                const { pageY } = e.nativeEvent;
                const menuHeight = 240; // Estimated height for Calendar menu
                const topPosition = Math.max(80, pageY - menuHeight - 10);
                setMenuPosition({ top: topPosition, right: 20 });

                if (calendarPermission !== 'authorized') {
                  await requestCalendarAccess();
                }
                setExpandedSettingRow(expandedSettingRow === 'calendar' ? null : 'calendar');
              }
            }
          >
            <Text style={styles.settingLabel}>Calendar</Text>
            <View style={styles.settingValueRow}>
              {loadingCalendars ? (
                <ActivityIndicator size="small" color="#8E8E93" />
              ) : (
                <>
                  <View style={[styles.calendarDot, {
                    backgroundColor: event.calendar === APP_CALENDAR_ID
                      ? APP_CALENDAR.color
                      : deviceCalendars.find(c => c.id === event.calendar)?.color || APP_CALENDAR.color
                  }]} />
                  <Text style={[styles.settingValue, { color: '#FFF' }]}>
                    {event.calendar === APP_CALENDAR_ID || !event.calendar
                      ? APP_CALENDAR.title
                      : deviceCalendars.find(c => c.id === event.calendar)?.title || APP_CALENDAR.title
                    }
                  </Text>
                  <Feather name="chevron-right" size={16} color="#8E8E93" />
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.unifiedSettingSeparator} />

          {/* Alert Row */}
          <TouchableOpacity
            style={styles.unifiedSettingRow}
            onPress={(e) => {
              const { pageY } = e.nativeEvent;
              const menuHeight = 350; // Estimated height for Alert menu
              const topPosition = Math.max(80, pageY - menuHeight - 10);
              setMenuPosition({ top: topPosition, right: 20 });
              setExpandedSettingRow(expandedSettingRow === 'alert' ? null : 'alert');
            }}
          >
            <Text style={styles.settingLabel}>Alert</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: '#FFF' }]}>
                {getAlertLabel(event.alertMinutes)}
              </Text>
              <Feather name="chevron-right" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>

          <View style={styles.unifiedSettingSeparator} />

          {/* Second Alert Row */}
          <TouchableOpacity
            style={styles.unifiedSettingRow}
            onPress={(e) => {
              const { pageY } = e.nativeEvent;
              const menuHeight = 350; // Estimated height for Second Alert menu
              const topPosition = Math.max(80, pageY - menuHeight - 10);
              setMenuPosition({ top: topPosition, right: 20 });
              setExpandedSettingRow(expandedSettingRow === 'secondAlert' ? null : 'secondAlert');
            }}
          >
            <Text style={styles.settingLabel}>Second Alert</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: '#FFF' }]}>
                {event.secondAlertMinutes !== undefined ? getAlertLabel(event.secondAlertMinutes) : 'None'}
              </Text>
              <Feather name="chevron-right" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>

          <View style={styles.unifiedSettingSeparator} />

          {/* Repeat Row */}
          <View>
            <TouchableOpacity
              style={styles.unifiedSettingRow}
              onPress={(e) => {
                const { pageY } = e.nativeEvent;
                const menuHeight = 320; // Estimated height for Repeat menu
                const topPosition = Math.max(80, pageY - menuHeight - 10);
                setMenuPosition({ top: topPosition, right: 20 });
                setExpandedSettingRow('repeat');
              }}
            >
              <Text style={styles.settingLabel}>Repeat</Text>
              <View style={styles.settingValueRow}>
                <Text style={[styles.settingValue, { color: '#FFF' }, (expandedSettingRow === 'repeat' || (event?.repeat && event.repeat.startsWith('custom_'))) && { color: '#9DEC2C' }]}>
                  {event?.repeat?.startsWith('custom_') ? 'Custom' : (REPEAT_OPTIONS.find(o => o.value === event?.repeat)?.label || 'Never')}
                </Text>
                <Feather name="chevron-right" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>


            {event?.repeat && event.repeat !== '' && (
              <>
                <View style={styles.unifiedSettingSeparator} />
                <TouchableOpacity
                  style={styles.repeatDescriptionRowInteractive}
                  onPress={(e) => {
                    if (event.repeat!.startsWith('custom_')) {
                      const parts = event.repeat!.split('_');
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
                      // Toggle repeat selection menu
                      const { pageY } = e.nativeEvent;
                      const menuHeight = 320;
                      const topPosition = Math.max(80, pageY - menuHeight - 10);
                      setMenuPosition({ top: topPosition, right: 20 });
                      setExpandedSettingRow('repeat');
                    }
                  }}
                >
                  <Text style={styles.repeatDescriptionTextInteractive}>{getRepeatDescription()}</Text>
                  <Feather name="chevron-right" size={14} color="#8E8E93" />
                </TouchableOpacity>

                <View style={styles.unifiedSettingSeparator} />

                {/* End Repeat Row */}
                <TouchableOpacity
                  style={styles.unifiedSettingRow}
                  onPress={(e) => {
                    const { pageY } = e.nativeEvent;
                    const menuHeight = 160; // Narrower menu (Never/On Date)
                    const topPosition = Math.max(80, pageY - menuHeight - 10);
                    setMenuPosition({ top: topPosition, right: 20 });
                    setExpandedSettingRow('endRepeatMenu');
                  }}
                >
                  <Text style={styles.settingLabel}>End Repeat</Text>
                  <View style={styles.settingValueRow}>
                    <Text style={[styles.settingValue, { color: '#FFF' }]}>
                      {endRepeatDate === 'never' ? 'Never' : 'On Date'}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#8E8E93" />
                  </View>
                </TouchableOpacity>

                {endRepeatDate !== 'never' && (
                  <>
                    <View style={styles.unifiedSettingSeparator} />
                    {/* End Date Row - Appears when On Date is selected */}
                    <TouchableOpacity
                      style={styles.unifiedSettingRow}
                      onPress={() => toggleSettingRow('endDate')}
                    >
                      <Text style={styles.settingLabel}>End Date</Text>
                      <View style={styles.settingValueRow}>
                        <Text style={[styles.settingValue, { color: '#FFF' }, expandedSettingRow === 'endDate' && { color: '#9DEC2C' }]}>
                          {formatDateLabel(endRepeatDate)}
                        </Text>
                        <Feather name={expandedSettingRow === 'endDate' ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                      </View>
                    </TouchableOpacity>

                    {expandedSettingRow === 'endDate' && (
                      <Animated.View style={{ height: pickerRowHeight, overflow: 'hidden' }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 0, borderRadius: 0 }}>
                          {renderCalendarPicker('repeatEnd')}
                        </View>
                      </Animated.View>
                    )}
                  </>
                )}

              </>
            )}
          </View>
        </View>

        {/* Workout Section */}
        <View style={styles.workoutSection}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutSectionTitle}>Workouts</Text>
          </View>

          {/* Workout Cards - Unified Container Layout */}
          <View style={styles.workoutsList}>
            {workouts.map((workout, index) => {
              const isCollectible = 'rarity' in workout;

              const workoutName = isCollectible && (workout as any).exercises?.length > 0
                ? (workout as any).exercises[0].name
                : workout.name;

              const workoutId = isCollectible
                ? (workout as any).id
                : (workout as Workout).workoutId;

              let SvgIcon = (workout as any).SvgIcon;
              if (isCollectible && (workout as any).exercises?.length > 0) {
                SvgIcon = findExerciseIcon((workout as any).exercises[0].name);
              }

              const planned = plannedSettings[workoutId];
              const actualSession = actualSessions.find((s: any) => s.workoutId === workoutId);

              const displayWeight = actualSession?.settings?.weight
                ? actualSession.settings.weight
                : (planned?.weight || 0);

              let defaultSets = 3;
              let defaultReps = 6;
              const match = workoutName.match(/(\d+)[xX](\d+)/);
              if (match) {
                defaultSets = parseInt(match[1]);
                defaultReps = parseInt(match[2]);
              }

              const displayRepsSetting = actualSession
                ? `${actualSession.completedSets || 0}x${actualSession.completedReps || 0}`
                : `${planned?.targetSets || String(defaultSets)}x${planned?.targetReps || String(defaultReps)}`;

              return (
                <View key={`${workoutId}-${index}`}>
                  <Swipeable
                    renderRightActions={(progress, dragX) => renderWorkoutActions(progress, dragX, workoutId)}
                    friction={1.25}
                    rightThreshold={40}
                    overshootRight={true}
                    useNativeAnimations={false}
                  >
                    <TouchableOpacity
                      style={styles.workoutCard}
                      onPress={() => {
                        navigation.navigate('GenericWorkoutSettingsScreen', {
                          workoutId: workoutId,
                          workoutName: workoutName,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#122003', '#213705']}
                        style={[styles.workoutIconContainer, { width: 50, height: 50, borderRadius: 25 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {SvgIcon ? (
                          <SvgIcon width={30} height={30} fill="#9DEC2C" />
                        ) : (
                          <MaterialCommunityIcons name="dumbbell" size={26} color="#9DEC2C" />
                        )}
                      </LinearGradient>
                      <View style={styles.workoutInfo}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.workoutTitle} numberOfLines={1}>{workoutName}</Text>
                          {actualSession && (
                            <View style={styles.workoutStatusContainer}>
                              <Text style={[styles.workoutStatusLabel, { color: '#9DEC2C' }]}>
                                DONE
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={styles.workoutValue}>{displayWeight}</Text>
                          <Text style={styles.workoutUnit}>KG</Text>
                          <Text style={styles.workoutSeparator}> / </Text>
                          <Text style={styles.workoutValue}>{displayRepsSetting}</Text>
                          <Text style={styles.workoutUnit}>REPS</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Add Workout Button */}
        <TouchableOpacity
          style={[styles.bottomLargeButton, { marginBottom: 10 }]}
          onPress={() => setShowAddWorkoutModal(true)}
          activeOpacity={1}
        >
          <Text style={styles.bottomLargeButtonText}>Add Workout</Text>
        </TouchableOpacity>



        {/* Delete Button */}
        <TouchableOpacity
          style={styles.bottomLargeButton}
          onPress={handleDelete}
          activeOpacity={1}
        >
          <Text style={[styles.bottomLargeButtonText, { color: '#FF3B30' }]}>Delete Workout</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal
        visible={showAddWorkoutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddWorkoutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.circularCloseButton} onPress={() => setShowAddWorkoutModal(false)}>
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Workout</Text>
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              To track other workout types, connect Apple Watch, AirPods with heart rate detection, or a device with a heart rate sensor.
            </Text>

            {/* Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={20} color="#8E8E93" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search workouts..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x-circle" size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Workouts List */}
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <ScrollView
                ref={modalScrollRef}
                contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
              >
                {(() => {
                  const filtered = allWorkouts.filter(w =>
                    w.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                  const grouped: { [key: string]: typeof allWorkouts } = {};
                  filtered.forEach(workout => {
                    const letter = workout.name[0].toUpperCase();
                    if (!grouped[letter]) grouped[letter] = [];
                    grouped[letter].push(workout);
                  });

                  return Object.keys(grouped).sort().map(letter => (
                    <View
                      key={letter}
                      style={{ marginBottom: 20 }}
                      onLayout={(layoutEvent) => {
                        const layout = layoutEvent.nativeEvent.layout;
                        sectionLayouts.current[letter] = layout.y;
                      }}
                    >
                      <Text style={{
                        color: '#8E8E93',
                        fontSize: 15,
                        fontWeight: '600',
                        marginBottom: 8,
                        marginLeft: 0,
                      }}>{letter}</Text>
                      <View style={{
                        backgroundColor: '#1C1C1E',
                        borderRadius: 28,
                        overflow: 'hidden',
                      }}>
                        {grouped[letter].map((workout, index) => {
                          const isSelected = selectedWorkoutsToAdd.includes(workout.workoutId);
                          const isAlreadyInEvent = event?.workoutIds?.includes(workout.workoutId);

                          return (
                            <React.Fragment key={workout.workoutId}>
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 14,
                                  paddingHorizontal: 16,
                                  backgroundColor: isSelected ? 'rgba(157, 236, 44, 0.08)' : 'transparent',
                                }}
                                onPress={() => !isAlreadyInEvent && toggleWorkoutSelection(workout.workoutId)}
                                disabled={isAlreadyInEvent}
                                activeOpacity={0.7}
                              >
                                {/* Green Icon */}
                                <View style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 8,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  marginRight: 14,
                                }}>
                                  <workout.SvgIcon width={32} height={32} fill="#9DEC2C" />
                                </View>

                                {/* Workout Name */}
                                <View style={{ flex: 1 }}>
                                  <Text style={{
                                    color: isSelected ? '#9DEC2C' : '#FFF',
                                    fontSize: 17,
                                    fontWeight: '400',
                                  }}>{workout.name}</Text>
                                </View>

                                {/* Status Indicator */}
                                {isAlreadyInEvent ? (
                                  <Text style={{ color: '#8E8E93', fontSize: 12 }}>Added</Text>
                                ) : (
                                  isSelected && (
                                    <Feather name="check-circle" size={22} color="#9DEC2C" />
                                  )
                                )}
                              </TouchableOpacity>
                              {index < grouped[letter].length - 1 && (
                                <View style={{
                                  height: StyleSheet.hairlineWidth,
                                  backgroundColor: '#333',
                                  marginLeft: 70,
                                }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    </View>
                  ));
                })()}
              </ScrollView>

              {/* Vertical Alphabet Index */}
              <View style={{
                position: 'absolute',
                right: -16,
                top: -100,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                width: 18,
                zIndex: 10,
              }}>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => scrollToLetter(letter)}
                    hitSlop={{ top: 2, bottom: 2, left: 8, right: 8 }}
                  >
                    <Text style={{
                      color: '#9DEC2C',
                      fontSize: 12,
                      fontWeight: '700',
                      lineHeight: 15,
                    }}>{letter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Floating Add Button */}
            {selectedWorkoutsToAdd.length > 0 && (
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddSelectedWorkouts}
              >
                <Text style={styles.modalAddButtonText}>Add {selectedWorkoutsToAdd.length} Workouts</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendar LiquidGlass Menu */}
      <Modal
        transparent
        visible={expandedSettingRow === 'calendar'}
        animationType="fade"
        onRequestClose={() => setExpandedSettingRow(null)}
      >
        <TouchableWithoutFeedback onPress={() => setExpandedSettingRow(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.menuAnimatedWrapper, { top: menuPosition.top, right: 20 }]} pointerEvents="auto">
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <LiquidGlassMenuItem
                label={APP_CALENDAR.title}
                onPress={() => { handleCalendarChange(APP_CALENDAR_ID); setExpandedSettingRow(null); }}
                icon={<View style={[styles.calendarDot, { backgroundColor: APP_CALENDAR.color }]} />}
                showCheck={event.calendar === APP_CALENDAR_ID}
              />
              {deviceCalendars.map((cal) => (
                <LiquidGlassMenuItem
                  key={cal.id}
                  label={cal.title}
                  onPress={() => { handleCalendarChange(cal.id); setExpandedSettingRow(null); }}
                  icon={<View style={[styles.calendarDot, { backgroundColor: cal.color }]} />}
                  showCheck={event.calendar === cal.id}
                />
              ))}
            </ScrollView>
          </LiquidGlassCard>
        </View>
      </Modal>

      {/* Alert LiquidGlass Menu */}
      <Modal
        transparent
        visible={expandedSettingRow === 'alert'}
        animationType="fade"
        onRequestClose={() => setExpandedSettingRow(null)}
      >
        <TouchableWithoutFeedback onPress={() => setExpandedSettingRow(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.menuAnimatedWrapper, { top: menuPosition.top, right: 20 }]} pointerEvents="auto">
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {ALERT_OPTIONS.map((option) => (
                <LiquidGlassMenuItem
                  key={option.value}
                  label={option.label}
                  onPress={() => { handleAlertChange(option.value); setExpandedSettingRow(null); }}
                  icon={event.alertMinutes === option.value ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 20 }} />}
                />
              ))}
            </ScrollView>
          </LiquidGlassCard>
        </View>
      </Modal>

      {/* Second Alert LiquidGlass Menu */}
      <Modal
        transparent
        visible={expandedSettingRow === 'secondAlert'}
        animationType="fade"
        onRequestClose={() => setExpandedSettingRow(null)}
      >
        <TouchableWithoutFeedback onPress={() => setExpandedSettingRow(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.menuAnimatedWrapper, { top: menuPosition.top, right: 20 }]} pointerEvents="auto">
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {ALERT_OPTIONS.map((option) => (
                <LiquidGlassMenuItem
                  key={option.value}
                  label={option.label}
                  onPress={() => { handleSecondAlertChange(option.value); setExpandedSettingRow(null); }}
                  icon={event.secondAlertMinutes === option.value ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 20 }} />}
                />
              ))}
            </ScrollView>
          </LiquidGlassCard>
        </View>
      </Modal>

      {/* Repeat LiquidGlass Menu */}
      <Modal
        transparent
        visible={expandedSettingRow === 'repeat'}
        animationType="fade"
        onRequestClose={() => setExpandedSettingRow(null)}
      >
        <TouchableWithoutFeedback onPress={() => setExpandedSettingRow(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.menuAnimatedWrapper, { top: menuPosition.top, right: 20 }]} pointerEvents="auto">
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {REPEAT_OPTIONS.map((option, index) => {
                const isSelected = event.repeat === option.value || (option.value === 'custom' && (event.repeat?.startsWith('custom_') ?? false));
                return (
                  <React.Fragment key={option.value}>
                    <LiquidGlassMenuItem
                      label={option.label}
                      onPress={async () => {
                        if (option.value === 'custom') {
                          if (event.repeat?.startsWith('custom_')) {
                            const parts = event.repeat.split('_');
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
                            setCustomRepeatDays([new Date(event.date).getDay()]);
                          }
                          setExpandedSettingRow(null);
                          setShowCustomRepeatModal(true);
                        } else {
                          const updatedEvent = { ...event, repeat: option.value };
                          setEvent(updatedEvent);
                          await saveEventChanges(updatedEvent);
                          setExpandedSettingRow(null);
                        }
                      }}
                      icon={isSelected ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 22 }} />}
                    />
                    {(index === 0 || index === REPEAT_OPTIONS.length - 2) && (
                      <View style={[styles.unifiedSettingSeparator, { marginHorizontal: 16, marginVertical: 4 }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </LiquidGlassCard>
        </View>
      </Modal>

      <Modal
        transparent
        visible={expandedSettingRow === 'endRepeatMenu'}
        animationType="fade"
        onRequestClose={() => setExpandedSettingRow(null)}
      >
        <TouchableWithoutFeedback onPress={() => setExpandedSettingRow(null)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.menuAnimatedWrapper, { top: menuPosition.top, right: 20 }]} pointerEvents="auto">
          <LiquidGlassCard borderRadius={28} width={280}>
            <View style={{ padding: 8 }}>
              <LiquidGlassMenuItem
                label="Never"
                onPress={() => {
                  setEndRepeatDate('never');
                  setExpandedSettingRow(null);
                }}
                icon={endRepeatDate === 'never' ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 22 }} />}
              />
              <View style={[styles.unifiedSettingSeparator, { marginHorizontal: 16, marginVertical: 4 }]} />
              <LiquidGlassMenuItem
                label="On Date"
                onPress={() => {
                  if (endRepeatDate === 'never') {
                    setEndRepeatDate(new Date());
                  }
                  setExpandedSettingRow(null); // Close menu to reveal End Date row
                }}
                icon={endRepeatDate !== 'never' ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 22 }} />}
              />
            </View>
          </LiquidGlassCard>
        </View>
      </Modal>


      {/* Menu Modal */}
      <Modal
        transparent
        visible={showMenu}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.menuAnimatedWrapper,
            {
              top: menuPosition.top,
              right: menuPosition.right,
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="numeric" size={20} color="#FFF" />}
              label="Set All Sets (1-9)"
              onPress={handleSetAllSets}
            />
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="repeat" size={20} color="#FFF" />}
              label="Set All Reps (1-9)"
              onPress={handleSetAllReps}
            />
          </LiquidGlassCard>
        </View>
      </Modal>

      {/* Custom Repeat Modal */}
      <Modal
        visible={showCustomRepeatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={async () => {
          let repeatValue = `custom_${customFrequency}_${customInterval}`;
          if (customFrequency === 'weekly') repeatValue += `_${customRepeatDays.join(',')}`;
          else if (customFrequency === 'monthly') repeatValue += `_${customRepeatMonthlyDays.join(',')}`;
          else if (customFrequency === 'yearly') repeatValue += `_${customRepeatYearlyMonths.join(',')}`;

          const updatedEvent = { ...event!, repeat: repeatValue };
          setEvent(updatedEvent);
          await saveEventChanges(updatedEvent);
          setShowCustomRepeatModal(false);
        }}
      >
        <View style={styles.customRepeatModal}>
          {/* Header */}
          <View style={styles.customRepeatHeader}>
            <TouchableOpacity
              onPress={async () => {
                let repeatValue = `custom_${customFrequency}_${customInterval}`;
                if (customFrequency === 'weekly') repeatValue += `_${customRepeatDays.join(',')}`;
                else if (customFrequency === 'monthly') repeatValue += `_${customRepeatMonthlyDays.join(',')}`;
                else if (customFrequency === 'yearly') repeatValue += `_${customRepeatYearlyMonths.join(',')}`;

                const updatedEvent = { ...event!, repeat: repeatValue };
                setEvent(updatedEvent);
                await saveEventChanges(updatedEvent);
                setShowCustomRepeatModal(false);
              }}
              style={{ padding: 4 }}
            >
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.customRepeatTitle}>Custom</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Settings Container */}
          <View style={styles.customRepeatContainer}>
            {/* Frequency Row */}
            <TouchableOpacity
              style={styles.customRepeatRow}
              onPress={() => {
                setShowFrequencyDropdown(!showFrequencyDropdown);
              }}
            >
              <Text style={styles.customRepeatLabel}>Frequency</Text>
              <View style={styles.customRepeatValueRow}>
                <Text style={[styles.customRepeatValue, { color: '#8E8E93' }]}>
                  {CUSTOM_FREQUENCIES.find(f => f.value === customFrequency)?.label || 'Daily'}
                </Text>
                <Text style={{ color: '#8E8E93', fontSize: 12, marginLeft: 4 }}>◇</Text>
              </View>
            </TouchableOpacity>

            {showFrequencyDropdown && (
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
                  <LiquidGlassCard borderRadius={20} width={280}>
                    {CUSTOM_FREQUENCIES.map(freq => (
                      <LiquidGlassMenuItem
                        key={freq.value}
                        label={freq.label}
                        onPress={() => {
                          setCustomFrequency(freq.value);
                          setShowFrequencyDropdown(false);
                        }}
                        icon={customFrequency === freq.value ? <Feather name="check" size={18} color="#FFF" /> : <View style={{ width: 20 }} />}
                      />
                    ))}
                  </LiquidGlassCard>
                </View>
              </Modal>
            )}

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

            <View style={styles.unifiedSettingSeparator} />

            {/* Every Row */}
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

          {/* Description */}
          <Text style={styles.customRepeatDescription}>
            Event will occur every {customInterval} {CUSTOM_FREQUENCIES.find(f => f.value === customFrequency)?.unit}{customInterval > 1 ? 's' : ''}.
          </Text>

          {/* Frequency Specific Selectors */}
          <ScrollView style={{ flex: 1 }}>
            {customFrequency === 'weekly' && renderWeeklySelector()}
            {customFrequency === 'monthly' && renderMonthlySelector()}
            {customFrequency === 'yearly' && renderYearlySelector()}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  circularIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 4,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 9,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  eventTitleInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
    padding: 0,
  },
  dateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  // Timeline Styles
  timelineContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    width: 50,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: -6,
  },
  hourSeparator: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#3A3A3C',
  },
  eventBlock: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  eventBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  eventBlockTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Unified Settings
  unifiedSettingsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  menuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 2000,
  },
  // Alert Picker Styles
  alertPickerContainer: {
    width: '80%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  alertPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  alertPickerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  alertPickerDone: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  alertPickerList: {
    maxHeight: 300,
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  alertOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginVertical: 10,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 5,
    top: 100,
    bottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  alphabetLetter: {
    color: '#007AFF',
    fontSize: 10,
    marginVertical: 1,
  },

  alertOptionText: {
    color: '#FFF',
    fontSize: 17,
  },
  alertOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
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
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inlinePickerContainer: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  inlinePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  inlinePickerOptionSelected: {
    backgroundColor: 'rgba(157, 236, 44, 0.1)',
  },
  inlinePickerOptionText: {
    color: '#FFF',
    fontSize: 16,
  },
  inlinePickerOptionTextSelected: {
    color: '#9DEC2C',
    fontWeight: '600',
  },
  // Workout Section Style Update
  workoutSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workoutSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  workoutsList: {
    marginTop: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242426',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 50,
    marginBottom: 10,
  },
  workoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
    flex: 1,
    marginRight: 8,
  },
  workoutValue: {
    color: '#9DEC2C',
    fontSize: 22,
    fontWeight: '500',
  },
  workoutUnit: {
    color: '#9DEC2C',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  workoutSeparator: {
    color: '#9DEC2C',
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  workoutStatusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  workoutStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Edit Mode Specifics
  editSettingsBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  horizontalSelector: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  dateTimePillActive: {
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  dateTimePillText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  timeRows: {
    paddingVertical: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '500',
  },
  bottomLargeButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomLargeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9DEC2C',
  },

  // Modal Styles (for Add Workout)
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  circularCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
  },
  modalWorkoutList: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalSectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalWorkoutItemSelected: {
    backgroundColor: '#2C2C2E',
  },
  modalWorkoutIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalWorkoutInfo: {
    flex: 1,
  },
  modalWorkoutName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalWorkoutDetail: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  modalAddButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#9DEC2C',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  modalAddButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Custom Repeat Modal
  customRepeatModal: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  customRepeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  customRepeatTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  customRepeatContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  customRepeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  customRepeatLabel: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '400',
  },
  customRepeatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customRepeatValue: {
    fontSize: 17,
    color: '#8E8E93',
  },
  customRepeatDropdown: {
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
  },
  customRepeatDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  customRepeatDropdownOptionSelected: {
    backgroundColor: 'rgba(157, 236, 44, 0.1)',
  },
  customRepeatDropdownText: {
    color: '#FFF',
    fontSize: 16,
  },
  customRepeatDescription: {
    color: '#8E8E93',
    fontSize: 13,
    marginHorizontal: 32,
    marginTop: 12,
  },
  // Advanced Custom Repeat Styles
  subSelectorContainer: {
    marginTop: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    paddingHorizontal: 0, // Reset to allow internal grid alignment
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
  repeatDescriptionRowInteractive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatDescriptionTextInteractive: {
    color: '#8E8E93',
    fontSize: 14,
    flex: 1,
  },
  calendarPickerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthNavText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    width: (SCREEN_WIDTH - 50.1) / 7,
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
    width: (SCREEN_WIDTH - 50.1) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayNumber: {
    backgroundColor: '#9DEC2C',
  },
  todayDayNumber: {
    backgroundColor: 'rgba(157, 236, 44, 0.2)',
  },
  weekendDayText: {
    color: '#8E8E93',
  },
  selectedDayText: {
    color: '#000',
    fontWeight: '700',
  },
  neverOptionContainer: {
    paddingHorizontal: 16,
  },
  neverOptionButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  neverOptionButtonActive: {
    backgroundColor: 'rgba(157, 236, 44, 0.1)',
  },
  neverOptionText: {
    color: '#FFF',
    fontSize: 16,
  },
  neverOptionTextActive: {
    color: '#9DEC2C',
    fontWeight: '600',
  },
});
