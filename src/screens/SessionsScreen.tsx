import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { allWorkouts } from '../constants/workoutData';
import { calculateCalories } from '../utils/CalorieCalculator';

type SessionsScreenProps = StackScreenProps<RootStackParamList, 'SessionsScreen'>;

type FilterType = 'All' | 'Workouts' | 'Walking' | 'Outdoor Cycling';

interface SessionData {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  elapsedTime: number;
  completedSets: number;
  completedReps: number;
  calories: number;
  settings?: any;
}

interface GroupedSessions {
  month: string;
  sessions: SessionData[];
}

export default function SessionsScreen({ navigation }: SessionsScreenProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [groupedSessions, setGroupedSessions] = useState<GroupedSessions[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutSummaries');
      if (stored) {
        const allSummaries = JSON.parse(stored);
        
        // Map to SessionData format
        const mappedSessions: SessionData[] = allSummaries.map((item: any, index: number) => {
          const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
          const calories = calculateCalories(item.workoutId, item.elapsedTime, weightVal, item.completedReps);
          
          return {
            id: `${item.workoutId}-${item.date}-${index}`,
            workoutId: item.workoutId,
            workoutName: item.workoutName || 'Workout',
            date: item.date,
            elapsedTime: item.elapsedTime || 0,
            completedSets: item.completedSets || 0,
            completedReps: item.completedReps || 0,
            calories: Math.round(calories),
            settings: item.settings,
          };
        });

        // Sort by date (newest first)
        mappedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setSessions(mappedSessions);
        groupSessionsByMonth(mappedSessions);
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
    }
  };

  const groupSessionsByMonth = (sessionList: SessionData[]) => {
    const grouped: { [key: string]: SessionData[] } = {};
    
    sessionList.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(session);
    });

    const result: GroupedSessions[] = Object.keys(grouped).map(month => ({
      month,
      sessions: grouped[month],
    }));

    setGroupedSessions(result);
  };

  const getFilteredSessions = () => {
    if (filter === 'All') return groupedSessions;
    
    const filtered = groupedSessions.map(group => ({
      ...group,
      sessions: group.sessions.filter(session => {
        switch (filter) {
          case 'Workouts':
            return true; // All are workouts
          case 'Walking':
            return session.workoutId.toLowerCase().includes('walk');
          case 'Outdoor Cycling':
            return session.workoutId.toLowerCase().includes('cycl') || 
                   session.workoutId.toLowerCase().includes('bike');
          default:
            return true;
        }
      })
    })).filter(group => group.sessions.length > 0);
    
    return filtered;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const getWorkoutIcon = (workoutId: string) => {
    const workout = allWorkouts.find(w => w.workoutId === workoutId);
    if (workout?.SvgIcon) {
      const IconComponent = workout.SvgIcon;
      return <IconComponent width={26} height={26} fill="#9DEC2C" />;
    }
    return <MaterialCommunityIcons name="dumbbell" size={26} color="#9DEC2C" />;
  };

  const getIconBackgroundColor = (workoutId: string) => {
    // Different colors for different workout types
    if (workoutId.includes('walk')) return 'rgba(255, 204, 0, 0.2)';
    if (workoutId.includes('run')) return 'rgba(157, 236, 44, 0.2)';
    if (workoutId.includes('cycl') || workoutId.includes('bike')) return 'rgba(157, 236, 44, 0.2)';
    return 'rgba(157, 236, 44, 0.15)';
  };

  const renderSessionCard = (session: SessionData) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => navigation.navigate('WorkoutSummaryScreen' as any, { 
        workoutId: session.workoutId,
        workoutName: session.workoutName 
      })}
      activeOpacity={0.8}
    >
      <View style={[styles.sessionIconContainer, { backgroundColor: getIconBackgroundColor(session.workoutId) }]}>
        {getWorkoutIcon(session.workoutId)}
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{session.workoutName}</Text>
        <Text style={styles.sessionValue}>
          {session.calories > 0 ? `${session.calories}KCAL` : 
           session.elapsedTime > 0 ? `${Math.floor(session.elapsedTime / 60)}:${(session.elapsedTime % 60).toString().padStart(2, '0')}` :
           `${session.completedSets}x${session.completedReps}`}
        </Text>
      </View>
      <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
    </TouchableOpacity>
  );

  const FILTERS: FilterType[] = ['All', 'Workouts', 'Walking', 'Outdoor Cycling'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons name="pencil-box-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Sessions</Text>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((filterItem) => (
          <TouchableOpacity
            key={filterItem}
            style={[
              styles.filterTab,
              filter === filterItem && styles.filterTabActive
            ]}
            onPress={() => setFilter(filterItem)}
          >
            <Text style={[
              styles.filterText,
              filter === filterItem && styles.filterTextActive
            ]}>
              {filterItem}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sessions List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {getFilteredSessions().map((group) => (
          <View key={group.month} style={styles.monthGroup}>
            <Text style={styles.monthTitle}>{group.month}</Text>
            {group.sessions.map(session => renderSessionCard(session))}
          </View>
        ))}
        
        {getFilteredSessions().length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sessions found</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  filterContainer: {
    maxHeight: 44,
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#9DEC2C',
  },
  filterText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthGroup: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  sessionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionValue: {
    color: '#FA114F',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sessionDate: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 17,
  },
});
