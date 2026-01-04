import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, StyleSheet, Animated, PanResponder } from 'react-native';
import { getStyles } from './WorkoutScreen.styles';
import { ThemeContext } from './ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import SpeedIcon from './assets/icons/speed.jsx';

// Import all specific settings screens
import { ArmFlexSettingsScreen } from './ArmFlexSettingsScreen';
import { BicycleSettingsScreen } from './BicycleSettingsScreen';
import { DumbbellSettingsScreen } from './DumbbellSettingsScreen';
import { HandsUpSettingsScreen } from './HandsUpSettingsScreen';
import { HeartPulseSettingsScreen } from './HeartPulseSettingsScreen';
import { KettlebellSettingsScreen } from './KettlebellSettingsScreen';
import { LegPressSettingsScreen } from './LegPressSettingsScreen';
import { RunSettingsScreen } from './RunSettingsScreen';
import { WalkSettingsScreen } from './WalkSettingsScreen';
import { WeightSettingsScreen } from './WeightSettingsScreen';
import { YogaSettingsScreen } from './YogaSettingsScreen';

// Helper function to get the settings screen name
const getSettingsScreenName = (workoutName) => {
  switch (workoutName) {
    case 'Loop':
      return 'TimeSelectionScreen'; // Using TimeSelectionScreen for time settings
    case 'Lap':
      return 'LapSelectionScreen'; // Using LapSelectionScreen for lap settings
    case 'Leg Press':
      return 'LegPressSettingsScreen';
    case 'Dumbbell':
      return 'DumbbellSettingsScreen';
    case 'Arm Flex':
      return 'ArmFlexSettingsScreen';
    case 'Run':
      return 'RunSettingsScreen';
    case 'Walk':
      return 'WalkSettingsScreen';
    case 'Yoga':
      return 'YogaSettingsScreen';
    case 'Kettlebell':
      return 'KettlebellSettingsScreen';
    case 'Bicycle':
      return 'BicycleSettingsScreen';
    case 'Heart Pulse':
      return 'HeartPulseSettingsScreen';
    case 'Hands Up':
      return 'HandsUpSettingsScreen';
    case 'Weight':
      return 'WeightSettingsScreen';
    default:
      return 'SettingsScreen'; // Fallback or generic settings screen
  }
};

// Workout ID mapping for consistent storage keys
const WORKOUT_IDS = {
  'Loop': 'loop',
  'Lap': 'lap',
  'Leg Press': 'leg_press',
  'Dumbbell': 'dumbbell',
  'Arm Flex': 'arm_flex',
  'Run': 'run',
  'Walk': 'walk',
  'Yoga': 'yoga',
  'Kettlebell': 'kettlebell',
  'Bicycle': 'bicycle',
  'Heart Pulse': 'heart_pulse',
  'Hands Up': 'hands_up',
  'Weight': 'weight',
};

// Placeholder data for workouts
const allWorkouts = [
  { id: '1', name: 'Loop', icon: 'infinity', workoutId: WORKOUT_IDS['Loop'] },
  { id: '2', name: 'Lap', icon: 'timer-outline', workoutId: WORKOUT_IDS['Lap'] },
  { id: '3', name: 'Leg Press', icon: 'weight-lifter', workoutId: WORKOUT_IDS['Leg Press'] },
  { id: '4', name: 'Dumbbell', icon: 'dumbbell', workoutId: WORKOUT_IDS['Dumbbell'] },
  { id: '5', name: 'Arm Flex', icon: 'arm-flex', workoutId: WORKOUT_IDS['Arm Flex'] },
  { id: '6', name: 'Run', icon: 'run', workoutId: WORKOUT_IDS['Run'] },
  { id: '7', name: 'Walk', icon: 'walk', workoutId: WORKOUT_IDS['Walk'] },
  { id: '8', name: 'Yoga', icon: 'yoga', workoutId: WORKOUT_IDS['Yoga'] },
  { id: '9', name: 'Kettlebell', icon: 'kettlebell', workoutId: WORKOUT_IDS['Kettlebell'] },
  { id: '10', name: 'Bicycle', icon: 'bicycle', workoutId: WORKOUT_IDS['Bicycle'] },
  { id: '11', name: 'Heart Pulse', icon: 'heart-pulse', workoutId: WORKOUT_IDS['Heart Pulse'] },
  { id: '12', name: 'Hands Up', icon: 'human-handsup', workoutId: WORKOUT_IDS['Hands Up'] },
  { id: '13', name: 'Weight', icon: 'weight', workoutId: WORKOUT_IDS['Weight'] },
];

const WorkoutCard = ({ workout, styles, colors, navigation, onPlayPress, onDelete, onSave }) => {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];
  const shakeAnimY = useState(new Animated.Value(0))[0];
  const shakeAnimZ = useState(new Animated.Value(1))[0];
  const longPressTimeout = React.useRef();
  // Dairesel titreme animasyonu (iOS tarzı)
  React.useEffect(() => {
    if (isDeleteMode) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1.5, duration: 90, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1.2, duration: 110, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -0.7, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(shakeAnimY, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnimY, { toValue: -1.5, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnimY, { toValue: 0.8, duration: 110, useNativeDriver: true }),
            Animated.timing(shakeAnimY, { toValue: -0.8, duration: 90, useNativeDriver: true }),
            Animated.timing(shakeAnimY, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(shakeAnimZ, { toValue: 1.01, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnimZ, { toValue: 0.99, duration: 90, useNativeDriver: true }),
            Animated.timing(shakeAnimZ, { toValue: 1, duration: 110, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      shakeAnim.setValue(0);
      shakeAnimY.setValue(0);
      shakeAnimZ.setValue(1);
    }
  }, [isDeleteMode]);

  return (
    <View style={{ position: 'relative', minHeight: 120 }}>
      <Animated.View
        style={[styles.card, {
          backgroundColor: colors.cardBackground,
          transform: [
            { translateX: shakeAnim },
            { translateY: shakeAnimY },
            { scale: shakeAnimZ },
          ],
        }]}
        onTouchStart={() => {
          longPressTimeout.current = setTimeout(() => setIsDeleteMode(true), 500);
        }}
        onTouchEnd={() => {
          clearTimeout(longPressTimeout.current);
        }}
      >
        <View style={styles.topRow}>
          <View style={styles.iconTitleContainer}>
            {workout.name.toLowerCase().includes('speed') ? (
              <SpeedIcon width={64} height={64} color={colors.quickStart.primary} />
            ) : (
              <MaterialCommunityIcons name={workout.icon} size={['infinity', 'timer-outline'].includes(workout.icon) ? 55 : 64} color={colors.quickStart.primary} />
            )}
            <Text style={styles.cardTitle}>{workout.name}</Text>
          </View>
            <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={onPlayPress}>
              <Theme.Icons.play.lib name={Theme.Icons.play.name} size={40} color={colors.playIconText} />
            </TouchableOpacity>
        </View>
        <View style={styles.bottomRow}>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
            <TouchableOpacity style={[styles.bottomBox, { marginHorizontal: 4 }]}>
              <MaterialCommunityIcons name="shuffle-variant" size={24} color={colors.text} />
            </TouchableOpacity>
              <TouchableOpacity style={[styles.bottomBox, { marginHorizontal: 4 }]} onPress={() => {
                const settingsScreenName = getSettingsScreenName(workout.name);
                const defaultSettings = {
                  greenTime: '30',
                  redTime: '15', 
                  greenReps: '3',
                  redReps: '3',
                  greenSpeed: 1.0,
                  redSpeed: 1.0
                };
                navigation.navigate(settingsScreenName, { 
                  settings: defaultSettings, 
                  onSave, 
                  workoutId: workout.workoutId,
                  workoutName: workout.name 
                });
              }}>
                <MaterialCommunityIcons name="history" size={24} color={colors.text} />
              </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      {/* Titreme modunda sol üstte yuvarlak konteynerde (-) işareti */}
      {isDeleteMode && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            backgroundColor: '#222',
            borderRadius: 18,
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 0.8,
            borderColor: 'rgba(255,255,255,0.18)',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            zIndex: 20,
          }}
          onPress={() => {
            setIsDeleteMode(false);
            if (onDelete) onDelete(workout);
          }}
        >
          <MaterialCommunityIcons name="minus" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Titreme modundan çıkmak için boş alana dokun */}
      {isDeleteMode && (
        <TouchableOpacity
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5 }}
          onPress={() => setIsDeleteMode(false)}
        />
      )}
    </View>
  );
};

export function WorkoutScreen({ navigation, startTimerWithSettings, onSave }) {
  const { colors } = useContext(ThemeContext);
  const styles = getStyles(colors);

  // Ana ekranda gösterilecek kartlar (ilk 4)
  const [mainCards, setMainCards] = useState(
    allWorkouts.slice(0, 4)
  );
  // Modalda gösterilecek kartlar (alfabetik)
  const [modalCards, setModalCards] = useState(
    allWorkouts.slice(4).sort((a, b) => a.name.localeCompare(b.name))
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddCard = (card) => {
    setMainCards([...mainCards, card]);
    setModalCards(modalCards.filter(c => c.id !== card.id));
    setModalVisible(false);
  };
  const handleDeleteCard = (card) => {
    // Remove from mainCards, add to modalCards (sorted)
    setMainCards(prev => prev.filter(c => c.id !== card.id));
    setModalCards(prev => [...prev, card].sort((a, b) => a.name.localeCompare(b.name)));
  };

  // Scroll state for plus icon visibility
  const [showPlus, setShowPlus] = useState(false);
  const handleScroll = (e) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    setShowPlus(layoutMeasurement.height + contentOffset.y >= contentSize.height - 10);
  };

  // Modal cards always alphabetically sorted
  const sortedModalCards = [...modalCards].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Workout</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} onScroll={handleScroll} scrollEventThrottle={16}>
        {mainCards.map((workout, idx) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            styles={styles}
            colors={colors}
            navigation={navigation}
            onPlayPress={workout.id === '2' ? () => navigation.navigate('Settings') : undefined}
            onDelete={handleDeleteCard}
            onSave={onSave}
          />
        ))}
        {/* Plus icon just below last card, only visible when scrolled to bottom */}
        {showPlus && (
          <TouchableOpacity
            style={{
              marginTop: 24,
              alignSelf: 'center',
              backgroundColor: '#1B1C1E',
              borderRadius: 23,
              width: 47,
              height: 47,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 4,
            }}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={32} color={colors.quickStart.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* Modal with pure black background, grouped cards, styled containers */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' }}>
    <View style={{ backgroundColor: '#1B1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 320, marginTop: 48 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ height: 12 }} />
              <View style={{ position: 'absolute', left: 16, top: 12, zIndex: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#222',
                    borderRadius: 22,
                    width: 44,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: -16,
                    marginTop: -8,
                    borderWidth: 0.8,
                    borderColor: 'rgba(255,255,255,0.18)',
                  }}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialCommunityIcons name="close" size={28.8} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8, justifyContent: 'center' }}>
                <Text style={{ color: '#e5e5e5', fontSize: 19, fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center' }}>Add Workout</Text>
              </View>
              {/* 'Tüm Kartlar' başlığı kaldırıldı */}
              {/* Group cards by first letter */}
              {(() => {
                const grouped = {};
                sortedModalCards.forEach(card => {
                  const letter = card.name[0].toUpperCase();
                  if (!grouped[letter]) grouped[letter] = [];
                  grouped[letter].push(card);
                });
                return Object.keys(grouped).sort().map(letter => (
                  <View key={letter} style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#98989F', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{letter}</Text>
                    {grouped[letter].map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#2C2C2E',
                          borderRadius: 26,
                          marginHorizontal: 6,
                          marginTop: 12,
                          marginBottom: 8,
                          paddingVertical: 20.25,
                          paddingHorizontal: 18,
                          shadowColor: '#000',
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                        }}
                        onPress={() => handleAddCard(item)}
                      >
                        {item.name.toLowerCase().includes('speed') ? (
                          <SpeedIcon width={20.3} height={20.3} color="#699518" />
                        ) : (
                          <MaterialCommunityIcons name={item.icon} size={20.3} color="#699518" />
                        )}
                        <Text style={{ fontSize: 17, marginLeft: 10, color: '#98989F', fontWeight: '500' }}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ));
              })()}
              {/* Empty state */}
              {sortedModalCards.length === 0 && (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>Eklenebilir kart yok</Text>
              )}
              {/* Kapat butonu kaldırıldı, sol üstte X ikonu var */}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
