import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS } from '../utils/WorkoutDayManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EVENTS_STORAGE_KEY = '@workout_calendar_events';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
  workoutIds: string[];
  calendar?: string;
  repeat?: string;
}

type EventDetailScreenProps = StackScreenProps<RootStackParamList, 'EventDetail'>;

export default function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { 
    background: '#000', 
    text: '#FFF',
    cardBackground: '#1C1C1E',
  };

  const { eventId, date } = route.params;
  const [event, setEvent] = useState<WorkoutEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const events: WorkoutEvent[] = JSON.parse(stored);
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    if (event) {
      navigation.navigate('CreateWorkoutEvent', {
        date: event.date,
        eventId: event.id,
        editMode: true,
      });
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
              let events: WorkoutEvent[] = stored ? JSON.parse(stored) : [];
              events = events.filter(e => e.id !== eventId);
              await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting event:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} ${DAYS[d.getDay()]}`;
  };

  const getTimelineHours = (): number[] => {
    if (!event) return [9, 10, 11];
    const startHour = parseInt(event.startTime.split(':')[0]);
    return [startHour - 1, startHour, startHour + 1];
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Event not found</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonFallback}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const timelineHours = getTimelineHours();
  const eventColor = WORKOUT_DAY_COLORS[event.workoutDay] || '#007AFF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="chevron-left" size={22} color="#FFF" />
          <Text style={styles.backButtonText}>
            {MONTHS_SHORT[eventDate.getMonth()]} {eventDate.getDate()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        {/* Date and Time */}
        <Text style={styles.eventDateTime}>{formatDate(event.date)}</Text>
        <Text style={styles.eventTime}>{event.startTime} – {event.endTime}</Text>
        
        {/* Mini Timeline */}
        <View style={styles.timelineContainer}>
          {timelineHours.map((hour, index) => {
            const hourStr = String(hour).padStart(2, '0');
            const startHour = parseInt(event.startTime.split(':')[0]);
            const isEventHour = hour === startHour;
            
            return (
              <View key={hour} style={styles.timelineRow}>
                <Text style={styles.timelineHour}>{hourStr}:00</Text>
                <View style={styles.timelineLine}>
                  {isEventHour && (
                    <View style={[styles.timelineEvent, { backgroundColor: eventColor }]}>
                      <Text style={styles.timelineEventTitle}>{event.title}</Text>
                      <View style={styles.timelineEventTimeRow}>
                        <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.timelineEventTime}>
                          {event.startTime} – {event.endTime}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Calendar Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Calendar</Text>
            <View style={styles.infoValueContainer}>
              <View style={[styles.calendarDot, { backgroundColor: eventColor }]} />
              <Text style={styles.infoValue}>{event.workoutDay}</Text>
              <Feather name="chevron-right" size={16} color="#8E8E93" />
            </View>
          </View>
        </View>
        
        {/* Alert Settings */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alert</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {event.alertMinutes > 0 ? `${event.alertMinutes} minutes before` : 'None'}
              </Text>
              <Feather name="chevron-right" size={16} color="#8E8E93" />
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Second Alert</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>None</Text>
              <Feather name="chevron-right" size={16} color="#8E8E93" />
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Delete Button */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete Event</Text>
      </TouchableOpacity>
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
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  backButtonFallback: {
    padding: 16,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  timelineContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineHour: {
    width: 50,
    color: '#8E8E93',
    fontSize: 12,
  },
  timelineLine: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#3A3A3C',
    paddingLeft: 12,
    minHeight: 50,
  },
  timelineEvent: {
    backgroundColor: '#6B9BD2',
    borderRadius: 6,
    padding: 10,
    marginRight: 8,
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
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
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
  deleteButton: {
    position: 'absolute',
    bottom: 34,
    left: 16,
    right: 16,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
});
