import React, { useContext, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated as RNAnimated, StyleSheet } from 'react-native';
import { BlurView } from "@react-native-community/blur";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import Theme from '../constants/theme';
import { ThemeContext, ThemeContextType } from '../contexts/ThemeContext';
import { Workout } from '../constants/workoutData';
import SummaryIcon from '../assets/icons/SummaryIcon';

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              overflow: 'hidden',
            }
          ]}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor={colors.cardBackground}
          />
          <View style={styles.topRow}>
            <View style={{ width: 55, height: 55, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <workout.SvgIcon width={55} height={55} fill="#9DEC2C" />
            </View>
            <TouchableOpacity
              style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]}
              onPress={onPlayPress}
            >
              <Theme.Icons.play.lib width={34} height={34} color={colors.playIconText} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.cardTitle}>{workout.name}</Text>
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
      </Swipeable>
    </View>
  );
});
