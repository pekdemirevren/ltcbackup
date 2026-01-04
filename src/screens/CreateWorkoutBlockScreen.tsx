import React, { useContext, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';

import { RootStackParamList } from '../navigation/RootNavigator';
import Theme from '../constants/theme';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import SpeedIcon from '../assets/icons/speed';

type CreateWorkoutBlockScreenProps = StackScreenProps<RootStackParamList, 'CreateWorkoutBlockScreen'>;

export function CreateWorkoutBlockScreen({ route, navigation }: CreateWorkoutBlockScreenProps) {
  const { workoutId, type } = route.params;
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext || !timerContext) {
    throw new Error('CreateWorkoutBlockScreen must be used within Providers');
  }
  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, startInfiniteLoopWithSpeed, setGreenTime, setRedTime, setGreenCountdownSpeed, setRedCountdownSpeed, setGreenReps, setRedReps } = timerContext;

  const styles = getCardButtonPickerStyles(false);

  // State for all types
  const [loopTime, setLoopTime] = useState('15');
  const [loopSpeed, setLoopSpeed] = useState(1);
  
  const [greenTime, setLocalGreenTime] = useState('30');
  const [redTime, setLocalRedTime] = useState('15');
  
  const [greenSpeed, setLocalGreenSpeed] = useState(1);
  const [redSpeed, setLocalRedSpeed] = useState(1);
  
  const [greenReps, setLocalGreenReps] = useState('3');
  const [redReps, setLocalRedReps] = useState('3');
  const [weight, setWeight] = useState('75');

  // Animation refs
  const picker1Height = useRef(new Animated.Value(0)).current;
  const picker2Height = useRef(new Animated.Value(0)).current;
  const [isPicker1Visible, setIsPicker1Visible] = useState(false);
  const [isPicker2Visible, setIsPicker2Visible] = useState(false);

  const togglePicker = (pickerRef: Animated.Value, isVisible: boolean, setVisible: (v: boolean) => void, otherPickerRef?: Animated.Value, setOtherVisible?: (v: boolean) => void) => {
    const newVisible = !isVisible;
    setVisible(newVisible);
    
    if (newVisible && otherPickerRef && setOtherVisible) {
        setOtherVisible(false);
        Animated.timing(otherPickerRef, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }

    Animated.timing(pickerRef, {
      toValue: newVisible ? 200 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const handleSave = async () => {
    if (!workoutId) return;
    
    const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
    const current = await loadWorkoutSettings(workoutId);
    
    let newBlock: any = {
        id: Date.now().toString() + Math.random().toString(),
        type: type,
        settings: {}
    };

    if (type === 'loop') {
        newBlock.settings = { infiniteLoopTime: loopTime, infiniteSpeed: loopSpeed * 1000 };
    } else if (type === 'time') {
        newBlock.settings = { greenTime: greenTime, restTime: redTime };
    } else if (type === 'speed') {
        newBlock.settings = { greenCountdownSpeed: greenSpeed * 1000, redCountdownSpeed: redSpeed * 1000 };
    } else if (type === 'lap') {
        newBlock.settings = { greenReps: parseInt(greenReps), redReps: parseInt(redReps) };
    } else if (type === 'weight') {
        newBlock.settings = { weight: weight };
    }

    const updatedBlocks = [...(current.customBlocks || []), newBlock];
    await saveWorkoutSettings({ ...current, customBlocks: updatedBlocks });
    navigation.goBack();
  };

  const handleStart = () => {
    if (type === 'loop') {
        startInfiniteLoopWithSpeed({ time: loopTime, speed: loopSpeed }, { workoutId });
    } else if (type === 'weight') {
        // Update context and start
        if (type === 'time') {
            setGreenTime(greenTime);
            setRedTime(redTime);
        } else if (type === 'speed') {
            setGreenCountdownSpeed(greenSpeed * 1000);
            setRedCountdownSpeed(redSpeed * 1000);
        } else if (type === 'lap') {
            setGreenReps(greenReps);
            setRedReps(redReps);
        }
        startTimerWithCurrentSettings(true);
    }
  };

  const renderContent = () => {
    switch (type) {
        case 'loop':
            return (
                <>
                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker1Height, isPicker1Visible, setIsPicker1Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><Theme.Icons.infinity.lib width={32} height={32} color={colors.quickStart.primary} /></View>
                        <Text style={styles.cardTitle}>Loop Time</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{loopTime}sec</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker1Height, overflow: 'hidden' }}>
                        <Picker selectedValue={loopTime} onValueChange={setLoopTime} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 60 }, (_, i) => (i + 1).toString()).map(v => <Picker.Item key={v} label={`${v} sec`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>
                </>
            );
        case 'time':
            return (
                <>
                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker1Height, isPicker1Visible, setIsPicker1Visible, picker2Height, setIsPicker2Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><Theme.Icons.time.lib width={32} height={32} color={colors.time.primary} /></View>
                        <Text style={styles.cardTitle}>Reps Time</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{greenTime}sec</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker1Height, overflow: 'hidden' }}>
                        <Picker selectedValue={greenTime} onValueChange={setLocalGreenTime} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 60 }, (_, i) => (i + 1).toString()).map(v => <Picker.Item key={v} label={`${v} sec`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>

                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker2Height, isPicker2Visible, setIsPicker2Visible, picker1Height, setIsPicker1Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><Theme.Icons.time.lib width={32} height={32} color={colors.time.primary} /></View>
                        <Text style={styles.cardTitle}>Rest Time</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{redTime}sec</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker2Height, overflow: 'hidden' }}>
                        <Picker selectedValue={redTime} onValueChange={setLocalRedTime} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 60 }, (_, i) => (i + 1).toString()).map(v => <Picker.Item key={v} label={`${v} sec`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>
                </>
            );
        case 'speed':
            return (
                <>
                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker1Height, isPicker1Visible, setIsPicker1Visible, picker2Height, setIsPicker2Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><SpeedIcon width={32} height={32} color={colors.speed.primary} /></View>
                        <Text style={styles.cardTitle}>Reps Speed</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{greenSpeed.toFixed(1)}s</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker1Height, overflow: 'hidden' }}>
                        <Picker selectedValue={greenSpeed.toFixed(1)} onValueChange={(v) => setLocalGreenSpeed(parseFloat(v))} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 50 }, (_, i) => ((i + 1) / 10).toFixed(1)).map(v => <Picker.Item key={v} label={`${v} s`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>

                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker2Height, isPicker2Visible, setIsPicker2Visible, picker1Height, setIsPicker1Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><SpeedIcon width={32} height={32} color={colors.speed.primary} /></View>
                        <Text style={styles.cardTitle}>Rest Speed</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{redSpeed.toFixed(1)}s</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker2Height, overflow: 'hidden' }}>
                        <Picker selectedValue={redSpeed.toFixed(1)} onValueChange={(v) => setLocalRedSpeed(parseFloat(v))} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 50 }, (_, i) => ((i + 1) / 10).toFixed(1)).map(v => <Picker.Item key={v} label={`${v} s`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>
                </>
            );
        case 'lap':
            return (
                <>
                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker1Height, isPicker1Visible, setIsPicker1Visible, picker2Height, setIsPicker2Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><Theme.Icons.lap.lib width={32} height={32} color={colors.lap.primary} /></View>
                        <Text style={styles.cardTitle}>Workout Sets</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{greenReps}</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker1Height, overflow: 'hidden' }}>
                        <Picker selectedValue={greenReps} onValueChange={setLocalGreenReps} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 50 }, (_, i) => (i + 1).toString()).map(v => <Picker.Item key={v} label={`${v} times`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>

                    <TouchableOpacity style={[styles.card, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }]} onPress={() => togglePicker(picker2Height, isPicker2Visible, setIsPicker2Visible, picker1Height, setIsPicker1Visible)} activeOpacity={0.8}>
                        <BlurView style={StyleSheet.absoluteFill} blurType="thinMaterialDark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                        <View style={styles.iconContainer}><Theme.Icons.lap.lib width={32} height={32} color={colors.lap.primary} /></View>
                        <Text style={styles.cardTitle}>Reps</Text>
                        <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}><Text style={styles.valueText}>{redReps}</Text></View>
                    </TouchableOpacity>
                    <Animated.View style={{ height: picker2Height, overflow: 'hidden' }}>
                        <Picker selectedValue={redReps} onValueChange={setLocalRedReps} style={{ color: 'white' }} dropdownIconColor="white">
                            {Array.from({ length: 50 }, (_, i) => (i + 1).toString()).map(v => <Picker.Item key={v} label={`${v} times`} value={v} color="white" />)}
                        </Picker>
                    </Animated.View>
                </>
            );
    }
  };

  const getTitle = () => {
      switch(type) {
          case 'loop': return 'Loop Goal';
          case 'time': return 'Time Goal';
          case 'speed': return 'Speed Goal';
          case 'lap': return 'Set/Rep Goal';
          default: return 'Goal';
      }
  };

  const getPrimaryColor = () => {
      switch(type) {
          case 'loop': return colors.quickStart.primary;
          case 'time': return colors.time.primary;
          case 'speed': return colors.speed.primary;
          case 'lap': return colors.lap.primary;
          default: return colors.primary;
      }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib width={32} height={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Top Check Button */}
      <View style={{ position: 'absolute', top: 50, right: 24, zIndex: 10 }}>
        <TouchableOpacity
          onPress={handleSave}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: getPrimaryColor(),
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <MaterialCommunityIcons name="check" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}

        {/* Start Workout Button */}
        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: getPrimaryColor(), height: 50 }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
