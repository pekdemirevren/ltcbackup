import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';
import { WorkoutDayType, WORKOUT_DAY_COLORS, loadWorkoutDayCards, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';
import { Picker } from '@react-native-picker/picker';
import RNCalendarEvents from 'react-native-calendar-events';
import { allWorkouts, Workout } from '../constants/workoutData';
import { BlurView } from '@react-native-community/blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EVENTS_STORAGE_KEY = '@workout_calendar_events';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
}

interface DeviceCalendar {
  id: string;
  title: string;
  color: string;
  source?: string;
}

// Alert options with labels and minute values
const ALERT_OPTIONS = [
  { label: 'None', value: 0 },
  { label: 'At time of event', value: -1 },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '2 days before', value: 2880 },
  { label: '1 week before', value: 10080 },
];

type DailyWorkoutDetailScreenProps = StackScreenProps<RootStackParamList, 'DailyWorkoutDetail'>;

export default function DailyWorkoutDetailScreen({ navigation, route }: DailyWorkoutDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || {
    background: '#000',
    text: '#FFF',
    cardBackground: '#1C1C1E',
  };

  // Extract params - workoutDay is WorkoutDayType string
  const { workoutDay, currentDay = 1, totalDays = 7, dailyCalorieGoal = 0, eventId: routeEventId, date: routeDate } = route.params || {};
  const workoutDayType = (workoutDay as WorkoutDayType) || 'Pull';

  // States
  const [event, setEvent] = useState<WorkoutEvent | null>(null);
  const [workoutCards, setWorkoutCards] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>([]);
  const [calendarPermission, setCalendarPermission] = useState<boolean>(false);
  const [alertMinutes, setAlertMinutes] = useState<number>(0);
  const [secondAlertMinutes, setSecondAlertMinutes] = useState<number>(0);
  const [loadingCalendars, setLoadingCalendars] = useState<boolean>(false);
  const [showCalendarList, setShowCalendarList] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteMenuPosition, setDeleteMenuPosition] = useState({ top: 0, right: 20 });
  const deleteButtonRef = useRef<View>(null);
  const deleteMenuAnimation = useRef(new Animated.Value(0)).current;

  // Goal Menu States (from DailySummaryDetailScreen)
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalMenuPosition, setGoalMenuPosition] = useState({ top: 0, right: 20 });
  const goalButtonRef = useRef<View>(null);
  const goalMenuAnimation = useRef(new Animated.Value(0)).current;

  // Calendar Menu States
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [calendarMenuPosition, setCalendarMenuPosition] = useState({ top: 0, right: 20 });
  const calendarButtonRef = useRef<View>(null);
  const calendarMenuAnimation = useRef(new Animated.Value(0)).current;

  // Alert Menu States
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
  const [alertMenuPosition, setAlertMenuPosition] = useState({ top: 0, right: 20 });
  const alertButtonRef = useRef<View>(null);
  const alertMenuAnimation = useRef(new Animated.Value(0)).current;

  // Second Alert Menu States
  const [showSecondAlertMenu, setShowSecondAlertMenu] = useState(false);
  const [isSecondAlertModalVisible, setIsSecondAlertModalVisible] = useState(false);
  const [secondAlertMenuPosition, setSecondAlertMenuPosition] = useState({ top: 0, right: 20 });
  const secondAlertButtonRef = useRef<View>(null);
  const secondAlertMenuAnimation = useRef(new Animated.Value(0)).current;

  // Today's date as event date (or use route date if provided)
  const today = new Date();
  const dateString = routeDate || today.toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      loadData();
      checkCalendarPermission();
    }, [workoutDayType, dateString, routeEventId])
  );

  // Goal Menu Animation Effect
  useEffect(() => {
    if (showGoalMenu) {
      setIsGoalModalVisible(true);
      Animated.spring(goalMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(goalMenuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsGoalModalVisible(false);
      });
    }
  }, [showGoalMenu]);

  // Calendar Menu Animation Effect
  useEffect(() => {
    if (showCalendarMenu) {
      setIsCalendarModalVisible(true);
      Animated.spring(calendarMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(calendarMenuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsCalendarModalVisible(false);
      });
    }
  }, [showCalendarMenu]);

  // Alert Menu Animation Effect
  useEffect(() => {
    if (showAlertMenu) {
      setIsAlertModalVisible(true);
      Animated.spring(alertMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(alertMenuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsAlertModalVisible(false);
      });
    }
  }, [showAlertMenu]);

  // Second Alert Menu Animation Effect
  useEffect(() => {
    if (showSecondAlertMenu) {
      setIsSecondAlertModalVisible(true);
      Animated.spring(secondAlertMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(secondAlertMenuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsSecondAlertModalVisible(false);
      });
    }
  }, [showSecondAlertMenu]);

  // Delete Menu Animation Effect
  useEffect(() => {
    if (showDeleteModal) {
      setIsDeleteModalVisible(true);
      Animated.spring(deleteMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(deleteMenuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsDeleteModalVisible(false);
      });
    }
  }, [showDeleteModal]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load workout cards for this day type
      const savedIds = await loadWorkoutDayCards(workoutDayType);
      if (savedIds.length > 0) {
        const cards = savedIds
          .map(id => allWorkouts.find(w => w.workoutId === id))
          .filter((w): w is Workout => w !== undefined);
        setWorkoutCards(cards);
      } else {
        // No saved cards - show default workouts based on muscle group
        const muscleGroups = WORKOUT_DAY_MUSCLE_GROUPS[workoutDayType];
        if (muscleGroups) {
          const defaultCards = allWorkouts.filter(w => muscleGroups.includes(w.muscleGroup)).slice(0, 4);
          setWorkoutCards(defaultCards);
        } else {
          setWorkoutCards(allWorkouts.slice(0, 4));
        }
      }

      // Load existing event if any
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const events: WorkoutEvent[] = JSON.parse(stored);
        // If eventId is provided, load that specific event
        let foundEvent: WorkoutEvent | undefined;
        if (routeEventId) {
          foundEvent = events.find(e => e.id === routeEventId);
        } else {
          // Otherwise, find event by workoutDay and date
          foundEvent = events.find(e => e.workoutDay === workoutDayType && e.date.split('T')[0] === dateString);
        }
        if (foundEvent) {
          setEvent(foundEvent);
          setAlertMinutes(foundEvent.alertMinutes || 0);
          setSecondAlertMinutes(foundEvent.secondAlertMinutes || 0);
          setSelectedCalendar(foundEvent.calendar || '');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCalendarPermission = async () => {
    try {
      const status = await RNCalendarEvents.checkPermissions();
      if (status === 'authorized') {
        setCalendarPermission(true);
        loadDeviceCalendars();
      }
    } catch (error) {
      console.error('Error checking calendar permission:', error);
    }
  };

  const requestCalendarPermission = async () => {
    try {
      const status = await RNCalendarEvents.requestPermissions();
      if (status === 'authorized') {
        setCalendarPermission(true);
        loadDeviceCalendars();
      }
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
    }
  };

  const loadDeviceCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const calendars = await RNCalendarEvents.findCalendars();
      const writableCalendars = calendars
        .filter(cal => cal.allowsModifications)
        .map(cal => ({
          id: cal.id,
          title: cal.title,
          color: cal.color || '#007AFF',
          source: cal.source || 'Local',
        }));
      setDeviceCalendars(writableCalendars);

      if (writableCalendars.length > 0 && !selectedCalendar) {
        setSelectedCalendar(writableCalendars[0].id);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleCalendarSelect = (calendarId: string) => {
    setSelectedCalendar(calendarId);
    setShowCalendarList(false);
  };

  const getCalendarIcon = (source?: string): string => {
    if (!source) return 'calendar';
    const s = source.toLowerCase();
    if (s.includes('icloud')) return 'cloud';
    if (s.includes('google')) return 'mail';
    if (s.includes('outlook') || s.includes('exchange')) return 'briefcase';
    return 'calendar';
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    if (event) {
      // Navigate directly to the edit form for existing events
      navigation.navigate('CreateWorkoutEvent', {
        date: event.date,
        eventId: event.id,
        editMode: true,
        startTime: event.startTime,
        endTime: event.endTime,
        workoutDay: event.workoutDay,
        title: event.title,
      });
    } else {
      // Create new event for this date with current workoutDay
      navigation.navigate('CreateWorkoutEvent', {
        date: dateString,
        workoutDay: workoutDayType,
      });
    }
  };

  const handleDeleteThisEventOnly = async () => {
    if (!event) {
      setShowDeleteModal(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
      events = events.filter(e => e.id !== event.id);
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteAllFutureEvents = async () => {
    if (!event) return;

    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];

      const currentDate = new Date(event.date);
      // Delete this event and all future events with the same workout day
      events = events.filter(e => {
        if (e.id === event.id) return false;
        if (e.workoutDay === event.workoutDay) {
          const eventDate = new Date(e.date);
          if (eventDate >= currentDate) return false;
        }
        return true;
      });

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting events:', error);
    }
  };

  const handleDelete = () => {
    deleteButtonRef.current?.measureInWindow((x, y, width, height) => {
      setDeleteMenuPosition({ top: y - 75, right: 20 });
      setShowDeleteModal(true);
    });
  };

  // Delete Menu Animation Interpolations
  const deleteMenuScale = deleteMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const deleteMenuTranslateX = deleteMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const deleteMenuTranslateY = deleteMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const deleteMenuOpacity = deleteMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Handle workout card press - navigate to workout settings
  const handleWorkoutPress = (workout: Workout) => {
    navigation.navigate('GenericWorkoutSettingsScreen', {
      workoutId: workout.workoutId,
      workoutName: workout.name,
    });
  };

  // Goal Menu Handlers
  const handleOpenGoalMenu = () => {
    goalButtonRef.current?.measureInWindow((x, y, width, height) => {
      setGoalMenuPosition({ top: y - 90, right: 20 });
      setShowGoalMenu(true);
    });
  };

  const handleAdjustGoal = () => {
    setShowGoalMenu(false);
    navigation.navigate('AdjustMoveGoal');
  };

  const handleChangeSchedule = () => {
    setShowGoalMenu(false);
    navigation.navigate('MoveGoalSchedule');
  };

  // Goal Menu Animation Interpolations
  const goalMenuScale = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const goalButtonOpacity = goalMenuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const goalButtonScale = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const goalButtonTranslateX = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const goalMenuTranslateY = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const goalMenuTranslateX = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const goalMenuOpacity = goalMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Calendar Menu Handlers & Animations
  const handleOpenCalendarMenu = () => {
    if (!calendarPermission) {
      requestCalendarPermission();
      return;
    }
    calendarButtonRef.current?.measureInWindow((x, y, width, height) => {
      // Safe adjustment: place menu below the button
      setCalendarMenuPosition({ top: y + height + 8, right: 20 });
      setShowCalendarMenu(true);
    });
  };

  const calendarMenuScale = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const calendarButtonOpacity = calendarMenuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const calendarButtonScale = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const calendarButtonTranslateX = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const calendarMenuTranslateX = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const calendarMenuTranslateY = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const calendarMenuOpacity = calendarMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Alert Menu Handlers & Animations
  const handleOpenAlertMenu = () => {
    alertButtonRef.current?.measureInWindow((x, y, width, height) => {
      // Safe adjustment: place menu below the button
      setAlertMenuPosition({ top: y + height + 8, right: 20 });
      setShowAlertMenu(true);
    });
  };

  const alertMenuScale = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const alertButtonOpacity = alertMenuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const alertButtonScale = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const alertButtonTranslateX = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const alertMenuTranslateX = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const alertMenuTranslateY = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const alertMenuOpacity = alertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Second Alert Menu Handlers & Animations
  const handleOpenSecondAlertMenu = () => {
    secondAlertButtonRef.current?.measureInWindow((x, y, width, height) => {
      // Safe adjustment: place menu below the button
      setSecondAlertMenuPosition({ top: y + height + 8, right: 20 });
      setShowSecondAlertMenu(true);
    });
  };

  const secondAlertMenuScale = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const secondAlertButtonOpacity = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const secondAlertButtonScale = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const secondAlertButtonTranslateX = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const secondAlertMenuTranslateX = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const secondAlertMenuTranslateY = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const secondAlertMenuOpacity = secondAlertMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} ${DAYS[d.getDay()]}`;
  };

  const getAlertLabel = (minutes: number): string => {
    const option = ALERT_OPTIONS.find(opt => opt.value === minutes);
    return option?.label || 'None';
  };

  const eventColor = WORKOUT_DAY_COLORS[workoutDayType] || '#007AFF';
  const eventDate = event ? new Date(event.date) : today;

  // Timeline calculation logic - dynamic based on event duration
  const HOUR_HEIGHT = 50; // Height per hour slot
  const eventExists = !!event;

  const getMinutesFromTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startTime = eventExists ? event.startTime : '10:00';
  const endTime = eventExists ? event.endTime : '11:00';

  const eventStartTotalMinutes = getMinutesFromTime(startTime);
  const eventEndTotalMinutes = getMinutesFromTime(endTime);
  const durationMinutes = eventEndTotalMinutes > eventStartTotalMinutes
    ? eventEndTotalMinutes - eventStartTotalMinutes
    : 60;

  const startHour = Math.floor(eventStartTotalMinutes / 60);
  const endHour = Math.floor(eventEndTotalMinutes / 60);

  // Show hours from start to end + 1, ensuring at least 3 hours
  const timelineHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = startHour; h <= endHour + 1; h++) {
      if (h >= 0 && h < 24) hours.push(h);
    }
    // Ensure at least 3 hours for good visual
    while (hours.length < 3 && hours[hours.length - 1] < 23) {
      hours.push(hours[hours.length - 1] + 1);
    }
    return hours;
  }, [startHour, endHour]);

  const firstHourInTimeline = timelineHours.length > 0 ? timelineHours[0] : startHour;

  // Calculate minutes from the start of timeline to event start
  const eventStartOffsetMinutes = eventStartTotalMinutes - firstHourInTimeline * 60;

  const eventTopPosition = (eventStartOffsetMinutes / 60) * HOUR_HEIGHT;
  // Event height scales with duration (minimum 30px for very short events)
  const calculatedHeight = (durationMinutes / 60) * HOUR_HEIGHT;
  const eventHeight = Math.max(30, calculatedHeight);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color="#FFF" />
          <Text style={styles.backButtonText}>
            {MONTHS_SHORT[eventDate.getMonth()]} {eventDate.getDate()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEdit}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <Feather name="edit-2" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>
          {event?.title || `${workoutDayType} Workout`}
        </Text>

        {/* Date and Time */}
        <Text style={styles.eventDateTime}>{formatDate(event?.date || dateString)}</Text>
        <Text style={styles.eventTime}>
          {event ? `${event.startTime} – ${event.endTime}` : '10:00 – 11:00'}
        </Text>

        {/* Repeat Indicator */}
        {event?.repeat && event.repeat !== 'none' && (
          <Text style={styles.repeatText}>
            Repeats {event.repeat}
          </Text>
        )}

        {/* Mini Timeline */}
        <View style={styles.timelineWrapper}>
          {/* Background lines and hour labels */}
          {timelineHours.map((hour) => (
            <View key={hour} style={[styles.timelineRow, { height: HOUR_HEIGHT }]}>
              <Text style={styles.timelineHourText}>
                {String(hour).padStart(2, '0')}:00
              </Text>
              <View style={styles.timelineSeparator} />
            </View>
          ))}

          {/* Event */}
          {eventHeight > 0 && (
            <View
              style={[
                styles.timelineEvent,
                {
                  backgroundColor: eventColor,
                  top: eventTopPosition + 24 + (HOUR_HEIGHT / 2), // paddingTop + center offset
                  height: eventHeight,
                },
              ]}>
              <Text style={styles.timelineEventTitle} numberOfLines={1}>
                {event?.title || `${workoutDayType} Workout`}
              </Text>
              <View style={styles.timelineEventTimeRow}>
                <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timelineEventTime}>
                  {startTime} – {endTime}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Calendar, Alert, Second Alert - Goal Button Style */}
        <View style={styles.settingsButtonsContainer}>
          {/* Calendar Button */}
          <View style={styles.settingButtonRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Calendar</Text>
            </View>
            <TouchableOpacity
              ref={calendarButtonRef}
              style={styles.settingValueRow}
              onPress={handleOpenCalendarMenu}
              disabled={showCalendarMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.settingValue}>
                {!calendarPermission
                  ? 'Tap to grant access'
                  : deviceCalendars.find(c => c.id === selectedCalendar)?.title || workoutDayType
                }
              </Text>
              <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingSeparator} />

          {/* Alert Button */}
          <View style={styles.settingButtonRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Alert</Text>
            </View>
            <TouchableOpacity
              ref={alertButtonRef}
              style={styles.settingValueRow}
              onPress={handleOpenAlertMenu}
              disabled={showAlertMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.settingValue}>{getAlertLabel(alertMinutes)}</Text>
              <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingSeparator} />

          {/* Second Alert Button */}
          <View style={styles.settingButtonRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Second Alert</Text>
            </View>
            <TouchableOpacity
              ref={secondAlertButtonRef}
              style={styles.settingValueRow}
              onPress={handleOpenSecondAlertMenu}
              disabled={showSecondAlertMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.settingValue}>{getAlertLabel(secondAlertMinutes)}</Text>
              <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Workout Cards */}
        {workoutCards.length > 0 && (
          <View style={styles.workoutsSection}>
            <Text style={styles.sectionTitle}>Workouts</Text>
            <View style={styles.workoutGrid}>
              {workoutCards.slice(0, 4).map((workout) => {
                const SvgIcon = workout.SvgIcon;
                return (
                  <TouchableOpacity
                    key={workout.workoutId}
                    style={styles.workoutCard}
                    onPress={() => handleWorkoutPress(workout)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cardIconContainer, { backgroundColor: eventColor + '30' }]}>
                      {SvgIcon && <SvgIcon width={40} height={40} fill={eventColor} />}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {workout.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Goal Button - Same as DailySummaryDetailScreen */}
            <View style={styles.goalButtonContainer}>
              <Animated.View style={{ opacity: goalButtonOpacity, transform: [{ scale: goalButtonScale }, { translateX: goalButtonTranslateX }] }}>
                <TouchableOpacity
                  ref={goalButtonRef}
                  style={styles.goalButton}
                  onPress={handleOpenGoalMenu}
                  disabled={showGoalMenu}
                >
                  <View style={[styles.goalButtonInner, { borderColor: eventColor }]}>
                    <Text style={[styles.goalButtonText, { color: eventColor }]}>- +</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            ref={deleteButtonRef}
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="thinMaterialDark"
              blurAmount={20}
            />
            <Text style={styles.deleteButtonText}>Delete Workout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={isDeleteModalVisible}
        animationType="none"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={styles.goalMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.goalMenuAnimatedWrapper,
            {
              top: deleteMenuPosition.top,
              right: deleteMenuPosition.right,
              opacity: deleteMenuOpacity,
              transform: [
                { translateX: deleteMenuTranslateX },
                { translateY: deleteMenuTranslateY },
                { scale: deleteMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={280}>
            <LiquidGlassMenuItem
              label="Delete This Event Only"
              textColor="#FF3B30"
              textAlign="center"
              onPress={handleDeleteThisEventOnly}
            />
            {event?.repeat && event.repeat !== 'never' && (
              <LiquidGlassMenuItem
                label="Delete All Future Events"
                textColor="#FF3B30"
                textAlign="center"
                onPress={handleDeleteAllFutureEvents}
              />
            )}
            <LiquidGlassMenuItem
              label="Cancel"
              textAlign="center"
              onPress={() => setShowDeleteModal(false)}
            />
          </LiquidGlassCard>
        </Animated.View>
      </Modal>

      {/* Goal Menu Modal */}
      <Modal
        transparent
        visible={isGoalModalVisible}
        animationType="none"
        onRequestClose={() => setShowGoalMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGoalMenu(false)}>
          <View style={styles.goalMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.goalMenuAnimatedWrapper,
            {
              top: goalMenuPosition.top,
              right: goalMenuPosition.right,
              opacity: goalMenuOpacity,
              transform: [
                { translateX: goalMenuTranslateX },
                { translateY: goalMenuTranslateY },
                { scale: goalMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="circle-slice-8" size={20} color="#FFF" />}
              label="Adjust Goal for Today"
              onPress={handleAdjustGoal}
            />
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="calendar-month" size={20} color="#FFF" />}
              label="Change Schedule"
              onPress={handleChangeSchedule}
            />
          </LiquidGlassCard>
        </Animated.View>
      </Modal>

      {/* Calendar Menu Modal */}
      <Modal
        transparent
        visible={isCalendarModalVisible}
        animationType="none"
        onRequestClose={() => setShowCalendarMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCalendarMenu(false)}>
          <View style={styles.goalMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.goalMenuAnimatedWrapper,
            {
              top: calendarMenuPosition.top,
              right: calendarMenuPosition.right,
              opacity: calendarMenuOpacity,
              transform: [
                { translateX: calendarMenuTranslateX },
                { translateY: calendarMenuTranslateY },
                { scale: calendarMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={280}>
            {loadingCalendars ? (
              <LiquidGlassMenuItem
                label="Loading calendars..."
                onPress={() => { }}
              />
            ) : deviceCalendars.length === 0 ? (
              <LiquidGlassMenuItem
                label="No calendars found"
                onPress={() => setShowCalendarMenu(false)}
              />
            ) : (
              deviceCalendars.map((calendar) => (
                <LiquidGlassMenuItem
                  key={calendar.id}
                  icon={
                    <View style={[styles.calendarMenuDot, { backgroundColor: calendar.color }]} />
                  }
                  label={calendar.title}
                  onPress={() => {
                    handleCalendarSelect(calendar.id);
                    setShowCalendarMenu(false);
                  }}
                />
              ))
            )}
          </LiquidGlassCard>
        </Animated.View>
      </Modal>

      {/* Alert Menu Modal */}
      <Modal
        transparent
        visible={isAlertModalVisible}
        animationType="none"
        onRequestClose={() => setShowAlertMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAlertMenu(false)}>
          <View style={styles.goalMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.goalMenuAnimatedWrapper,
            {
              top: alertMenuPosition.top,
              right: alertMenuPosition.right,
              opacity: alertMenuOpacity,
              transform: [
                { translateX: alertMenuTranslateX },
                { translateY: alertMenuTranslateY },
                { scale: alertMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {ALERT_OPTIONS.map((opt) => (
                <LiquidGlassMenuItem
                  key={opt.value}
                  icon={
                    alertMinutes === opt.value
                      ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" />
                      : undefined
                  }
                  label={opt.label}
                  onPress={() => {
                    setAlertMinutes(opt.value);
                    setShowAlertMenu(false);
                  }}
                />
              ))}
            </ScrollView>
          </LiquidGlassCard>
        </Animated.View>
      </Modal>

      {/* Second Alert Menu Modal */}
      <Modal
        transparent
        visible={isSecondAlertModalVisible}
        animationType="none"
        onRequestClose={() => setShowSecondAlertMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSecondAlertMenu(false)}>
          <View style={styles.goalMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.goalMenuAnimatedWrapper,
            {
              top: secondAlertMenuPosition.top,
              right: secondAlertMenuPosition.right,
              opacity: secondAlertMenuOpacity,
              transform: [
                { translateX: secondAlertMenuTranslateX },
                { translateY: secondAlertMenuTranslateY },
                { scale: secondAlertMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {ALERT_OPTIONS.map((opt) => (
                <LiquidGlassMenuItem
                  key={opt.value}
                  icon={
                    secondAlertMinutes === opt.value
                      ? <MaterialCommunityIcons name="check" size={20} color="#9DEC2C" />
                      : undefined
                  }
                  label={opt.label}
                  onPress={() => {
                    setSecondAlertMinutes(opt.value);
                    setShowSecondAlertMenu(false);
                  }}
                />
              ))}
            </ScrollView>
          </LiquidGlassCard>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    display: 'none',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  eventTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  eventDateTime: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  eventTime: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 24,
  },
  repeatText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 24,
  },
  timelineWrapper: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16,
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineHourText: {
    color: '#8E8E93',
    fontSize: 12,
    width: 50,
  },
  timelineSeparator: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
    marginLeft: 10,
  },
  timelineEvent: {
    position: 'absolute',
    left: 16 + 50 + 10, // wrapper paddingH + text width + separator margin
    right: 16, // wrapper paddingH
    borderRadius: 6,
    padding: 10,
    zIndex: 1,
  },
  timelineEventTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineEventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineEventTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  // Info Card Styles
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    color: '#FFF',
    fontSize: 16,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    color: '#8E8E93',
    fontSize: 16,
    marginRight: 4,
  },
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
    marginLeft: 16,
  },
  // Inline Picker Styles (CreateWorkoutEventScreen style)
  inlinePicker: {
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 180,
  },
  pickerItem: {
    color: '#FFF',
    fontSize: 18,
  },
  // Workout Cards
  workoutsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  // Calendar List Styles
  calendarListContainer: {
    paddingBottom: 8,
  },
  loadingCalendarsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 8,
  },
  loadingCalendarsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noCalendarsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noCalendarsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  calendarListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calendarListItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  calendarItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  calendarItemInfo: {
    flex: 1,
  },
  calendarItemTitle: {
    fontSize: 16,
    color: '#FFF',
  },
  calendarItemTitleSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarItemSource: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  // Delete Button
  deleteButtonContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    minHeight: 48,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  // Delete Confirmation Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  deleteModalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteModalButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteModalButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Cancel Button Style
  cancelModalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Goal Button & Menu Styles (from DailySummaryDetailScreen)
  goalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingRight: 4,
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  goalMenuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 100,
  },
  goalMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // Settings Button Styles (Calendar, Alert, Second Alert)
  settingsButtonsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  settingButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500',
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginRight: 12,
  },
  settingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 44,
  },
  calendarMenuDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
