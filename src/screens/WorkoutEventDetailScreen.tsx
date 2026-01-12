import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS, loadWorkoutDayCards } from '../utils/WorkoutDayManager';
import { allWorkouts, Workout } from '../constants/workoutData';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';
import MetricColors from '../constants/MetricColors';
import RNCalendarEvents, { Calendar } from 'react-native-calendar-events';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

type WorkoutEventDetailScreenProps = StackScreenProps<RootStackParamList, 'WorkoutEventDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const { eventId, date } = route.params;

  const [event, setEvent] = useState<WorkoutEvent | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [showSecondAlertPicker, setShowSecondAlertPicker] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [deviceCalendars, setDeviceCalendars] = useState<Calendar[]>([]);
  const [calendarPermission, setCalendarPermission] = useState<string>('undetermined');
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<AuthorizationStatus | null>(null);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const buttonRef = useRef<View>(null);
  const menuAnimation = useRef(new Animated.Value(0)).current;

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
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open the app settings
              if (Platform.OS === 'ios') {
                Alert.alert('Go to Settings > Privacy > Calendars and enable this app.');
              }
            }}
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
      // Prevent default behavior
      e.preventDefault();
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

  useEffect(() => {
    if (showMenu) {
      setIsModalVisible(true);
      Animated.spring(menuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(menuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [showMenu]);

  const loadEvent = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const events: WorkoutEvent[] = JSON.parse(stored);
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
          // Load workouts for this event
          if (foundEvent.workoutIds && foundEvent.workoutIds.length > 0) {
            const eventWorkouts = allWorkouts.filter((w: Workout) => 
              foundEvent.workoutIds.includes(w.workoutId)
            );
            setWorkouts(eventWorkouts);
          } else {
            // Load from workout day cards
            const dayCards = await loadWorkoutDayCards(foundEvent.workoutDay);
            const dayWorkouts = allWorkouts.filter((w: Workout) => 
              dayCards.includes(w.workoutId)
            ).slice(0, 4);
            setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : allWorkouts.slice(0, 4));
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

  const createDefaultEvent = async () => {
    const defaultEvent: WorkoutEvent = {
      id: eventId || 'default-event',
      title: 'Leg day',
      workoutDay: 'LEG DAY',
      date: date,
      startTime: '17:15',
      endTime: '18:15',
      alertMinutes: 30,
      workoutIds: [],
      calendar: 'pekdemirevren@gmail.com',
    };
    setEvent(defaultEvent);
    
    // Load workouts for this day
    const dayCards = await loadWorkoutDayCards('LEG DAY');
    const dayWorkouts = allWorkouts.filter((w: Workout) => 
      dayCards.includes(w.workoutId)
    ).slice(0, 4);
    setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : allWorkouts.slice(0, 4));
  };

  const saveEvent = async (updatedEvent: WorkoutEvent) => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = events.findIndex(e => e.id === updatedEvent.id);
      if (existingIndex >= 0) {
        events[existingIndex] = updatedEvent;
      } else {
        events.push(updatedEvent);
      }
      
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      setEvent(updatedEvent);
    } catch (error) {
      console.error('Error saving event:', error);
    }
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
        setShowAlertPicker(false);
        return;
      }
    }
    
    if (event) {
      const updatedEvent = { ...event, alertMinutes: minutes };
      saveEvent(updatedEvent);
    }
    setShowAlertPicker(false);
  };

  const handleSecondAlertChange = async (minutes: number) => {
    // Request notification permission if setting an alert (not "None")
    if (minutes >= 0) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setShowSecondAlertPicker(false);
        return;
      }
    }
    
    if (event) {
      const updatedEvent = { ...event, secondAlertMinutes: minutes };
      saveEvent(updatedEvent);
    }
    setShowSecondAlertPicker(false);
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
              { text: 'Open Settings', onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert('Go to Settings > Privacy > Calendars and enable this app.');
                }
              }}
            ]
          );
          return;
        }
      }
    }
    
    if (event) {
      const updatedEvent = { ...event, calendar: calendarValue };
      saveEvent(updatedEvent);
    }
    setShowCalendarPicker(false);
  };

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
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${month} ${day}`;
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
          onPress={navigateBackToCalendar}
        >
          <Feather name="chevron-left" size={22} color="#FFF" />
          <Text style={styles.backButtonText}>{formatHeaderDate(event.date)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.circularIconButton}
          onPress={() => navigation.navigate('CreateWorkoutEvent', { 
            date: event.date, 
            editMode: true, 
            eventId: event.id,
            startTime: event.startTime,
            endTime: event.endTime 
          })}
        >
          <Feather name="edit-2" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        {/* Date & Time */}
        <Text style={styles.dateText}>{formatDate(event.date)}</Text>
        <Text style={styles.timeText}>{event.startTime} – {event.endTime}</Text>
        
        {/* Timeline Block - iOS Calendar style with 3 time slots */}
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
          
          {/* Event Card - Absolutely positioned based on actual time */}
          <View style={[
            styles.eventBlock,
            {
              backgroundColor: eventColor,
              position: 'absolute',
              left: 66,
              right: 16,
              top: VERTICAL_PADDING + eventTop,
              height: eventHeight, // Height scales with duration
            }
          ]}>
            <Text style={styles.eventBlockTitle}>{event.title}</Text>
            <Text style={styles.eventBlockTime}>{event.startTime} – {event.endTime}</Text>
          </View>
        </View>
        
        {/* Calendar Row */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={async () => {
            setShowCalendarPicker(true);
            // Load device calendars in background
            if (deviceCalendars.length === 0) {
              await requestCalendarAccess();
            }
          }}
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
                <Text style={styles.settingValue}>
                  {event.calendar === APP_CALENDAR_ID || !event.calendar
                    ? APP_CALENDAR.title 
                    : deviceCalendars.find(c => c.id === event.calendar)?.title || APP_CALENDAR.title
                  }
                </Text>
                <Feather name="chevron-down" size={16} color="#8E8E93" />
              </>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Alert Row */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => setShowAlertPicker(true)}
        >
          <Text style={styles.settingLabel}>Alert</Text>
          <View style={styles.settingValueRow}>
            <Text style={styles.settingValue}>{getAlertLabel(event.alertMinutes)}</Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        
        {/* Second Alert Row */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => setShowSecondAlertPicker(true)}
        >
          <Text style={styles.settingLabel}>Second Alert</Text>
          <View style={styles.settingValueRow}>
            <Text style={styles.settingValue}>
              {event.secondAlertMinutes !== undefined 
                ? getAlertLabel(event.secondAlertMinutes) 
                : 'None'
              }
            </Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        
        {/* Workout Section */}
        <View style={styles.workoutSection}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutSectionTitle}>Workout</Text>
            
            {/* Floating Menu Button */}
            <Animated.View style={{ 
              opacity: buttonOpacity, 
              transform: [{ scale: buttonScale }, { translateX: buttonTranslateX }] 
            }}>
              <TouchableOpacity
                ref={buttonRef}
                style={styles.goalButton}
                onPress={handleOpenMenu}
                disabled={showMenu}
              >
                <View style={styles.goalButtonInner}>
                  <Text style={styles.goalButtonText}>- +</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Workout Cards Grid */}
          <View style={styles.workoutGrid}>
            {workouts.slice(0, 4).map((workout) => {
              const SvgIcon = workout.SvgIcon;
              return (
                <TouchableOpacity 
                  key={workout.id} 
                  style={styles.workoutCard}
                  onPress={() => navigation.navigate('GenericWorkoutSettingsScreen', {
                    workoutId: workout.workoutId,
                    workoutName: workout.name,
                  })}
                >
                  <View style={styles.workoutIconContainer}>
                    {SvgIcon && <SvgIcon width={40} height={40} fill={MetricColors.energy} />}
                  </View>
                  <Text style={styles.workoutCardTitle} numberOfLines={2}>
                    {workout.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Event</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Alert Picker Modal */}
      {showAlertPicker && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAlertPicker(false)}
        >
          <View style={styles.alertPickerContainer}>
            <View style={styles.alertPickerHeader}>
              <Text style={styles.alertPickerTitle}>Alert</Text>
              <TouchableOpacity onPress={() => setShowAlertPicker(false)}>
                <Text style={styles.alertPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertPickerList}>
              {ALERT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.alertOption,
                    event.alertMinutes === option.value && styles.alertOptionSelected
                  ]}
                  onPress={() => handleAlertChange(option.value)}
                >
                  <Text style={[
                    styles.alertOptionText,
                    event.alertMinutes === option.value && styles.alertOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {event.alertMinutes === option.value && (
                    <Feather name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Second Alert Picker Modal */}
      {showSecondAlertPicker && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSecondAlertPicker(false)}
        >
          <View style={styles.alertPickerContainer}>
            <View style={styles.alertPickerHeader}>
              <Text style={styles.alertPickerTitle}>Second Alert</Text>
              <TouchableOpacity onPress={() => setShowSecondAlertPicker(false)}>
                <Text style={styles.alertPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertPickerList}>
              {ALERT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.alertOption,
                    event.secondAlertMinutes === option.value && styles.alertOptionSelected
                  ]}
                  onPress={() => handleSecondAlertChange(option.value)}
                >
                  <Text style={[
                    styles.alertOptionText,
                    event.secondAlertMinutes === option.value && styles.alertOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {event.secondAlertMinutes === option.value && (
                    <Feather name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}

      {/* Calendar Picker Modal */}
      {showCalendarPicker && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarPicker(false)}
        >
          <View style={styles.alertPickerContainer}>
            <View style={styles.alertPickerHeader}>
              <Text style={styles.alertPickerTitle}>Calendar</Text>
              <TouchableOpacity onPress={() => setShowCalendarPicker(false)}>
                <Text style={styles.alertPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertPickerList}>
              {/* App Calendar - Always available as first option */}
              <TouchableOpacity
                key={APP_CALENDAR_ID}
                style={[
                  styles.alertOption,
                  (!event.calendar || event.calendar === APP_CALENDAR_ID) && styles.alertOptionSelected
                ]}
                onPress={() => handleCalendarChange(APP_CALENDAR_ID)}
              >
                <View style={styles.calendarOptionRow}>
                  <View style={[styles.calendarOptionDot, { backgroundColor: APP_CALENDAR.color }]} />
                  <Feather 
                    name="smartphone" 
                    size={18} 
                    color={APP_CALENDAR.color} 
                    style={{ marginRight: 10 }} 
                  />
                  <View style={styles.calendarOptionInfo}>
                    <Text style={[
                      styles.alertOptionText,
                      (!event.calendar || event.calendar === APP_CALENDAR_ID) && styles.alertOptionTextSelected
                    ]}>
                      {APP_CALENDAR.title}
                    </Text>
                    <Text style={styles.calendarSourceText}>{APP_CALENDAR.source}</Text>
                  </View>
                </View>
                {(!event.calendar || event.calendar === APP_CALENDAR_ID) && (
                  <Feather name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>

              {/* Section header for device calendars */}
              <View style={styles.calendarSectionHeader}>
                <Text style={styles.calendarSectionTitle}>Device Calendars</Text>
                {loadingCalendars && <ActivityIndicator size="small" color="#8E8E93" style={{ marginLeft: 8 }} />}
              </View>

              {/* Loading state */}
              {loadingCalendars && deviceCalendars.length === 0 && (
                <View style={styles.loadingCalendarsContainer}>
                  <Text style={styles.loadingCalendarsText}>Loading calendars...</Text>
                </View>
              )}

              {/* No calendars found */}
              {!loadingCalendars && deviceCalendars.length === 0 && (
                <View style={styles.noCalendarsContainer}>
                  <Feather name="calendar" size={32} color="#8E8E93" />
                  <Text style={styles.noCalendarsText}>No calendars found</Text>
                  <Text style={styles.noCalendarsSubtext}>No accessible calendars on your device</Text>
                </View>
              )}

              {/* Device calendars list */}
              {deviceCalendars.map((calendar) => (
                <TouchableOpacity
                  key={calendar.id}
                  style={[
                    styles.alertOption,
                    event.calendar === calendar.id && styles.alertOptionSelected
                  ]}
                  onPress={() => handleCalendarChange(calendar.id)}
                >
                  <View style={styles.calendarOptionRow}>
                    <View style={[styles.calendarOptionDot, { backgroundColor: calendar.color }]} />
                    <Feather 
                      name={getCalendarIcon(calendar.source) as any} 
                      size={18} 
                      color={calendar.color} 
                      style={{ marginRight: 10 }} 
                    />
                    <View style={styles.calendarOptionInfo}>
                      <Text style={[
                        styles.alertOptionText,
                        event.calendar === calendar.id && styles.alertOptionTextSelected
                      ]}>
                        {calendar.title}
                      </Text>
                      <Text style={styles.calendarSourceText}>{calendar.source}</Text>
                    </View>
                  </View>
                  {event.calendar === calendar.id && (
                    <Feather name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}

      {/* Menu Modal */}
      <Modal
        transparent
        visible={isModalVisible}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuAnimatedWrapper,
            {
              top: menuPosition.top,
              right: menuPosition.right,
              opacity: menuOpacity,
              transform: [
                { translateX: menuTranslateX },
                { scale: menuScale }
              ],
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
    paddingHorizontal: 16,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
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
    alignItems: 'flex-start', // Align to top so hours mark the start of each slot
  },
  hourLabel: {
    width: 50,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: -6, // Offset to align with the separator line
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
  // Setting Rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 17,
    color: '#FFF',
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 17,
    color: '#8E8E93',
  },
  calendarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calendarOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  calendarOptionInfo: {
    flex: 1,
  },
  calendarSourceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  noCalendarsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noCalendarsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  noCalendarsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  calendarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    marginTop: 8,
  },
  calendarSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingCalendarsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingCalendarsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  loadCalendarsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  loadCalendarsText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Workout Section
  workoutSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  workoutSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  workoutCard: {
    width: '48%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  workoutIconContainer: {
    marginBottom: 12,
  },
  workoutCardTitle: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  // Goal Button (from DailySummaryDetailScreen)
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: MetricColors.energy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    color: MetricColors.energy,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Delete Button
  deleteButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '500',
  },
  // Alert Picker Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  alertPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 400,
  },
  alertPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  alertPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  alertPickerDone: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  alertPickerList: {
    paddingBottom: 34,
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  alertOptionSelected: {
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  alertOptionText: {
    fontSize: 16,
    color: '#FFF',
  },
  alertOptionTextSelected: {
    color: '#007AFF',
  },
  // Menu Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 100,
  },
});
