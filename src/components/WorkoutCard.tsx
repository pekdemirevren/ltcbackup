import React, { useContext, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated as RNAnimated, StyleSheet } from 'react-native';
import { BlurView } from "@react-native-community/blur";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import Theme from '../constants/theme';
import { ThemeContext, ThemeContextType } from '../contexts/ThemeContext';
import { Workout } from '../constants/workoutData';
import { collectibleWorkouts } from '../constants/collectibleWorkouts';
import { getStatsWithBoostV2 } from '../utils/collectibleStatEngine';
import SummaryIcon from '../assets/icons/SummaryIcon';
import { FUTShield } from './FUTShield';

interface WorkoutCardProps {
  workout: Workout;
  styles: any;
  onPlayPress: () => void;
  onDelete: (workout: Workout) => void;
}

const CardRightActions = ({
  progress,
  dragX,
  onDeepSwipeStatus,
  onDeletePress,
}: {
  progress: any;
  dragX: any;
  onDeepSwipeStatus: (isDeep: boolean) => void;
  onDeletePress: () => void;
}) => {
  const BUTTON_SIZE = 56;

  useEffect(() => {
    const listenerId = progress.addListener(({ value }: { value: number }) => {
      if (value > 2.5) {
        onDeepSwipeStatus(true);
      } else if (value < 0.5) {
        onDeepSwipeStatus(false);
      }
    });
    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress, onDeepSwipeStatus]);

  const leftCapTranslateX = dragX.interpolate({
    inputRange: [-400, -80, 0],
    outputRange: [-320, 0, 0],
    extrapolate: 'clamp',
  });

  const circleScale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bodyScaleX = dragX.interpolate({
    inputRange: [-400, -80],
    outputRange: [320, 0],
    extrapolate: 'clamp',
  });

  const bodyTranslateX = dragX.interpolate({
    inputRange: [-400, -80],
    outputRange: [-160, 0],
    extrapolate: 'clamp',
  });

  const rightCapOpacity = dragX.interpolate({
    inputRange: [-85, -80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const iconScale = dragX.interpolate({
    inputRange: [-150, -80, 0],
    outputRange: [1.2, 1, 0.5],
    extrapolate: 'clamp',
  });

  const iconTranslateX = dragX.interpolate({
    inputRange: [-400, -80, 0],
    outputRange: [130, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{
        width: 80,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 10,
      }}
    >
      <View style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}>

        {/* Right Cap (Stationary Base) */}
        <RNAnimated.View
          style={{
            position: 'absolute',
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            backgroundColor: '#FF3B30',
            opacity: rightCapOpacity,
          }}
        />

        {/* Body (The Filler) */}
        <RNAnimated.View
          style={{
            position: 'absolute',
            height: BUTTON_SIZE,
            width: 1,
            backgroundColor: '#FF3B30',
            transform: [
              { translateX: bodyTranslateX },
              { scaleX: bodyScaleX }
            ],
            zIndex: 1,
          }}
        />

        {/* Left Cap (The Moving Head with Icon) */}
        <RNAnimated.View
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            backgroundColor: '#FF3B30',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
              { translateX: leftCapTranslateX },
              { scale: circleScale }
            ],
            zIndex: 2,
          }}
        >
          <TouchableOpacity
            onPress={onDeletePress}
            activeOpacity={0.7}
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <RNAnimated.View style={{ transform: [{ scale: iconScale }, { translateX: iconTranslateX }] }}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="white" />
            </RNAnimated.View>
          </TouchableOpacity>
        </RNAnimated.View>
      </View>
    </View>
  );
};

export const WorkoutCard: React.FC<WorkoutCardProps> = React.memo(({ workout, styles, onPlayPress, onDelete }) => {
  const { colors } = useContext(ThemeContext) as ThemeContextType;
  const navigation = useNavigation<any>();
  const deepSwipeTriggered = useRef(false);
  const swipeableRef = useRef<Swipeable>(null);

  // Fetch collectible data for stats
  const collectible = collectibleWorkouts.find(cw => cw.id === workout.workoutId);
  const stats = collectible ? getStatsWithBoostV2(collectible.baseStats, collectible.baseLevel, collectible.position) : null;

  return (
    <View style={{ marginBottom: 10 }}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={(progress, dragX) => (
          <CardRightActions
            progress={progress}
            dragX={dragX}
            onDeepSwipeStatus={(isDeep) => {
              deepSwipeTriggered.current = isDeep;
            }}
            onDeletePress={() => onDelete(workout)}
          />
        )}
        rightThreshold={40}
        overshootRight={true}
        friction={1.25}
        useNativeAnimations={false}
        onSwipeableOpen={() => {
          if (deepSwipeTriggered.current) {
            swipeableRef.current?.close();
            onDelete(workout);
            deepSwipeTriggered.current = false;
          }
        }}
      >
        <FUTShield
          width={styles.card.width || 360}
          height={styles.card.height || 260}
          fill="#1C1C1E"
          stroke="transparent"
          strokeWidth={0}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: 'transparent',
                overflow: 'hidden',
                borderWidth: 0,
              }
            ]}
          >
            <View style={styles.topRow}>
              <View style={{ width: 55, height: 55, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <workout.SvgIcon width={55} height={55} fill="#FFFFFF" />
              </View>
              <TouchableOpacity
                style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]}
                onPress={onPlayPress}
              >
                <Theme.Icons.play.lib width={34} height={34} color={colors.playIconText} />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSection}>
              <Text style={styles.cardTitle}>{workout.name.toUpperCase()}</Text>

              {stats && (
                <View style={cardStyles.statsRow}>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.STR}</Text>
                    <Text style={cardStyles.statLabel}>STR</Text>
                  </View>
                  <Text style={cardStyles.statDivider}>/</Text>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.VOL}</Text>
                    <Text style={cardStyles.statLabel}>VOL</Text>
                  </View>
                  <Text style={cardStyles.statDivider}>/</Text>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.TMP}</Text>
                    <Text style={cardStyles.statLabel}>TMP</Text>
                  </View>
                  <Text style={cardStyles.statDivider}>/</Text>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.END}</Text>
                    <Text style={cardStyles.statLabel}>END</Text>
                  </View>
                  <Text style={cardStyles.statDivider}>/</Text>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.PHY}</Text>
                    <Text style={cardStyles.statLabel}>PHY</Text>
                  </View>
                  <Text style={cardStyles.statDivider}>/</Text>
                  <View style={cardStyles.inlineStatItem}>
                    <Text style={cardStyles.statValue}>{stats.HYP}</Text>
                    <Text style={cardStyles.statLabel}>HYP</Text>
                  </View>
                </View>
              )}

              <View style={styles.bottomButtonsWrapper}>
                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => navigation.navigate('WorkoutSummaryScreen', {
                    workoutId: workout.workoutId,
                    workoutName: workout.name
                  })}
                >
                  <SummaryIcon size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomButton}
                  onPress={() => {
                    navigation.navigate('GenericWorkoutSettingsScreen', {
                      workoutId: workout.workoutId,
                      workoutName: workout.name
                    });
                  }}
                >
                  <MaterialCommunityIcons name="cog" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FUTShield>
      </Swipeable>
    </View >
  );
});

const cardStyles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.9,
    justifyContent: 'center',
    width: '100%',
  },
  inlineStatItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  statDivider: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.2,
    marginHorizontal: 4,
  },
});

export default WorkoutCard;
