// BottomTabBar.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import SummaryIcon from './assets/icons/SummaryIcon';
import WorkoutIcon from './assets/icons/WorkoutIcon';
import SharingIcon from './assets/icons/SharingIcon';
// import LiquidBubble from './LiquidBubble'; // Import the new component

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 60;
const INNER_PADDING = 4;
const BAR_WIDTH = SCREEN_WIDTH - PADDING * 2;
const TAB_WIDTH = (BAR_WIDTH - INNER_PADDING * 2) / 3;
const BUBBLE_HEIGHT = 52;
const BUBBLE_BORDER_RADIUS = 26;

const Tab = ({ tab, index, selectedIndex, onTabPress, translateX }) => {
  const { Icon, id, label } = tab;

  const animatedIconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value - index * TAB_WIDTH);
    const scale = interpolate(
      distance,
      [0, TAB_WIDTH],
      [1.1, 1],
      Extrapolate.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value - index * TAB_WIDTH);
    const color = interpolateColor(
      distance,
      [0, TAB_WIDTH / 2, TAB_WIDTH],
      ['#AAEC2C', 'rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.7)']
    );
    return { color };
  });

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onTabPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
        <Icon
          width={24}
          height={24}
          color={selectedIndex === index ? '#AAEC2C' : '#FFFFFF'}
        />
        <Animated.Text style={[styles.label, animatedLabelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const BottomTabBar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'summary', label: 'Summary', Icon: SummaryIcon },
    { id: 'workout', label: 'Workout', Icon: WorkoutIcon },
    { id: 'sharing', label: 'Sharing', Icon: SharingIcon },
  ];

  const [selectedIndex, setSelectedIndex] = useState(1);

  const translateX = useSharedValue(TAB_WIDTH);
  const offset = useSharedValue(0);

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    if (index !== -1) {
      setSelectedIndex(index);
      const targetTranslateX = index * TAB_WIDTH;
      translateX.value = withSpring(targetTranslateX, {
        damping: 25,
        stiffness: 140,
      });
      offset.value = targetTranslateX;
    }
  }, [activeTab]);

  const handlePanEnd = (finalIndex) => {
    if (finalIndex !== selectedIndex) {
      setSelectedIndex(finalIndex);
      onTabPress(tabs[finalIndex].id);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      offset.value = translateX.value;
    })
    .onUpdate((event) => {
      const newPos = offset.value + event.translationX;
      const clampedPos = Math.max(0, Math.min(newPos, TAB_WIDTH * 2));
      translateX.value = clampedPos;
    })
    .onEnd(() => {
      const closestIndex = Math.round(translateX.value / TAB_WIDTH);
      const finalIndex = Math.max(0, Math.min(closestIndex, 2));
      const finalTranslateX = finalIndex * TAB_WIDTH;
      translateX.value = withSpring(finalTranslateX, {
        damping: 25,
        stiffness: 140,
      });
      offset.value = finalTranslateX;
      runOnJS(handlePanEnd)(finalIndex);
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <BlurView intensity={26} tint="dark" style={styles.blurContainer}>
          {/* <LiquidBubble
            translateX={translateX}
            tabWidth={TAB_WIDTH}
            bubbleHeight={BUBBLE_HEIGHT}
            bubbleBorderRadius={BUBBLE_BORDER_RADIUS}
          /> */}
          <View style={styles.tabContainer}>
            {tabs.map((tab, index) => (
              <Tab
                key={tab.id}
                tab={tab}
                index={index}
                selectedIndex={selectedIndex}
                translateX={translateX}
                onTabPress={() => {
                  setSelectedIndex(index);
                  onTabPress(tab.id);
                  const targetTranslateX = index * TAB_WIDTH;
                  translateX.value = withSpring(targetTranslateX, {
                    damping: 25,
                    stiffness: 140,
                  });
                  offset.value = targetTranslateX;
                }}
              />
            ))}
          </View>
        </BlurView>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: PADDING,
    right: PADDING,
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    height: 64,
    position: 'relative',
    paddingVertical: INNER_PADDING,
    paddingHorizontal: INNER_PADDING,
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  tab: {
    width: TAB_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: -0.2,
  },
});

export default BottomTabBar;