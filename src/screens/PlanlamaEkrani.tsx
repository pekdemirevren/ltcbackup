import React, { useState, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ExpandableCalendar,
  TimelineList,
  CalendarProvider,
  TimelineEventProps,
} from 'react-native-calendars';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ThemeContext } from '../contexts/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';

type PlanlamaEkraniProps = StackScreenProps<RootStackParamList, 'PlanlamaEkrani'>;

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date
const getToday = (): string => {
  const today = new Date();
  return formatDate(today);
};

// Sample events data type
interface EventsByDate {
  [date: string]: TimelineEventProps[];
}

const PlanlamaEkrani: React.FC<PlanlamaEkraniProps> = ({ navigation }) => {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };
  
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentDate, setCurrentDate] = useState(today);

  // Sample workout events - you can replace this with real data
  const timelineEvents: EventsByDate = useMemo(() => ({
    [today]: [
      {
        id: '1',
        start: `${today} 09:00:00`,
        end: `${today} 10:00:00`,
        title: 'Morning Workout',
        summary: 'HIIT Training Session',
        color: '#34C759', // Green
      },
      {
        id: '2',
        start: `${today} 14:00:00`,
        end: `${today} 15:30:00`,
        title: 'Strength Training',
        summary: 'Upper Body Focus',
        color: '#007AFF', // Blue
      },
      {
        id: '3',
        start: `${today} 18:00:00`,
        end: `${today} 19:00:00`,
        title: 'Evening Run',
        summary: 'Cardio - 5km',
        color: '#FF3B30', // Red
      },
    ],
  }), [today]);

  const onDateChanged = useCallback((date: string) => {
    setCurrentDate(date);
    setSelectedDate(date);
  }, []);

  const onMonthChange = useCallback((month: any) => {
    console.log('Month changed:', month);
  }, []);

  // Marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    
    // Mark days with events
    Object.keys(timelineEvents).forEach(date => {
      marks[date] = {
        marked: true,
        dotColor: '#34C759',
      };
    });
    
    // Mark selected date
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: '#007AFF',
    };
    
    return marks;
  }, [selectedDate, timelineEvents]);

  // Calendar theme matching iOS dark mode
  const calendarTheme = useMemo(() => ({
    // Background colors
    calendarBackground: '#000000',
    backgroundColor: '#000000',
    
    // Text colors
    textSectionTitleColor: '#8E8E93',
    textSectionTitleDisabledColor: '#3A3A3C',
    selectedDayBackgroundColor: '#007AFF',
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: '#007AFF',
    dayTextColor: '#FFFFFF',
    textDisabledColor: '#3A3A3C',
    monthTextColor: '#FFFFFF',
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
    arrowColor: '#007AFF',
    
    // Other styles
    agendaDayTextColor: '#FFFFFF',
    agendaDayNumColor: '#007AFF',
    agendaTodayColor: '#007AFF',
    agendaKnobColor: '#3A3A3C',
    
    // Expanded calendar specific
    expandableKnobColor: '#3A3A3C',
    reservationsBackgroundColor: '#000000',
    
    // Font sizes
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
  }), []);

  // Timeline props
  const timelineProps = useMemo(() => ({
    format24h: true,
    start: 0,
    end: 24,
    unavailableHours: [
      { start: 0, end: 6 },
      { start: 22, end: 24 },
    ],
    unavailableHoursColor: 'rgba(58, 58, 60, 0.3)',
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 24,
    scrollToNow: true,
    scrollToFirst: false,
    onEventPress: (event: TimelineEventProps) => {
      console.log('Event tapped:', event);
      // Navigate to event detail or handle tap
    },
    onBackgroundLongPress: (timeString: string) => {
      console.log('Background long press:', timeString);
      // Create new event at this time
    },
    theme: {
      // Timeline specific theme
      todayDotColor: '#007AFF',
      eventTitle: {
        fontWeight: '600' as const,
        fontSize: 14,
      },
      eventSummary: {
        fontSize: 12,
        color: '#FFFFFF',
      },
      eventTimes: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      nowIndicatorLine: {
        backgroundColor: '#FF3B30',
      },
      nowIndicatorKnob: {
        backgroundColor: '#FF3B30',
      },
      timeLabel: {
        color: '#8E8E93',
        fontSize: 12,
      },
      lineColor: '#3A3A3C',
    },
  }), []);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle add new event
  const handleAddEvent = () => {
    // Navigate to create event screen or show modal
    console.log('Add new event');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planlama</Text>
        <TouchableOpacity onPress={handleAddEvent} style={styles.addButton}>
          <Feather name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Calendar Provider wraps everything */}
      <CalendarProvider
        date={selectedDate}
        onDateChanged={onDateChanged}
        onMonthChange={onMonthChange}
        showTodayButton
        todayButtonStyle={styles.todayButton}
        theme={{
          todayButtonTextColor: '#007AFF',
        }}
      >
        {/* Expandable Calendar - collapses to week view on day tap */}
        <ExpandableCalendar
          firstDay={1} // Monday start
          markedDates={markedDates}
          theme={calendarTheme}
          // ═══════════════════════════════════════════════════════════
          // iOS-STYLE ANİMASYON AYARLARI
          // ═══════════════════════════════════════════════════════════
          
          // 1️⃣ closeOnDayPress: Güne tap'te hafta satırı yukarı kayar ve freeze olur
          closeOnDayPress={true}
          
          // 2️⃣ animateScroll: Ay/hafta geçişlerinde smooth scroll animasyonu
          animateScroll={true}
          
          // 3️⃣ disablePan: false = Swipe-down ile yeniden açılabilir
          disablePan={false}
          
          // 4️⃣ hideKnob: false = Genişletme/daraltma knob'u görünür
          hideKnob={false}
          
          // 5️⃣ initialPosition: Başlangıçta tam açık (aylık görünüm)
          initialPosition={ExpandableCalendar.positions.OPEN}
          
          // 6️⃣ openThreshold: Açılma eşik değeri (ne kadar swipe ile açılır)
          openThreshold={50}
          
          // 7️⃣ closeThreshold: Kapanma eşik değeri
          closeThreshold={50}
          
          // Diğer ayarlar
          allowShadow={true} // Gölge efekti
          disableWeekScroll={false} // Hafta kaydırma aktif
          hideArrows={false} // Ok butonları görünür
          
          // ═══════════════════════════════════════════════════════════
          // Calendar header style
          renderHeader={(date) => {
            const dateObj = new Date(date);
            const monthNames = [
              'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
            ];
            return (
              <View style={styles.customHeader}>
                <Text style={styles.customHeaderText}>
                  {monthNames[dateObj.getMonth()]} {dateObj.getFullYear()}
                </Text>
              </View>
            );
          }}
        />

        {/* Timeline List - scrollable hourly view */}
        <TimelineList
          events={timelineEvents}
          timelineProps={timelineProps}
          showNowIndicator={true}
          scrollToNow={true}
          initialTime={{ hour: 9, minutes: 0 }}
        />
      </CalendarProvider>
    </SafeAreaView>
  );
};

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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  todayButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customHeader: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  customHeaderText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PlanlamaEkrani;
