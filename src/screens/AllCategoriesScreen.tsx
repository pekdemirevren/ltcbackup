import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { allWorkouts, Workout } from '../constants/workoutData';

type AllCategoriesScreenProps = StackScreenProps<RootStackParamList, 'AllCategories'>;

interface CategoryItem {
  id: string;
  title: string;
  icon: string;
  iconType: 'feather' | 'material' | 'svg';
  screen: keyof RootStackParamList | null;
  nestedScreen?: string;
  isWorkout?: boolean;
  workoutId?: string;
  SvgIcon?: React.FC<any>;
}

// Static categories
const STATIC_CATEGORIES: CategoryItem[] = [
  { id: 'activity-rings', title: 'Activity Rings', icon: 'circle-slice-8', iconType: 'material', screen: 'Summary', nestedScreen: 'DailySummaryDetail' },
  { id: 'steps', title: 'Steps', icon: 'shoe-print', iconType: 'material', screen: null },
  { id: 'sessions', title: 'Sessions', icon: 'clock-outline', iconType: 'material', screen: 'SessionsScreen' },
  { id: 'trends', title: 'Trends', icon: 'trending-up', iconType: 'feather', screen: 'Summary', nestedScreen: 'Trends' },
  { id: 'awards', title: 'Awards', icon: 'hexagon-outline', iconType: 'material', screen: null },
];

// Convert workouts to category items
const WORKOUT_CATEGORIES: CategoryItem[] = allWorkouts.map((workout: Workout) => ({
  id: workout.workoutId,
  title: workout.name,
  icon: '',
  iconType: 'svg' as const,
  screen: 'WorkoutCategoryDetail' as keyof RootStackParamList,
  isWorkout: true,
  workoutId: workout.workoutId,
  SvgIcon: workout.SvgIcon,
}));

// Combined list
const CATEGORIES: CategoryItem[] = [...STATIC_CATEGORIES, ...WORKOUT_CATEGORIES];

export default function AllCategoriesScreen({ navigation }: AllCategoriesScreenProps) {
  const handleCategoryPress = (category: CategoryItem) => {
    if (category.screen) {
      if (category.isWorkout && category.workoutId) {
        // Navigate to workout detail
        navigation.navigate('WorkoutCategoryDetail' as any, { 
          workoutId: category.workoutId,
          workoutName: category.title,
        });
      } else if (category.screen === 'SessionsScreen') {
        navigation.navigate('SessionsScreen' as any);
      } else if (category.id === 'trends') {
        // Navigate directly to Trends screen
        navigation.navigate('Trends' as any);
      } else if (category.nestedScreen) {
        // Navigate to nested screen within a tab (deeply nested)
        navigation.navigate('Main' as any, {
          screen: category.screen,
          params: {
            screen: category.nestedScreen
          }
        });
      } else {
        navigation.navigate(category.screen as any);
      }
    }
  };

  const renderIcon = (category: CategoryItem) => {
    const iconSize = 24;
    const iconColor = '#9DEC2C';

    if (category.iconType === 'svg' && category.SvgIcon) {
      const IconComponent = category.SvgIcon;
      return <IconComponent width={iconSize} height={iconSize} fill={iconColor} />;
    } else if (category.iconType === 'feather') {
      return <Feather name={category.icon} size={iconSize} color={iconColor} />;
    } else {
      return <MaterialCommunityIcons name={category.icon} size={iconSize} color={iconColor} />;
    }
  };

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
      </View>

      {/* Title */}
      <Text style={styles.title}>All Categories</Text>

      {/* Categories List */}
      <View style={styles.listContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                index < CATEGORIES.length - 1 && styles.categoryItemBorder
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryLeft}>
                <View style={styles.iconContainer}>
                  {renderIcon(category)}
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  categoryItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '400',
  },
});
