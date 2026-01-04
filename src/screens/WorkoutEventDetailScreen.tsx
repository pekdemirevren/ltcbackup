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

export default function WorkoutEventDetailScreen({ navigation, route }: WorkoutEventDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  const { eventId, date } = route.params;

  const [event, setEvent] = useState<WorkoutEvent | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [showSecondAlertPicker, setShowSecondAlertPicker] = useState(false);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const buttonRef = useRef<View>(null);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadEvent();
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

  const handleAlertChange = (minutes: number) => {
    if (event) {
      const updatedEvent = { ...event, alertMinutes: minutes };
      saveEvent(updatedEvent);
    }
    setShowAlertPicker(false);
  };

  const handleSecondAlertChange = (minutes: number) => {
    if (event) {
      const updatedEvent = { ...event, secondAlertMinutes: minutes };
      saveEvent(updatedEvent);
    }
    setShowSecondAlertPicker(false);
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

  // Generate time slots for the timeline
  const startHour = parseInt(event.startTime.split(':')[0]);
  const timeSlots = [startHour - 1, startHour, startHour + 1].map(h => 
    `${String(h).padStart(2, '0')}:00`
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
          <Text style={styles.backButtonText}>{formatHeaderDate(event.date)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        {/* Date & Time */}
        <Text style={styles.dateText}>{formatDate(event.date)}</Text>
        <Text style={styles.timeText}>{event.startTime} – {event.endTime}</Text>
        
        {/* Timeline Block */}
        <View style={styles.timelineContainer}>
          {timeSlots.map((time, index) => {
            const hour = parseInt(time.split(':')[0]);
            const isEventSlot = hour === startHour;
            
            return (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeLabel}>{time}</Text>
                <View style={styles.timeSlotContent}>
                  {isEventSlot && (
                    <View style={[styles.eventBlock, { backgroundColor: eventColor }]}>
                      <Text style={styles.eventBlockTitle}>{event.title}</Text>
                      <View style={styles.eventBlockTimeRow}>
                        <Feather name="clock" size={12} color="#FFF" />
                        <Text style={styles.eventBlockTime}>{event.startTime} – {event.endTime}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Calendar Row */}
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Calendar</Text>
          <View style={styles.settingValueRow}>
            <View style={[styles.calendarDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.settingValue}>{event.calendar || 'pekdemirevren@gmail.com'}</Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  editButtonText: {
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
    padding: 16,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 44,
  },
  timeLabel: {
    width: 50,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timeSlotContent: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#3A3A3C',
    paddingVertical: 4,
  },
  eventBlock: {
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  eventBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  eventBlockTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  eventBlockTime: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
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
    gap: 12,
  },
  workoutCard: {
    width: (SCREEN_WIDTH - 32 - 16 - 24) / 2,
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
