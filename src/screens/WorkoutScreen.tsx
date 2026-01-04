import React, { useContext, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutScreenStyles as styles } from '../styles/WorkoutScreenStyles';
import { ThemeContext } from '../contexts/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Theme from '../constants/theme';
import { WorkoutCard } from '../components/WorkoutCard';
import { getSettingsScreenName } from '../constants/WorkoutConstants';
import { allWorkouts, Workout } from '../constants/workoutData';
import { TimerContext } from '../contexts/TimerContext';
import { WorkoutAnimationKey } from '../animations/workoutAnimations';
import { useFocusEffect } from '@react-navigation/native';
import { LAST_ACTIVITY_WORKOUT_ID_KEY } from '../utils/WorkoutSettingsManager';

function getAnimationKeyForWorkout(workout: Workout): WorkoutAnimationKey {
  const name = workout.name.toLowerCase();
  if (name.includes('leg press')) return 'leg-press';
  return 'default';
}

interface WorkoutScreenProps {
  navigation: any;
}

const QUICK_START_STORAGE_KEY = '@workout_quick_start_cards';

export function WorkoutScreen({ navigation }: WorkoutScreenProps) {
  const { colors } = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!timerContext) {
    throw new Error('WorkoutScreen must be used within a TimerProvider');
  }

  const [mainCards, setMainCards] = useState<Workout[]>(allWorkouts.slice(0, 6));
  const [modalCards, setModalCards] = useState<Workout[]>(
    allWorkouts.slice(6).sort((a, b) => a.name.localeCompare(b.name))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlus, setShowPlus] = useState(false);

  // Load and reorder cards when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAndReorderCards();
    }, [])
  );

  // Save quick start cards whenever they change
  React.useEffect(() => {
    saveQuickStartCards();
    console.log('📦 Main cards updated:', mainCards.map(c => c.name));
  }, [mainCards]);

  const loadAndReorderCards = async () => {
    try {
      const stored = await AsyncStorage.getItem(QUICK_START_STORAGE_KEY);
      let loadedCards: Workout[] = allWorkouts.slice(0, 6); // Default cards

      if (stored) {
        const cardIds: string[] = JSON.parse(stored);
        const cardsFromStorage = cardIds.map(id => allWorkouts.find(w => w.workoutId === id)).filter(Boolean) as Workout[];
        if (cardsFromStorage.length > 0) {
          loadedCards = cardsFromStorage;
        }
      }

      const lastActivityId = await AsyncStorage.getItem(LAST_ACTIVITY_WORKOUT_ID_KEY);
      if (lastActivityId) {
        const lastUsedCard = loadedCards.find(c => c.workoutId === lastActivityId);
        if (lastUsedCard) {
          loadedCards = [lastUsedCard, ...loadedCards.filter(c => c.workoutId !== lastActivityId)];
        }
      }

      setMainCards(loadedCards);
      const mainCardIds = new Set(loadedCards.map(c => c.workoutId));
      const remainingCards = allWorkouts.filter(w => !mainCardIds.has(w.workoutId));
      setModalCards(remainingCards.sort((a, b) => a.name.localeCompare(b.name)));
      console.log('✅ Loaded and reordered quick start cards');

    } catch (error) {
      console.error('❌ Error loading and reordering quick start cards:', error);
    }
  };

  const saveQuickStartCards = async () => {
    try {
      const cardIds = mainCards.map(c => c.workoutId);
      await AsyncStorage.setItem(QUICK_START_STORAGE_KEY, JSON.stringify(cardIds));
    } catch (error) {
      console.error('❌ Error saving quick start cards:', error);
    }
  };

  const handleAddCard = (card: Workout) => {
    console.log('➕ Adding card:', card.name, card.id);
    setMainCards(prev => {
      if (prev.find(c => c.id === card.id)) {
        console.log('⚠️ Card already exists in main cards');
        return prev;
      }
      return [...prev, card];
    });
    setModalCards(prev => prev.filter(c => c.id !== card.id));
    setModalVisible(false);
  };

  const handleDeleteCard = (card: Workout) => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete ${card.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log('🗑️ Deleting card:', card.name, card.id);
            setMainCards(prev => prev.filter(c => c.id !== card.id));
            setModalCards(prev => {
              if (prev.find(c => c.id === card.id)) {
                return prev;
              }
              return [...prev, card].sort((a, b) => a.name.localeCompare(b.name));
            });
          }
        }
      ]
    );
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setShowPlus(isCloseToBottom);
  };

  const handlePlayPress = (workout: Workout) => {
    console.log('🎯 CLICKED:', workout.name, workout.id);

    // Treat all workouts as standard workouts with saved settings.
    // This fixes the issue where the first workout (T-bar row, id='1') was wrongly treated as Infinite Loop
    // and ensures the workout name is passed correctly for GIF resolution.
    console.log('⏱️ Timer starting:', workout.id, workout.name);
    timerContext.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
  };

  const sortedModalCards = [...modalCards].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.headerTitle}>Workout</Text>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {mainCards.map((workout) => (
          <WorkoutCard
            key={`main-${workout.id}`}
            workout={workout}
            styles={styles}
            onPlayPress={() => handlePlayPress(workout)}
            onDelete={handleDeleteCard}
          />
        ))}

        {showPlus && (
          <TouchableOpacity
            style={{
              alignSelf: 'center',
              marginTop: 10,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.quickStart?.primary || '#9DEC2C',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 15 }}>
              Add Workout
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {(() => {
              const grouped: { [key: string]: Workout[] } = {};
              sortedModalCards.forEach(card => {
                const letter = card.name[0].toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(card);
              });

              return Object.keys(grouped).sort().map(letter => (
                <View key={letter} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
                    {letter}
                  </Text>
                  {grouped[letter].map(item => (
                    <TouchableOpacity
                      key={`modal-${item.id}`}
                      onPress={() => handleAddCard(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 15,
                        backgroundColor: colors.cardBackground,
                        borderRadius: 12,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ width: 30, height: 30, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                        <item.SvgIcon width={30} height={30} fill="#9DEC2C" />
                      </View>
                      <Text style={{ fontSize: 16, color: colors.text, marginLeft: 15 }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ));
            })()}

            {sortedModalCards.length === 0 && (
              <Text style={{ textAlign: 'center', color: colors.text, marginTop: 40 }}>
                Eklenebilir kart yok
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
