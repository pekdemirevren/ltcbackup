import React, { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Animated, Platform, InteractionManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutScreenStyles as styles } from '../styles/WorkoutScreenStyles';
import { ThemeContext } from '../contexts/ThemeContext';
import Theme from '../constants/theme';
import { CollectibleCardNew } from '../components/CollectibleCardNew';
import { SORTED_COLLECTIBLE_WORKOUTS, calculateOVR } from '../constants/collectibleWorkouts';
import { TimerContext } from '../contexts/TimerContext';
import { MainCardCardNew } from '../components/MainCardCardNew';
import { MAIN_CARDS } from '../constants/mainCards';
import { FlashList } from '@shopify/flash-list';
import { TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAllWorkoutLevels, getAllWorkoutXP } from '../utils/LevelSystem';

interface WorkoutScreenProps {
  navigation: any;
}

export function WorkoutScreen({ navigation }: WorkoutScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || Theme.dark;
  const timerContext = useContext(TimerContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allWorkouts, setAllWorkouts] = useState(SORTED_COLLECTIBLE_WORKOUTS);
  const [filteredWorkouts, setFilteredWorkouts] = useState(SORTED_COLLECTIBLE_WORKOUTS);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [xps, setXps] = useState<Record<string, number>>({});

  const CATEGORIES = [
    { id: 'HERO', label: 'HEROES' },
    { id: 'TITAN', label: 'TITANS' },
    { id: 'OLYMPIAN', label: 'OLYMPIANS' },
    { id: 'PRIMORDIAL', label: 'PRIMORDIAL' },
    { id: 'UNDERWORLD', label: 'UNDERWORLD' },
    { id: 'CREATURE', label: 'CREATURES' },
    { id: 'MORTAL', label: 'MORTALS' },
  ];

  const loadLevelsAndSort = async () => {
    const [levelsMap, xpMap] = await Promise.all([
      getAllWorkoutLevels(),
      getAllWorkoutXP()
    ]);

    setLevels(levelsMap);
    setXps(xpMap);

    const sorted = [...SORTED_COLLECTIBLE_WORKOUTS].sort((a, b) => {
      const levelA = levelsMap[a.id] ?? a.baseLevel;
      const levelB = levelsMap[b.id] ?? b.baseLevel;

      if (levelA !== levelB) {
        return levelA - levelB;
      }

      const ovrA = calculateOVR(a.baseStats, a.position);
      const ovrB = calculateOVR(b.baseStats, b.position);
      return ovrA - ovrB;
    });

    setAllWorkouts(sorted);

    if (searchQuery.trim() === '') {
      setFilteredWorkouts(sorted);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sorted.filter(workout =>
        workout.name.toLowerCase().includes(query) ||
        workout.subtitle?.toLowerCase().includes(query) ||
        workout.secondaryTraits?.some((trait: any) => trait.title.toLowerCase().includes(query))
      );
      setFilteredWorkouts(filtered);
    }
  };

  useEffect(() => {
    void loadLevelsAndSort();
  }, []); // Only run on mount to avoid loops, maybe add listener for updates if needed

  useFocusEffect(
    React.useCallback(() => {
      void loadLevelsAndSort();
    }, [searchQuery, selectedCategory])
  );

  useEffect(() => {
    let filtered = allWorkouts;

    if (selectedCategory) {
      filtered = filtered.filter(workout => workout.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(query) ||
        workout.subtitle?.toLowerCase().includes(query) ||
        workout.secondaryTraits?.some((trait: any) => trait.title.toLowerCase().includes(query))
      );
    }

    setFilteredWorkouts(filtered);
  }, [searchQuery, allWorkouts, selectedCategory]);

  // Header Animations
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyTitleTranslateY = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  if (!timerContext) {
    throw new Error('WorkoutScreen must be used within a TimerProvider');
  }

  // List Header Component
  const renderHeader = React.useCallback(() => (
    <View style={styles.scrollContent}>
      <View style={styles.largeTitleContainer}>
        <Text style={styles.headerTitle}>Workout Collection</Text>
      </View>

      {MAIN_CARDS.length > 0 && (
        <View style={{ marginBottom: 0 }}>
          <FlatList
            data={MAIN_CARDS}
            keyExtractor={(item) => `maincard-${item.id}`}
            renderItem={({ item }) => (
              <MainCardCardNew
                card={item}
                fullWidth={true}
              />
            )}
            contentContainerStyle={{ alignItems: 'center' }}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  ), []);

  const renderItem = React.useCallback(({ item }: { item: any }) => (
    <CollectibleCardNew
      workout={item}
      fullWidth={true}
      level={levels[item.id] ?? item.baseLevel}
      xp={xps[item.id] ?? 0}
    />
  ), [levels, xps]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={styles.header}>
        <Animated.View style={[styles.headerBlurContainer, { opacity: headerBgOpacity }]}>
          <LinearGradient
            colors={["#000", "#000", "transparent"]}
            locations={[0, 0.4, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <View style={styles.headerContent}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Animated.View style={[styles.headerCenterTitle, { opacity: stickyTitleOpacity, transform: [{ translateY: stickyTitleTranslateY }] }]} pointerEvents="none">
              <Text style={[styles.stickyTitleText, { fontSize: 16, fontWeight: 'bold' }]}>Workout Collection</Text>
            </Animated.View>
          </View>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cards..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoryScrollContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: null, label: 'ALL' }, ...CATEGORIES]}
              keyExtractor={(item) => `cat-${item.id}`}
              contentContainerStyle={styles.categoryListContent}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(item.id)}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: '#9DEC2C', borderColor: '#9DEC2C' }
                    ]}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      isSelected && { color: '#000', fontWeight: 'bold' }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Animated.View>

      <FlashList
        data={filteredWorkouts}
        keyExtractor={(item) => `collectible-${item.id}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false } // FlashList doesn't support native driver with Animated.event easily in some versions, check
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}
