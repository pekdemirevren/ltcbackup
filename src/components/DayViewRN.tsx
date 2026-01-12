import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
} from 'react-native-reanimated';

interface DayViewProps {
  selectedDate: { date: number; rowIndex: number } | null;
  onClose: () => void;
}

const timeSlots = [
  '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const getWeekDays = (selectedDate: number) => {
  const weeks = [
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, 31, 1]
  ];
  
  const week = weeks.find(w => w.includes(selectedDate)) || weeks[0];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return week.map((date, index) => ({
    date,
    day: dayNames[index]
  }));
};

const getDayName = (date: number) => {
  const dayMap: { [key: number]: string } = {
    5: 'Monday', 6: 'Tuesday', 7: 'Wednesday', 8: 'Thursday', 9: 'Friday', 10: 'Saturday', 11: 'Sunday',
    12: 'Monday', 13: 'Tuesday', 14: 'Wednesday', 15: 'Thursday', 16: 'Friday', 17: 'Saturday', 18: 'Sunday',
    19: 'Monday', 20: 'Tuesday', 21: 'Wednesday', 22: 'Thursday', 23: 'Friday', 24: 'Saturday', 25: 'Sunday',
    26: 'Monday', 27: 'Tuesday', 28: 'Wednesday', 29: 'Thursday', 30: 'Friday', 31: 'Saturday'
  };
  return dayMap[date] || 'Monday';
};

export function DayViewRN({ selectedDate, onClose }: DayViewProps) {
  if (!selectedDate) return null;

  const weekDays = getWeekDays(selectedDate.date);
  const dayName = getDayName(selectedDate.date);

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(200)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Week strip */}
        <Animated.View
          entering={SlideInUp.duration(400).delay(300)}
          style={styles.weekStrip}
        >
          <View style={styles.weekDays}>
            {weekDays.map((day) => (
              <View key={day.date} style={styles.weekDayItem}>
                <Text style={styles.weekDayLabel}>{day.day}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    day.date === selectedDate.date && styles.selectedDayCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayNumber,
                      day.date === selectedDate.date && styles.selectedDayNumber,
                    ]}
                  >
                    {day.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Day title */}
        <Animated.View
          entering={FadeIn.duration(400).delay(400)}
          style={styles.dayTitle}
        >
          <Text style={styles.dayTitleText}>
            Jan {selectedDate.date}, 2026 – {dayName}
          </Text>
        </Animated.View>

        {/* Time slots */}
        <Animated.View
          entering={SlideInDown.duration(400).delay(500)}
          style={styles.timeSlotsContainer}
        >
          <ScrollView style={styles.scrollView}>
            {timeSlots.map((time) => (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeText}>{time}</Text>
                <View style={styles.timeSlotContent} />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Bottom Bar */}
        <Animated.View
          entering={SlideInDown.duration(300).delay(600)}
          style={styles.bottomBar}
        >
          <TouchableOpacity onPress={onClose} style={styles.todayButton}>
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
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  weekStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayItem: {
    alignItems: 'center',
  },
  weekDayLabel: {
    color: '#71717A',
    fontSize: 12,
    marginBottom: 4,
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
  weekDayNumber: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDayNumber: {
    color: '#000',
  },
  dayTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  dayTitleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 39, 42, 0.5)',
  },
  timeText: {
    color: '#71717A',
    fontSize: 14,
    width: 64,
  },
  timeSlotContent: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
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
  iconButton: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFF',
    fontSize: 20,
  },
});
