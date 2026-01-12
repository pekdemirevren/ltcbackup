import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MonthViewProps {
  onDateSelect: (date: number, rowIndex: number) => void;
  selectedDate: { date: number; rowIndex: number } | null;
}

const calendarWeeks = [
  [
    { date: null, day: 'M' },
    { date: 1, day: 'T', events: ['Yılbaşı', 'Yılbaşı'] },
    { date: 2, day: 'W' },
    { date: 3, day: 'T' },
    { date: 4, day: 'F' },
    { date: null, day: 'S' },
    { date: null, day: 'S' }
  ],
  [
    { date: 5, day: 'M', events: ['Leg day'] },
    { date: 6, day: 'T', events: ['Chest D'] },
    { date: 7, day: 'W', events: ['Back d...'] },
    { date: 8, day: 'T', events: ['Should...'] },
    { date: 9, day: 'F' },
    { date: 10, day: 'S' },
    { date: 11, day: 'S' }
  ],
  [
    { date: 12, day: 'M' },
    { date: 13, day: 'T' },
    { date: 14, day: 'W' },
    { date: 15, day: 'T' },
    { date: 16, day: 'F' },
    { date: 17, day: 'S' },
    { date: 18, day: 'S' }
  ],
  [
    { date: 19, day: 'M' },
    { date: 20, day: 'T' },
    { date: 21, day: 'W' },
    { date: 22, day: 'T' },
    { date: 23, day: 'F' },
    { date: 24, day: 'S', events: ['strava a...'] },
    { date: 25, day: 'S', events: ['copilot'] }
  ],
  [
    { date: 26, day: 'M' },
    { date: 27, day: 'T' },
    { date: 28, day: 'W' },
    { date: 29, day: 'T' },
    { date: 30, day: 'F' },
    { date: 31, day: 'S' },
    { date: null, day: 'S' }
  ]
];

const HEADER_HEIGHT = 120;
const DAY_HEADER_HEIGHT = 40;
const BOTTOM_BAR_HEIGHT = 80;

const AnimatedWeekRow = ({ week, weekIndex, selectedDate, onDateSelect }: any) => {
  const totalRows = calendarWeeks.length;
  const availableHeight = SCREEN_HEIGHT - HEADER_HEIGHT - DAY_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT;
  const rowHeight = availableHeight / totalRows;

  // Shared values for animation
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const isRowAboveSelected = selectedDate && weekIndex < selectedDate.rowIndex;
  const isRowBelowSelected = selectedDate && weekIndex > selectedDate.rowIndex;
  const isSelectedRow = selectedDate && weekIndex === selectedDate.rowIndex;

  useEffect(() => {
    if (!selectedDate) {
      // Reset to initial state
      translateY.value = withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      opacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    } else {
      const targetPosition = DAY_HEADER_HEIGHT;
      const currentRowPosition = weekIndex * rowHeight;

      if (isSelectedRow) {
        // Selected row moves to under M,T,W
        const offset = targetPosition - currentRowPosition;
        translateY.value = withTiming(offset, {
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(1, {
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
      } else if (isRowAboveSelected) {
        // Rows above: move up and fade out
        const distance = selectedDate.rowIndex - weekIndex;
        const offset = -(currentRowPosition + targetPosition + (distance * 100));
        translateY.value = withTiming(offset, {
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(0, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
      } else if (isRowBelowSelected) {
        // Rows below: move down and fade out
        const distance = weekIndex - selectedDate.rowIndex;
        const offset = SCREEN_HEIGHT - currentRowPosition + (distance * 100);
        translateY.value = withTiming(offset, {
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(0, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
      }
    }
  }, [selectedDate, weekIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.weekRow,
        {
          height: rowHeight,
          top: weekIndex * rowHeight,
        },
        animatedStyle,
        isSelectedRow && styles.selectedRow,
      ]}
    >
      {week.map((day: any, dayIndex: number) => (
        <TouchableOpacity
          key={dayIndex}
          onPress={() => day.date && !selectedDate && onDateSelect(day.date, weekIndex)}
          disabled={!day.date || selectedDate !== null}
          style={styles.dayCell}
        >
          {day.date && (
            <View style={styles.dayContent}>
              {isSelectedRow ? (
                <View
                  style={[
                    styles.dayCircle,
                    day.date === selectedDate?.date && styles.selectedDayCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumberSmall,
                      day.date === selectedDate?.date && styles.selectedDayNumber,
                    ]}
                  >
                    {day.date}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.dayNumber}>{day.date}</Text>
                  {day.events && (
                    <View style={styles.eventsContainer}>
                      {day.events.map((event: string, i: number) => (
                        <View key={i} style={styles.eventBadge}>
                          <Text style={styles.eventText}>{event}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

export function MonthViewRN({ onDateSelect, selectedDate }: MonthViewProps) {
  const headerOpacity = useSharedValue(1);
  const monthTitleOpacity = useSharedValue(1);

  useEffect(() => {
    if (selectedDate) {
      monthTitleOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    } else {
      monthTitleOpacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
  }, [selectedDate]);

  const monthTitleStyle = useAnimatedStyle(() => ({
    opacity: monthTitleOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerButton}>
            <Text style={styles.headerText}>
              {selectedDate ? 'Jan 2026' : '2025'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⊞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⊙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={monthTitleStyle}>
          <Text style={styles.monthTitle}>January</Text>
        </Animated.View>
      </View>

      {/* Day Headers - M, T, W, T, F, S, S */}
      <View style={styles.dayHeaders}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <View key={i} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Weeks */}
      <View style={styles.calendarContainer}>
        {calendarWeeks.map((week, weekIndex) => (
          <AnimatedWeekRow
            key={weekIndex}
            week={week}
            weekIndex={weekIndex}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        ))}
      </View>

      {/* Bottom Bar */}
      {!selectedDate && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.todayButton}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
          <View style={styles.viewButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⊞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>□</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    height: HEADER_HEIGHT,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButton: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  iconText: {
    color: '#FFF',
    fontSize: 20,
  },
  monthTitle: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    height: DAY_HEADER_HEIGHT,
    zIndex: 20,
    backgroundColor: '#000',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#71717A',
    fontSize: 14,
  },
  calendarContainer: {
    flex: 1,
    position: 'relative',
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
    zIndex: 15,
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
    color: '#FFF',
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNumberSmall: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '500',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#FFF',
  },
  selectedDayNumber: {
    color: '#000',
  },
  eventsContainer: {
    width: '100%',
    gap: 4,
  },
  eventBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  eventText: {
    color: '#FFF',
    fontSize: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    height: BOTTOM_BAR_HEIGHT,
  },
  todayButton: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  todayText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  viewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
