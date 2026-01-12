import React, { useState, useContext, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import PlusIcon from '../assets/icons/PlusIcon';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient'; // Changed from expo-linear-gradient
import Theme from '../constants/theme';
import { SettingsScreenStyles as styles } from '../styles/SettingsScreenStyles'; // Changed import and alias
import { ThemeContext } from "../contexts/ThemeContext";
import SpeedIcon from '../assets/icons/speed'; // Imported SpeedIcon
import { TimerContext } from "../contexts/TimerContext";
import WallpaperPicker from '../components/WallpaperPicker';

interface SettingsScreenProps {
  navigation: any; // React Navigation prop
  onBack?: () => void;
  onSave?: (settings: any) => void;
  onQuickStart: (navigation: any) => void;
  startTimerWithCurrentSettings?: (isCustomWorkout?: boolean) => void;
  onGreenTimeChange?: (value: string) => void;
  onRedTimeChange?: (value: string) => void;
  onGreenSpeedChange?: (value: number) => void; // Assuming speed is a number
  onRedSpeedChange?: (value: number) => void; // Assuming speed is a number
  onGreenRepsChange?: (value: string) => void;
  onRedRepsChange?: (value: string) => void;
  onResetGreenTime?: () => void;
  onResetRedTime?: () => void;
  onResetElapsedTime?: () => void;
  totalGreenTime?: number;
  totalRedTime?: number;
  totalElapsedTime?: number;
  currentGreenCountdownSpeed?: number;
  currentRedCountdownSpeed?: number;
  currentGreenReps?: string; // Assuming string based on usage
  currentRedReps?: string; // Assuming string based on usage
  currentGreenTime?: string; // Assuming string based on usage
  currentRedTime?: string; // Assuming string based on usage
  currentInfiniteLoopTime?: string; // Assuming string based on usage
  currentInfiniteSpeed?: number; // Assuming number
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
  onBack = () => { },
  onSave = () => { },
  onQuickStart,
  startTimerWithCurrentSettings = () => { },
  onGreenTimeChange,
  onRedTimeChange,
  onGreenSpeedChange,
  onRedSpeedChange,
  onGreenRepsChange,
  onRedRepsChange,
  onResetGreenTime,
  onResetRedTime,
  onResetElapsedTime,
  totalGreenTime: propTotalGreenTime,
  totalRedTime: propTotalRedTime,
  totalElapsedTime: propTotalElapsedTime,
  currentGreenCountdownSpeed: propGreenCountdownSpeed,
  currentRedCountdownSpeed: propRedCountdownSpeed,
  currentGreenReps: propGreenReps,
  currentRedReps: propRedReps,
  currentGreenTime: propGreenTime,
  currentRedTime: propRedTime,
  currentInfiniteLoopTime: propInfiniteLoopTime,
  currentInfiniteSpeed: propInfiniteSpeed,
}) => {
  // All callbacks are received as props
  const handleQuickStart = onQuickStart;

  // Other callbacks are received as props
  const setGreenTime = onGreenTimeChange;
  const setRestTime = onRedTimeChange;
  const setGreenCountdownSpeed = onGreenSpeedChange;
  const setRedCountdownSpeed = onRedSpeedChange;
  const setGreenReps = onGreenRepsChange;
  const setRedReps = onRedRepsChange;
  const resetGreenTime = onResetGreenTime;
  const resetRedTime = onResetRedTime;
  const resetElapsedTime = onResetElapsedTime;

  // Get values from props
  const totalGreenTime = propTotalGreenTime;
  const totalRedTime = propTotalRedTime;
  const totalElapsedTime = propTotalElapsedTime;
  const currentGreenCountdownSpeed = propGreenCountdownSpeed;
  const currentRedCountdownSpeed = propRedCountdownSpeed;
  const currentGreenReps = propGreenReps;
  const currentRedReps = propRedReps;
  const currentGreenTime = propGreenTime;
  const currentRedTime = propRedTime;
  const currentInfiniteLoopTime = propInfiniteLoopTime;
  const currentInfiniteSpeed = propInfiniteSpeed ? propInfiniteSpeed / 1000 : 1; // Convert ms to s

  // Use ThemeContext for colors
  const { colors } = useContext(ThemeContext)!;
  // Use TimerContext for wallpaper
  const { wallpaper, setWallpaperWithStorage } = useContext(TimerContext)!;
  // styles is imported directly from SettingsScreenStyles.ts

  // --- DRAFT STATES ---
  // Create this screen's own temporary state using props from App.js.
  // We are not maintaining separate state for Loop, directly using prop.
  const [localGreenTime, setLocalGreenTime] = useState(currentGreenTime || '30');
  const [localRedTime, setLocalRedTime] = useState(currentRedTime || '30');
  const [localGreenReps, setLocalGreenReps] = useState(String(currentGreenReps || '3')); // Initialize as String
  const [localRedReps, setLocalRedReps] = useState(String(currentRedReps || '3')); // Initialize as String
  const [greenSpeed, setGreenSpeed] = useState((currentGreenCountdownSpeed || 1000) / 1000); // Convert to seconds
  const [redSpeed, setRedSpeed] = useState((currentRedCountdownSpeed || 1000) / 1000); // Convert to seconds

  // Update this screen's own state when props from App.js change.
  // This ensures values appear correctly when returning from sub-pages.
  useEffect(() => {
    setLocalGreenTime(currentGreenTime || '30');
    setLocalRedTime(currentRedTime || '30');
    setLocalGreenReps(String(currentGreenReps || '3'));
    setLocalRedReps(String(currentRedReps || '3'));
    setGreenSpeed((currentGreenCountdownSpeed || 1000) / 1000);
    setRedSpeed((currentRedCountdownSpeed || 1000) / 1000);
  }, [currentGreenTime, currentRedTime, currentGreenReps, currentRedReps, currentGreenCountdownSpeed, currentRedCountdownSpeed]);

  // Manages back button functionality.
  const handleBack = () => {
    // If we are in the main menu, call React Navigation's back function.
    onBack();
  };

  const handleSave = () => {
    // Collect "draft" settings modified on this screen into a single object.
    // Since settings are saved instantly, this button only
    // starts the timer with custom loop settings.
    const settings = {
      greenTime: localGreenTime,
      redTime: localRedTime,
      greenReps: localGreenReps,
      redReps: localRedReps,
      greenSpeed: greenSpeed,
      redSpeed: redSpeed,
    };
    onSave(settings);
  };

  const [modalVisible, setModalVisible] = useState(false);
  // Nested modals for each card
  const [loopModalVisible, setLoopModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);
  const [lapModalVisible, setLapModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib width={32} height={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customize Workout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loop Card: directly navigate to settings screen */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.quickStart.card }]} onPress={() => navigation.navigate('LoopSelection', { workoutId: 'default', workoutName: 'Default Loop' })} activeOpacity={0.8}>

          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Loop</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={() => startTimerWithCurrentSettings && startTimerWithCurrentSettings(false)} activeOpacity={0.7}>
            <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Time Card: directly navigate to settings screen */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.card }]} onPress={() => navigation.navigate('TimeSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Time</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.time.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Speed Card: directly navigate to settings screen */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.speed.card }]} onPress={() => navigation.navigate('SpeedSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Speed</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Lap Card: directly navigate to settings screen */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.lap.card }]} onPress={() => navigation.navigate('LapSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Lap</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.lap.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
            <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Wallpaper Picker */}
        <WallpaperPicker
          selectedWallpaper={wallpaper}
          onWallpaperSelect={setWallpaperWithStorage}
        />

        {/* Plus icon below last card */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
          <TouchableOpacity
            style={{
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
            <PlusIcon width={32} height={32} color={colors.quickStart.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal with four cards: Loop, Time, Speed, Lap */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' }}>
          <View style={{ flex: 1, backgroundColor: '#1B1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 320, marginTop: 48 }}>
            <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8, justifyContent: 'center' }}>
              <Text style={{ color: '#e5e5e5', fontSize: 19, fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center' }}>Add Workout</Text>
            </View>
            {/* Loop Card */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.quickStart.card, marginBottom: 8, marginTop: 32 }]} onPress={() => navigation.navigate('LoopSelection', { workoutId: 'default', workoutName: 'Default Loop' })} activeOpacity={0.8}>

              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Loop</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={() => startTimerWithCurrentSettings(false)} activeOpacity={0.7}>
                <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Time Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.cardModal, marginBottom: 8 }]} onPress={() => navigation.navigate('TimeSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Time</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.time.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Speed Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.speed.cardModal, marginBottom: 8 }]} onPress={() => navigation.navigate('SpeedSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Speed</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Lap Card (modal) */}
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.lap.cardModal, marginBottom: 8 }]} onPress={() => navigation.navigate('LapSelectionScreen', { settings: { greenTime: localGreenTime, redTime: localRedTime, greenReps: localGreenReps, redReps: localRedReps, greenSpeed: greenSpeed, redSpeed: redSpeed }, workoutId: 'default' })} activeOpacity={0.8}>

              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Lap</Text>
              </View>
              <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.lap.primary }]} onPress={() => startTimerWithCurrentSettings(true)} activeOpacity={0.7}>
                <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
              </TouchableOpacity>
            </TouchableOpacity>
            {/* Close button - top left corner */}
            <View style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#222',
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 0.8,
                  borderColor: 'rgba(255,255,255,0.18)',
                  elevation: 4,
                }}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={28.8} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}