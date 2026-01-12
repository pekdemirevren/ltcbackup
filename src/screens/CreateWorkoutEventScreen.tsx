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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS } from '../utils/WorkoutDayManager';

type CreateWorkoutEventScreenProps = StackScreenProps<RootStackParamList, 'CreateWorkoutEvent'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

const WORKOUT_DAYS: WorkoutDayType[] = [
  'LEG DAY',
  'CHEST DAY',
  'SHOULDER DAY',
  'BACK DAY',
  'ABS DAY',
  'BICEPS-TRICEPS DAY',
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REPEAT_OPTIONS = [
  { label: 'Never', value: 'never' },
  { label: 'Every Day', value: 'daily' },
  { label: 'Every Week', value: 'weekly' },
  { label: 'Every 2 Weeks', value: 'biweekly' },
  { label: 'Every Month', value: 'monthly' },
  { label: 'Every Year', value: 'yearly' },
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
  const editMode = route.params?.editMode || false;
  const editEventId = route.params?.eventId;
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
  const [repeat, setRepeat] = useState('never');
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDayType>(routeWorkoutDay || 'LEG DAY');
  const [isLoading, setIsLoading] = useState(editMode);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load event data if in edit mode
  useEffect(() => {
    console.log('CreateWorkoutEventScreen - editMode:', editMode, 'editEventId:', editEventId);
    if (editMode && editEventId) {
      loadEventData();
    }
  }, [editMode, editEventId]);

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
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Picker visibility states
  const [activePickerField, setActivePickerField] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | 'repeat' | 'workout' | null>(null);

  // Animated heights for pickers
  const dateTimePickerHeight = useRef(new Animated.Value(0)).current;
  const workoutPickerHeight = useRef(new Animated.Value(0)).current;

  // Calendar picker state
  const [pickerMonth, setPickerMonth] = useState(initialDate);

  const formatTime = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDateShort = (date: Date): string => {
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
    const endRepeatDate = new Date(baseDate);
    endRepeatDate.setFullYear(endRepeatDate.getFullYear() + 1); // Repeat for 1 year

    let currentDate = new Date(baseDate);
    let counter = 1;

    while (currentDate < endRepeatDate && counter < 365) {
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

      if (currentDate >= endRepeatDate) break;

      const repeatedEvent: WorkoutEvent = {
        ...baseEvent,
        id: `event_${Date.now()}_${counter}`,
        date: new Date(currentDate).toISOString(),
      };
      events.push(repeatedEvent);
      counter++;
    }

    return events;
  };

  const handleAdd = async () => {
    try {
      const newEvent: WorkoutEvent = {
        id: editMode && editEventId ? editEventId : `event_${Date.now()}`,
        title: title || selectedWorkoutDay.toLowerCase().replace(' day', '') + ' day',
        workoutDay: selectedWorkoutDay,
        date: startDate.toISOString(),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        alertMinutes: 30,
        workoutIds: [],
        repeat: repeat,
      };

      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];

      if (editMode && editEventId) {
        // Update existing event
        events = events.map(e => e.id === editEventId ? newEvent : e);
      } else {
        // Generate repeated events for new event
        const allEvents = generateRepeatedEvents(newEvent, repeat);
        events = [...events, ...allEvents];
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

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
  const toggleDateTimePicker = (field: 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'repeat' | null) => {
    // Close workout picker if open
    if (activePickerField === 'workout') {
      Animated.timing(workoutPickerHeight, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }

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
      const height = field === 'startDate' || field === 'endDate' ? 320 : field === 'repeat' ? 220 : 220;
      Animated.timing(dateTimePickerHeight, {
        toValue: height,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  const toggleWorkoutPicker = () => {
    const isOpen = activePickerField === 'workout';

    // Close datetime picker if open
    if (activePickerField && activePickerField !== 'workout') {
      Animated.timing(dateTimePickerHeight, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }

    if (isOpen) {
      setActivePickerField(null);
      Animated.timing(workoutPickerHeight, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    } else {
      setActivePickerField('workout');
      Animated.timing(workoutPickerHeight, {
        toValue: 220,
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

  const handleDateSelect = (day: Date, isStart: boolean) => {
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

  const calendarDays = useMemo(() => getDaysInMonth(pickerMonth), [pickerMonth]);

  const renderCalendarPicker = (isStart: boolean) => {
    const targetDate = isStart ? startDate : endDate;

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
                onPress={() => handleDateSelect(day, isStart)}
              >
                <View style={[
                  styles.dayNumber,
                  selected && styles.selectedDayNumber,
                  isToday(day) && !selected && styles.todayDayNumber,
                ]}>
                  <Text style={[
                    styles.dayText,
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

  const renderTimePicker = (isStart: boolean) => {
    const targetDate = isStart ? startDate : endDate;
    const setTargetDate = isStart ? setStartDate : setEndDate;

    return (
      <View style={styles.timePickerContainer}>
        <Picker
          selectedValue={String(targetDate.getHours()).padStart(2, '0')}
          onValueChange={(value) => {
            const newDate = new Date(targetDate);
            newDate.setHours(parseInt(value));
            setTargetDate(newDate);
          }}
          itemStyle={styles.pickerItem}
          style={{ flex: 1, height: 200 }}
        >
          {hours.map((hour) => (
            <Picker.Item key={hour} label={hour} value={hour} />
          ))}
        </Picker>
        <Text style={styles.timeSeparator}>:</Text>
        <Picker
          selectedValue={String(Math.floor(targetDate.getMinutes() / 5) * 5).padStart(2, '0')}
          onValueChange={(value) => {
            const newDate = new Date(targetDate);
            newDate.setMinutes(parseInt(value));
            setTargetDate(newDate);
          }}
          itemStyle={styles.pickerItem}
          style={{ flex: 1, height: 200 }}
        >
          {minutes.map((minute) => (
            <Picker.Item key={minute} label={minute} value={minute} />
          ))}
        </Picker>
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
          {/* Main Attributes Card (Title + Workout Type) */}
          <View style={[styles.inputCard, activePickerField === 'workout' && styles.cardExpanded]}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="#8E8E93"
              value={title}
              onChangeText={setTitle}
              autoFocus={true}
            />
            <View style={styles.separator} />
            <TouchableOpacity
              onPress={toggleWorkoutPicker}
              activeOpacity={0.8}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Workout Type</Text>
                <View style={styles.rowValueContainer}>
                  <Text style={styles.rowValue}>{selectedWorkoutDay}</Text>
                  <Feather name="chevron-right" size={18} color="#8E8E93" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Workout Picker */}
          <Animated.View style={[styles.pickerWrapper, { height: workoutPickerHeight }]}>
            <Picker
              selectedValue={selectedWorkoutDay}
              onValueChange={(value) => setSelectedWorkoutDay(value as WorkoutDayType)}
              itemStyle={styles.pickerItem}
              style={{ height: 200 }}
            >
              {WORKOUT_DAYS.map((day) => (
                <Picker.Item key={day} label={day} value={day} />
              ))}
            </Picker>
          </Animated.View>

          {/* Date/Time Container */}
          <View style={styles.dateTimeCard}>
            {/* Starts Row */}
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>Starts</Text>
              <View style={styles.dateTimeValues}>
                <TouchableOpacity
                  style={[styles.datePill, activePickerField === 'startDate' && styles.pillActive]}
                  onPress={() => toggleDateTimePicker('startDate')}
                >
                  <Text style={[styles.datePillText, activePickerField === 'startDate' && styles.pillTextActive]}>
                    {formatDateShort(startDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timePill, activePickerField === 'startTime' && styles.timePillActive]}
                  onPress={() => toggleDateTimePicker('startTime')}
                >
                  <Text style={[styles.timePillText, activePickerField === 'startTime' && styles.pillTextActive]}>
                    {formatTime(startDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Date/Time Picker */}
            {(activePickerField === 'startDate' || activePickerField === 'startTime') && (
              <Animated.View style={[styles.inlinePicker, { height: dateTimePickerHeight }]}>
                {activePickerField === 'startDate' ? renderCalendarPicker(true) : renderTimePicker(true)}
              </Animated.View>
            )}

            <View style={styles.separator} />

            {/* Ends Row */}
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeLabel}>Ends</Text>
              <View style={styles.dateTimeValues}>
                <TouchableOpacity
                  style={[styles.datePill, activePickerField === 'endDate' && styles.pillActive]}
                  onPress={() => toggleDateTimePicker('endDate')}
                >
                  <Text style={[styles.datePillText, activePickerField === 'endDate' && styles.pillTextActive]}>
                    {formatDateShort(endDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timePill, activePickerField === 'endTime' && styles.timePillActive]}
                  onPress={() => toggleDateTimePicker('endTime')}
                >
                  <Text style={[styles.timePillText, activePickerField === 'endTime' && styles.pillTextActive]}>
                    {formatTime(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* End Date/Time Picker */}
            {(activePickerField === 'endDate' || activePickerField === 'endTime') && (
              <Animated.View style={[styles.inlinePicker, { height: dateTimePickerHeight }]}>
                {activePickerField === 'endDate' ? renderCalendarPicker(false) : renderTimePicker(false)}
              </Animated.View>
            )}

            <View style={styles.separator} />

            {/* Repeat Row */}
            <TouchableOpacity
              style={[styles.dateTimeRow, { marginTop: 8 }]}
              onPress={() => toggleDateTimePicker('repeat')}
            >
              <Text style={styles.dateTimeLabel}>Repeat</Text>
              <View style={styles.rowValueContainer}>
                <Text style={[styles.rowValue, activePickerField === 'repeat' && styles.activeRowValue]}>
                  {REPEAT_OPTIONS.find(o => o.value === repeat)?.label || 'Never'}
                </Text>
                <Feather name="chevron-right" size={18} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {/* Repeat Picker */}
            {activePickerField === 'repeat' && (
              <Animated.View style={[styles.inlinePicker, { height: dateTimePickerHeight }]}>
                <Picker
                  selectedValue={repeat}
                  onValueChange={(value) => setRepeat(value)}
                  itemStyle={styles.pickerItem}
                  style={{ height: 200 }}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </Animated.View>
            )}
          </View>

          {/* Delete Button - only in edit mode */}
          {editMode && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.9}>
              <Feather name="trash-2" size={18} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete Workout</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Add/Update Event Button */}
        <TouchableOpacity onPress={handleAdd} style={styles.addEventButton} activeOpacity={0.9}>
          <Text style={styles.addEventButtonText}>{editMode ? 'Update Workout' : 'Add Workout'}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity 
          style={styles.deleteModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>
              Are you sure you want to delete this event?
              {repeat !== 'never' ? ' This is a repeating event.' : ''}
            </Text>
            
            <TouchableOpacity 
              style={styles.deleteModalButton} 
              onPress={handleDeleteThisEventOnly}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteModalButtonText}>Delete This Event Only</Text>
            </TouchableOpacity>
            
            {repeat !== 'never' && (
              <TouchableOpacity 
                style={styles.deleteModalButton} 
                onPress={handleDeleteAllFutureEvents}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalButtonText}>Delete All Future Events</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    marginHorizontal: 0,
    marginTop: 20, // Increased height
    borderTopLeftRadius: 40, // Increased radius
    borderTopRightRadius: 40, // Increased radius
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  circularIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  circularAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', // Match X button
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#3A3A3C',
    borderRadius: 16, // Increased radius
    padding: 3,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#636366',
  },
  toggleText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputCard: {
    backgroundColor: '#2C2C2E', // Lighter tone
    borderRadius: 24, // Increased radius
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  titleInput: {
    fontSize: 17,
    color: '#FFF',
    paddingVertical: 14,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 16,
    color: '#FFFFFF', // Synced with rowLabel
  },
  activeRowValue: {
    color: '#FFFFFF',
  },
  // Picker Wrapper
  pickerWrapper: {
    backgroundColor: '#3A3A3C',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    color: '#FFF',
    fontSize: 20,
  },
  // Date/Time Card
  dateTimeCard: {
    backgroundColor: '#2C2C2E', // Lighter tone
    borderRadius: 24, // Increased radius
    paddingHorizontal: 16,
    paddingTop: 8, // Added for balance
    paddingBottom: 16, // Increased for balance (Repeat is at bottom)
    marginBottom: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8, // Further reduced
  },
  dateTimeLabel: {
    fontSize: 17,
    color: '#FFF',
  },
  dateTimeValues: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    backgroundColor: 'rgba(120,120,128,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16, // Increased radius
  },
  datePillText: {
    fontSize: 17, // Increased by 1 (Total +2 from original)
    color: '#FFFFFF', // Synced with labels
    fontWeight: '500',
  },
  timePill: {
    backgroundColor: 'rgba(120,120,128,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16, // Increased radius
  },
  timePillActive: {
    backgroundColor: 'rgba(255,149,0,0.3)',
  },
  timePillText: {
    fontSize: 17, // Increased by 1 (Total +2 from original)
    color: '#FFFFFF', // Synced with labels
    fontWeight: '500',
  },
  pillActive: {
    backgroundColor: 'rgba(0,122,255,0.3)',
  },
  pillTextActive: {
    fontWeight: '600',
  },
  separator: {
    height: 1, // More prominent
    backgroundColor: '#48484A', // More distinct
    marginLeft: 0,
  },
  inlinePicker: {
    overflow: 'hidden',
  },
  // Calendar Styles
  calendarContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  monthNavText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  weekdayText: {
    width: DAY_WIDTH,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  weekendHeaderText: {
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayNumber: {
    backgroundColor: '#FF3B30',
  },
  todayDayNumber: {
    backgroundColor: 'rgba(255,59,48,0.3)',
  },
  dayText: {
    fontSize: 15,
    color: '#FFF',
  },
  weekendDayText: {
    color: '#666',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Time Picker
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginHorizontal: 4,
  },
  // Add Event Button
  addEventButton: {
    position: 'absolute',
    bottom: 34,
    left: 16,
    right: 16,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#34C759', // Green as requested
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addEventButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
});
