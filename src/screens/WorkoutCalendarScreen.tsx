// WorkoutCalendarScreen.tsx - COMPLETE FILE

import React, { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import { ThemeContext } from '../contexts/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInRight,
  SlideInDown,
} from 'react-native-reanimated';
import {
  WorkoutDayType,
  loadDailySchedule,
  DailySchedule,
  WORKOUT_DAY_COLORS,
  ALL_WORKOUT_DAYS,
  loadHiddenWorkoutDays,
} from '../utils/WorkoutDayManager';

type WorkoutCalendarScreenProps = StackScreenProps<RootStackParamList, 'WorkoutCalendar'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HEADER_HEIGHT = 60;
const MONTH_TITLE_HEIGHT = 50;
const DAY_HEADER_HEIGHT = 20;
const SELECTED_ROW_GAP = 40;
const BOTTOM_BAR_HEIGHT = 80;
const WEEK_ROW_HEIGHT = 52;
const DATE_TITLE_HEIGHT = 44;

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

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getToday = (): string => {
  return formatDateKey(new Date());
};

const getDaysInMonth = (year: number, month: number): (Date | null)[] => {
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

const getWeekDays = (centerDate: Date): Date[] => {
  const days: Date[] = [];
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

export default function WorkoutCalendarScreen({ navigation }: WorkoutCalendarScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  const today = getToday();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<{ date: Date; rowIndex: number } | null>(null);
  const [events, setEvents] = useState<WorkoutEvent[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule>({});
  const [hiddenDays, setHiddenDays] = useState<WorkoutDayType[]>([]);
  // Yıllık takvim modalı için state
  const [showYearPicker, setShowYearPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      loadScheduleAndHiddenDays();
    }, [])
  );

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadScheduleAndHiddenDays = async () => {
    try {
      const hidden = await loadHiddenWorkoutDays();
      setHiddenDays(hidden);
      const loaded = await loadDailySchedule();
      
      const visibleDays = ALL_WORKOUT_DAYS.filter(day => !hidden.includes(day));
      if (visibleDays.length === 0) {
        setSchedule(loaded);
        return;
      }

      const generatedSchedule: DailySchedule = { ...loaded };
      const now = new Date();

      for (let i = -30; i < 90; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        const dateKey = formatDateKey(date);
        
        if (!generatedSchedule[dateKey]) {
          const dateNum = parseInt(dateKey.replace(/-/g, ''));
          const randomIndex = dateNum % visibleDays.length;
          generatedSchedule[dateKey] = visibleDays[randomIndex];
        }
      }

      setSchedule(generatedSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleDayPress = (date: Date, rowIndex: number) => {
    setSelectedDate({ date, rowIndex });
  };

  const handleCloseDayView = () => {
    setSelectedDate(null);
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
  };

  const getWorkoutForDate = (date: Date): WorkoutDayType | null => {
    const dateKey = formatDateKey(date);
    return schedule[dateKey] || null;
  };

  const getEventsForDate = (date: Date): WorkoutEvent[] => {
    const dateKey = formatDateKey(date);
    return events.filter(e => formatDateKey(new Date(e.date)) === dateKey);
  };

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const daysArr = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArr.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArr.push(new Date(year, month, i));
    }
    return daysArr;
  }, [currentDate]);

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const totalRows = weeks.length;
  const availableHeightMonth = SCREEN_HEIGHT - HEADER_HEIGHT - MONTH_TITLE_HEIGHT - DAY_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT;
  const availableHeightDay = SCREEN_HEIGHT - HEADER_HEIGHT - DAY_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT;
  const rowHeight = selectedDate ? availableHeightDay / totalRows : availableHeightMonth / totalRows;

  interface AnimatedWeekRowProps {
    week: (Date | null)[];
    weekIndex: number;
  }

  const AnimatedWeekRow = ({ week, weekIndex }: AnimatedWeekRowProps) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const isRowAboveSelected = selectedDate && weekIndex < selectedDate.rowIndex;
    const isRowBelowSelected = selectedDate && weekIndex > selectedDate.rowIndex;
    const isSelectedRow = selectedDate && weekIndex === selectedDate.rowIndex;

    useEffect(() => {
      if (!selectedDate) {
        translateY.value = withTiming(0, {
          duration: 400,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(1, {
          duration: 400,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
      } else {
        const targetPosition = HEADER_HEIGHT + DAY_HEADER_HEIGHT + SELECTED_ROW_GAP;
        const currentRowPositionInMonth = HEADER_HEIGHT + MONTH_TITLE_HEIGHT + DAY_HEADER_HEIGHT + (weekIndex * rowHeight);

        if (isSelectedRow) {
          const offset = targetPosition - currentRowPositionInMonth;
          translateY.value = withTiming(offset, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          opacity.value = withTiming(1, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
        } else if (isRowAboveSelected) {
          const offset = -SCREEN_HEIGHT;
          translateY.value = withTiming(offset, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          opacity.value = withTiming(0, {
            duration: 300,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
        } else if (isRowBelowSelected) {
          const offset = SCREEN_HEIGHT;
          translateY.value = withTiming(offset, {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          opacity.value = withTiming(0, {
            duration: 300,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
        }
      }
    }, [selectedDate, weekIndex, rowHeight]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));

    const topPosition = weekIndex * rowHeight;

    return (
      <Animated.View
        style={[
          styles.weekRow,
          { height: rowHeight, top: topPosition },
          animatedStyle,
          isSelectedRow && styles.selectedRow,
        ]}
      >
        {week.map((day, dayIdx) => {
          if (!day) {
            return <View key={dayIdx} style={styles.dayCell} />;
          }

          const dayWorkout = getWorkoutForDate(day);
          const dayEvents = getEventsForDate(day);
          const isTodayDate = isToday(day);

          return (
            <TouchableOpacity
              key={dayIdx}
              style={styles.dayCell}
              onPress={() => handleDayPress(day, weekIndex)}
              disabled={selectedDate !== null}
              activeOpacity={0.7}
            >
              {isSelectedRow ? (
                <View style={[
                  styles.dayCircle,
                  selectedDate && formatDateKey(day) === formatDateKey(selectedDate.date) && styles.selectedDayCircle,
                ]}>
                  <Text style={[
                    styles.dayNumberLarge,
                    selectedDate && formatDateKey(day) === formatDateKey(selectedDate.date) && styles.selectedDayNumberText,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
              ) : (
                <View style={styles.dayContent}>
                  <View style={[
                    styles.dayNumber,
                    isTodayDate && styles.todayNumber,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isTodayDate && styles.todayText,
                      dayIdx >= 5 && !isTodayDate && styles.weekendDayText,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>

                  <View style={styles.dayLabels}>
                    {dayWorkout && (
                      <View style={[
                        styles.workoutLabel,
                        { backgroundColor: WORKOUT_DAY_COLORS[dayWorkout] + '40' }
                      ]}>
                        <Text style={styles.workoutLabelText} numberOfLines={1}>
                          {dayWorkout.replace(' Day', '').toLowerCase()}
                        </Text>
                      </View>
                    )}
                    {dayEvents.map((event) => (
                      <View
                        key={event.id}
                        style={[
                          styles.eventLabel,
                          { backgroundColor: WORKOUT_DAY_COLORS[event.workoutDay] + '40' }
                        ]}
                      >
                        <Text style={styles.eventLabelText} numberOfLines={1}>
                          {event.title.toLowerCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Eksik fonksiyonlar ve değişkenler
  const handleBack = () => {
    // Geri butonu için örnek davranış
    if (selectedDate) {
      setSelectedDate(null);
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleYearPress = () => {
    setShowYearPicker(true);
  };

  const handleTodayPress = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    // Eğer haftalık görünüm varsa, haftayı da güncelle
    if (typeof setSelectedDate === 'function') {
      setSelectedDate({ date: todayDate, rowIndex: 0 });
    }
  };

  // Ana bileşenin return bloğu
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        {selectedDate ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.monthContainer}>
              <Feather name="chevron-left" size={28} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.monthHeaderText}>
                {MONTHS_SHORT[selectedDate.date.getMonth()]} {selectedDate.date.getFullYear()}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleYearPress} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.monthContainer}>
              <Feather name="chevron-left" size={28} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.yearText}>2026</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="list" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="search" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="plus" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Title */}
      {!selectedDate && (
        <View style={styles.monthTitleContainer}>
          <Text style={styles.monthTitle}>{MONTHS_FULL[currentDate.getMonth()]}</Text>
        </View>
      )}

      {/* Day Headers M T W */}
      <View style={styles.dayHeaders}>
        {WEEKDAYS.map((day, idx) => (
          <View key={idx} style={styles.dayHeader}>
            <Text
              style={[
                styles.dayHeaderText,
                idx >= 5 && styles.weekendWeekday,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {weeks.map((week, weekIndex) => (
          <AnimatedWeekRow key={weekIndex} week={week} weekIndex={weekIndex} />
        ))}
      </View>

      {/* Day View */}
      {selectedDate && (
        <Animated.View 
          entering={FadeInRight.duration(200)}
          style={[
            styles.dayViewContainer,
            { top: HEADER_HEIGHT + DAY_HEADER_HEIGHT + SELECTED_ROW_GAP + WEEK_ROW_HEIGHT }
          ]}
        >
          <View style={styles.separator} />

          <Animated.View
            entering={FadeInRight.duration(300).delay(100)}
            style={styles.dateTitleContainer}
          >
            <Text style={styles.dateTitle}>
              {MONTHS_SHORT[selectedDate.date.getMonth()]} {selectedDate.date.getDate()}, {selectedDate.date.getFullYear()} – {WEEKDAYS_FULL[selectedDate.date.getDay()]}
            </Text>
          </Animated.View>

          <View style={styles.separator} />

          <Animated.ScrollView
            entering={SlideInDown.duration(350).delay(150)}
            style={styles.timelineScroll}
            showsVerticalScrollIndicator={false}
          >
            {timeSlots.map((time) => (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeText}>{time}</Text>
                <View style={styles.timeSlotContent} />
              </View>
            ))}
          </Animated.ScrollView>
        </Animated.View>
      )}

      {/* Bottom Bar */}
      {!selectedDate && (
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleTodayPress} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>

          <View style={styles.bottomIcons}>
            <TouchableOpacity style={styles.bottomIcon}>
              <Feather name="calendar" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIcon}>
              <Feather name="inbox" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Year Picker Modal */}
      {showYearPicker && (
        <Modal
          visible={showYearPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
              <View style={{ width: 80 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity style={{ padding: 8 }}>
                  <Feather name="search" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setShowYearPicker(false)}
                >
                  <Feather name="check" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            {/* FlatList for years */}
            <FlatList
              data={[...Array(10)].map((_, i) => 2026 + i)}
              renderItem={({ item: year }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 34, fontWeight: '700', color: '#FF3B30', paddingHorizontal: 16, paddingTop: 8 }}>{year}</Text>
                  <View style={{ height: 1, backgroundColor: '#333', marginHorizontal: 16, marginTop: 12, marginBottom: 8 }} />
                  {/* 12 months grid for this year */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 8 }}>
                    {[...Array(12)].map((_, monthIndex) => (
                      <TouchableOpacity 
                        key={monthIndex}
                        style={{ width: '30%', marginBottom: 24, alignItems: 'center' }}
                        onPress={() => {
                          // Ay seçildiğinde modalı kapatıp ilgili ayı göster
                          setCurrentDate(new Date(year, monthIndex, 1));
                          setShowYearPicker(false);
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 8 }}>{MONTHS_SHORT[monthIndex]}</Text>
                        {/* Mini weekday header */}
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                          {WEEKDAYS.map((day, i) => (
                            <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#8E8E93', fontWeight: '500' }}>{day}</Text>
                          ))}
                        </View>
                        {/* Mini days grid */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {(() => {
                            const firstDay = new Date(year, monthIndex, 1);
                            const lastDay = new Date(year, monthIndex + 1, 0);
                            let startDayOfWeek = firstDay.getDay() - 1;
                            if (startDayOfWeek < 0) startDayOfWeek = 6;
                            const days = [];
                            for (let i = 0; i < startDayOfWeek; i++) days.push(null);
                            for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
                            return days.map((day, dayIndex) => (
                              <View key={dayIndex} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                                {day !== null && (
                                  <View style={{ width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }}>
                                    <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '400' }}>{day}</Text>
                                  </View>
                                )}
                              </View>
                            ));
                          })()}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.toString()}
              style={{ flex: 1, paddingHorizontal: 8 }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={3}
              windowSize={7}
              removeClippedSubviews={true}
              ListFooterComponent={<View style={{ height: 100 }} />}
            />
            {/* Bottom bar */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40, backgroundColor: '#000' }}>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' }}
                onPress={() => setShowYearPicker(false)}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '500' }}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: HEADER_HEIGHT,
    zIndex: 100,
    backgroundColor: '#000000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthContainer: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthHeaderText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  yearText: {
    fontSize: 17,
    color: '#ffffffff',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconButton: {
    padding: 4,
  },
  monthTitleContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    height: MONTH_TITLE_HEIGHT,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  monthTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 0,
    borderBottomColor: '#27272A',
    height: DAY_HEADER_HEIGHT,
    zIndex: 50,
    backgroundColor: '#000',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#ffffffff',
    fontSize: 12,
  },
  weekendWeekday: {
    color: '#666',
  },
  calendarContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    position: 'absolute',
    width: '100%',
  },
  selectedRow: {
    zIndex: 40,
    backgroundColor: '#000',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  dayContent: {
    alignItems: 'center',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  todayNumber: {
    backgroundColor: '#FF3B30',
  },
  dayText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekendDayText: {
    color: '#666666',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#FFF',
  },
  dayNumberLarge: {
    fontSize: 19,
    fontWeight: '500',
    color: '#FFF',
  },
  selectedDayNumberText: {
    color: '#000',
  },
  dayLabels: {
    width: '100%',
    gap: 0,
    alignItems: 'center',
  },
  workoutLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 45,
  },
  workoutLabelText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  eventLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 45,
  },
  eventLabelText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  dayViewContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 30,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
  },
  dateTitleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    height: DATE_TITLE_HEIGHT,
    justifyContent: 'center',
  },
  dateTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
  },
  timelineScroll: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '400',
    width: 52,
    paddingTop: 4,
  },
  timeSlotContent: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1C1C2E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
    height: BOTTOM_BAR_HEIGHT,
    zIndex: 90,
  },
  todayButton: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bottomIcon: {
    padding: 4,
  },
});
