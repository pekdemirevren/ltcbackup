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

  const [eventType, setEventType] = useState<'event' | 'reminder'>('event');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(new Date(initialDate.getTime() + 60 * 60 * 1000));
  const [repeat, setRepeat] = useState('never');
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDayType>('LEG DAY');
  const [isLoading, setIsLoading] = useState(editMode);
  
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

  const handleDelete = async () => {
    if (!editEventId) return;
    
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
      events = events.filter(e => e.id !== editEventId);
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
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
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Feather name="x" size={24} color="#8E8E93" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{editMode ? 'Edit Event' : 'New Event'}</Text>
          
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Feather name="check" size={20} color="#FFF" />
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
          {/* Title Input */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="#8E8E93"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          {/* Workout Type Row */}
          <TouchableOpacity
            style={[styles.inputCard, activePickerField === 'workout' && styles.cardExpanded]}
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
              style={styles.dateTimeRow}
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
              <Text style={styles.deleteButtonText}>Delete Event</Text>
            </TouchableOpacity>
          )}
          
          <View style={{ height: 120 }} />
        </ScrollView>
        
        {/* Add/Update Event Button */}
        <TouchableOpacity onPress={handleAdd} style={styles.addEventButton} activeOpacity={0.9}>
          <Text style={styles.addEventButtonText}>{editMode ? 'Update Event' : 'Add Event'}</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#2C2C2E',
    marginHorizontal: 0,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#3A3A3C',
    borderRadius: 10,
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
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
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
    color: '#8E8E93',
  },
  activeRowValue: {
    color: '#007AFF',
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
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dateTimeLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  dateTimeValues: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    backgroundColor: 'rgba(120,120,128,0.24)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  datePillText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  timePill: {
    backgroundColor: 'rgba(120,120,128,0.24)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timePillActive: {
    backgroundColor: 'rgba(255,149,0,0.3)',
  },
  timePillText: {
    fontSize: 15,
    color: '#FF9500',
    fontWeight: '500',
  },
  pillActive: {
    backgroundColor: 'rgba(0,122,255,0.3)',
  },
  pillTextActive: {
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
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
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
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
});
