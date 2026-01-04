import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Share,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
// FabMenuStyles removed; menu styles will be handled locally or via DailySummaryDetailScreen
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MetricColors from '../constants/MetricColors';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import ViewShot from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { calculateCalories } from '../utils/CalorieCalculator';
import { allWorkouts } from '../constants/workoutData';
import { TimerContext } from '../contexts/TimerContext';
import { wallpapers } from '../constants/wallpapers';
import { cardBackgrounds, defaultCardBackground } from '../constants/cardBackgrounds';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { SharingWorkoutData as WorkoutData } from '../types/sharing';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

// Workout to background mapping (sorted by specificity - longer keys first for better matching)
const WORKOUT_BACKGROUND_MAP: { [key: string]: number } = {
  // Specific workout variations (longer keys first)
  'incline-bench-press': 17,
  'jump-rope-new': 22,
  'jump-rope': 22,
  'battle-rope': 21,
  'barbell-row': 14,
  'seated-row': 14,
  't-bar-row': 14,
  'lat-pulldown': 18,
  'shoulder-press': 5,
  'lateral-raise': 12,
  'front-raise': 12,
  'rear-delt-fly': 5,
  'bench-press': 17,
  'leg-press': 3,
  'leg-curl': 3,
  'leg-extension': 3,
  'calf-raise': 3,
  'chest-fly': 4,
  'bicep-curl': 12,
  'hammer-curl': 12,
  'tricep-extension': 12,
  'tricep-pushdown': 12,
  'preacher-curl': 12,
  'russian-twist': 20,
  'leg-raise': 40,
  'sit-up': 40,
  'ab-wheel': 40,
  'kettlebell-swing': 13,
  'goblet-squat': 13,
  'turkish-get-up': 13,
  'farmer-walk': 46,
  'box-jump': 42,
  'clean-and-jerk': 38,
  'power-clean': 38,
  'shadow-boxing': 48,
  'martial-arts': 31,
  
  // Core movements
  'squat': 16,
  'deadlift': 15,
  'pull-up': 18,
  'push-up': 19,
  'plank': 20,
  'crunch': 40,
  'lunge': 3,
  'dip': 19,
  'shrug': 5,
  'clean': 38,
  'snatch': 38,
  
  // Equipment-based
  'kettlebell': 13,
  'dumbbell': 12,
  'barbell': 14,
  
  // Cardio
  'running': 7,
  'walking': 30,
  'biking': 10,
  'cycling': 10,
  'rowing': 33,
  'treadmill': 34,
  'elliptical': 34,
  
  // Training styles
  'crossfit': 6,
  'hiit': 6,
  'yoga': 8,
  'stretching': 23,
  'pilates': 35,
  'boxing': 9,
  'kickboxing': 32,
  'weightlifting': 5,
  
  // Generic
  'circuit': 1,
  'gym': 1,
  
  // Body parts (fallback)
  'chest': 4,
  'back': 14,
  'shoulder': 5,
  'bicep': 12,
  'tricep': 12,
  'leg': 3,
  'core': 40,
  'abs': 40,
  'arm': 12,
  'row': 14,
  'pull': 18,
  'press': 5,
  'curl': 12,
  'raise': 12,
};

// Preset backgrounds
const PRESET_BACKGROUNDS = [
  // Original 4
  { id: 1, name: 'Gym Workout', uri: 'https://images.unsplash.com/photo-1604480133080-602261a680df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0fGVufDF8fHx8MTc2NjkwMzkzNXww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 2, name: 'Fitness Training', uri: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwdHJhaW5pbmd8ZW58MXx8fHwxNzY2OTY3OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 3, name: 'Leg Workout', uri: 'https://images.unsplash.com/photo-1646495001290-39103b31873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWclMjB3b3Jrb3V0fGVufDF8fHx8MTc2NzAwNTYyNXww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 4, name: 'Chest Workout', uri: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVzdCUyMHdvcmtvdXR8ZW58MXx8fHwxNzY3MDA1NjI2fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  
  // New additions from API calls
  { id: 5, name: 'Weightlifting', uri: 'https://images.unsplash.com/photo-1653927956711-f2222a45e040?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWlnaHRsaWZ0aW5nJTIwZ3ltfGVufDF8fHx8MTc2Njk0MTk3NHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 6, name: 'CrossFit', uri: 'https://images.unsplash.com/photo-1639511205180-7b2865b2f467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9zc2ZpdCUyMHRyYWluaW5nfGVufDF8fHx8MTc2Njk4NzUxNHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 7, name: 'Running', uri: 'https://images.unsplash.com/photo-1669806954505-936e77929af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwY2FyZGlvfGVufDF8fHx8MTc2NzAwNzU1N3ww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 8, name: 'Yoga', uri: 'https://images.unsplash.com/photo-1641971215228-c677f3a28cd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwZml0bmVzc3xlbnwxfHx8fDE3NjY4OTMzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 9, name: 'Boxing', uri: 'https://images.unsplash.com/photo-1517438322307-e67111335449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjY5MTYyMjV8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 10, name: 'Cycling', uri: 'https://images.unsplash.com/photo-1635706055150-5827085ca635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWNsaW5nJTIwd29ya291dHxlbnwxfHx8fDE3NjY5MzgzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 11, name: 'Swimming', uri: 'https://images.unsplash.com/photo-1558617320-e695f0d420de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMHBvb2x8ZW58MXx8fHwxNzY3MDAxMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 12, name: 'Dumbbell', uri: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW1iYmVsbCUyMHRyYWluaW5nfGVufDF8fHx8MTc2NzAxMDczMXww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 13, name: 'Kettlebell', uri: 'https://images.unsplash.com/photo-1710814824560-943273e8577e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZXR0bGViZWxsJTIwd29ya291dHxlbnwxfHx8fDE3NjY5NDE5MTB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 14, name: 'Barbell', uri: 'https://images.unsplash.com/photo-1581907311217-98a34b592a9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZWxsJTIwbGlmdGluZ3xlbnwxfHx8fDE3NjcwMTA3MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 15, name: 'Deadlift', uri: 'https://images.unsplash.com/photo-1744551472900-d23f4997e1cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWFkbGlmdCUyMHBvd2VybGlmdGluZ3xlbnwxfHx8fDE3NjcwMTA3MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 16, name: 'Squat', uri: 'https://images.unsplash.com/photo-1683147779485-24912f480130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcXVhdCUyMHdvcmtvdXR8ZW58MXx8fHwxNzY3MDEwNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 17, name: 'Bench Press', uri: 'https://images.unsplash.com/photo-1690731033723-ad718c6e585a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZW5jaCUyMHByZXNzfGVufDF8fHx8MTc2NzAxMDczN3ww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 18, name: 'Pull-up', uri: 'https://images.unsplash.com/photo-1516208962313-9d183d94f577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWxsdXAlMjBjYWxpc3RoZW5pY3N8ZW58MXx8fHwxNzY3MDEwNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 19, name: 'Push-up', uri: 'https://images.unsplash.com/photo-1686247166156-0bca3e8b55d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXNodXAlMjBleGVyY2lzZXxlbnwxfHx8fDE3NjY5OTMwODl8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 20, name: 'Plank', uri: 'https://images.unsplash.com/photo-1765302741884-e846c7a178df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFuayUyMGNvcmV8ZW58MXx8fHwxNzY2OTM0OTk1fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 21, name: 'Battle Rope', uri: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXR0bGUlMjByb3BlfGVufDF8fHx8MTc2NzAxMDczOXww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 22, name: 'Jump Rope', uri: 'https://images.unsplash.com/photo-1514994667787-b48ca37155f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqdW1wJTIwcm9wZXxlbnwxfHx8fDE3NjcwMTA3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 23, name: 'Stretching', uri: 'https://images.unsplash.com/photo-1607914660217-754fdd90041d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJldGNoaW5nJTIwZmxleGliaWxpdHl8ZW58MXx8fHwxNzY2OTQ4NDcyfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 24, name: 'Spin Class', uri: 'https://images.unsplash.com/photo-1605235186531-bbd852b09e69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvb3IlMjBjeWNsaW5nfGVufDF8fHx8MTc2NzAxMDczOXww&ixlib=rb-4.1.0&q=80&w=1080' },
  
  // Dynamically generated variations
  { id: 25, name: 'Gym Floor', uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1080&q=80' },
  { id: 26, name: 'Rope Training', uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&q=80' },
  { id: 27, name: 'Medicine Ball', uri: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1080&q=80' },
  { id: 28, name: 'TRX Training', uri: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1080&q=80' },
  { id: 29, name: 'Mountain Climbing', uri: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1080&q=80' },
  { id: 30, name: 'Trail Running', uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1080&q=80' },
  { id: 31, name: 'Martial Arts', uri: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=1080&q=80' },
  { id: 32, name: 'Kickboxing', uri: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1080&q=80' },
  { id: 33, name: 'Rowing Machine', uri: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=1080&q=80' },
  { id: 34, name: 'Treadmill', uri: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1080&q=80' },
  { id: 35, name: 'Pilates', uri: 'https://images.unsplash.com/photo-1519311965067-36d3e5f33d39?w=1080&q=80' },
  { id: 36, name: 'Rock Climbing', uri: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1080&q=80' },
  { id: 37, name: 'Gym Equipment', uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80' },
  { id: 38, name: 'Olympic Lifting', uri: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=1080&q=80' },
  { id: 39, name: 'Weight Plates', uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=80' },
  { id: 40, name: 'Abs Workout', uri: 'https://images.unsplash.com/photo-1508215885820-4585e56135c8?w=1080&q=80' },
  { id: 41, name: 'Stadium Stairs', uri: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=1080&q=80' },
  { id: 42, name: 'Sprint Training', uri: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=1080&q=80' },
  { id: 43, name: 'Gymnastics', uri: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&q=80' },
  { id: 44, name: 'Dance Fitness', uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80' },
  { id: 45, name: 'Spin Bike', uri: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1080&q=80' },
  { id: 46, name: 'Free Weights', uri: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=1080&q=80' },
  { id: 47, name: 'Training Session', uri: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1080&q=80' },
  { id: 48, name: 'Shadow Boxing', uri: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1080&q=80' },
  { id: 49, name: 'Aerobics', uri: 'https://images.unsplash.com/photo-1522844990619-4951c40f7eda?w=1080&q=80' },
  { id: 50, name: 'Squat Rack', uri: 'https://images.unsplash.com/photo-1613043016969-082f2e8a7a31?w=1080&q=80' },
];

// Quick templates: dynamically loaded from WorkoutScreen quick start cards
const QUICK_START_STORAGE_KEY = '@workout_quick_start_cards';

export default function SharingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const viewShotRef = useRef<ViewShot>(null);
  const fullPreviewShotRef = useRef<ViewShot>(null);
  const previewShotRef = useRef<ViewShot>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const timerContext = useContext(TimerContext);
  const savedWallpaper = timerContext?.wallpaper;
  const setWallpaperWithStorage = timerContext?.setWallpaperWithStorage;
  type EditableField = 'workoutName' | 'duration' | 'totalDuration' | 'calories' | 'weight' | 'performedWorkouts' | null;
  
  // Workout data
  const [workoutData, setWorkoutData] = useState<WorkoutData>({
    workoutName: 'LEG DAY',
    duration: '45:00',
    totalDuration: '1:15:00',
    sets: 4,
    reps: 12,
    calories: 450,
    energy: 1880,
    weight: 70,
  });
  const [performedWorkouts, setPerformedWorkouts] = useState('Leg Press, Dumbbell Lunge, Bicep Curl');
  
  // Background
  const [backgroundImage, setBackgroundImage] = useState<string>(PRESET_BACKGROUNDS[0].uri);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [hasSessionLoaded, setHasSessionLoaded] = useState(false);
  
  // Edit modes
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [quickTemplates, setQuickTemplates] = useState<typeof allWorkouts>(allWorkouts.slice(0, 6));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [isFabModalVisible, setIsFabModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const fabButtonRef = useRef<View>(null);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const PICKER_CARD_COUNT = 24;
  const pickerCards = allWorkouts.slice(0, PICKER_CARD_COUNT);

  const togglePreview = () => setIsPreviewVisible(prev => !prev);

  // Debug: Log pickerVisible changes
  useEffect(() => {
    console.log('pickerVisible changed:', pickerVisible);
  }, [pickerVisible]);

  // Animation effect like DailySummaryDetailScreen
  useEffect(() => {
    if (fabMenuVisible) {
      setIsFabModalVisible(true);
      Animated.spring(fabAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(fabAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsFabModalVisible(false);
        console.log('FAB Modal completely closed, isFabModalVisible set to false');
      });
    }
  }, [fabMenuVisible]);

  const handleOpenFabMenu = () => {
    fabButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ top: y - 50 - 30, right: 20 + 30 });
      setFabMenuVisible(true);
    });
  };

  const fabButtonScale = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const fabButtonOpacity = fabAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const fabButtonTranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const fabMenuScale = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const fabMenuOpacity = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const fabMenuTranslateX = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });
  
  // Load last workout data
  useEffect(() => {
    loadLastWorkoutData();
    loadQuickStartTemplates();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLastWorkoutData();
      loadQuickStartTemplates();
      // Load customized data from storage if exists
      loadCustomizedData();
    }, [])
  );

  const loadCustomizedData = async () => {
    try {
      const stored = await AsyncStorage.getItem('customizedSharingData');
      if (stored) {
        const { workoutData: customData, performedWorkouts: customWorkouts } = JSON.parse(stored);
        if (customData) setWorkoutData(customData);
        if (customWorkouts) setPerformedWorkouts(customWorkouts);
        // Clear after loading
        await AsyncStorage.removeItem('customizedSharingData');
      }
    } catch (e) {
      console.error('Error loading customized data:', e);
    }
  };
  const loadQuickStartTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem(QUICK_START_STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const items = ids
          .map(id => allWorkouts.find(w => w.workoutId === id))
          .filter(Boolean) as typeof allWorkouts;
        if (items.length > 0) {
          setQuickTemplates(items);
        }
      }
    } catch (e) {
      console.error('Error loading quick templates:', e);
    }
  };

  // Sync background with last saved wallpaper from timer context
  useEffect(() => {
    if (!savedWallpaper || hasSessionLoaded) return;

    const builtIn = wallpapers.find((w) => w.id === savedWallpaper);
    if (builtIn) {
      const assetUri = Image.resolveAssetSource(builtIn.source).uri;
      setBackgroundImage(assetUri);
      setCustomBackground(null);
      return;
    }

    setBackgroundImage(savedWallpaper);
    setCustomBackground(savedWallpaper);
  }, [savedWallpaper, hasSessionLoaded]);
  
  const loadLastWorkoutData = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutSummaries');
      if (stored) {
        const summaries = JSON.parse(stored);
        if (summaries.length > 0) {
          const lastSession = summaries[summaries.length - 1];
          const workout = allWorkouts.find(w => w.id === lastSession.workoutId);
          
          // Format duration
          const totalSeconds = lastSession.elapsedTime || 0;
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
          
          // Total duration (elapsed time + rest)
          const totalMins = Math.floor((lastSession.elapsedTime || 0) / 60);
          const totalHours = Math.floor(totalMins / 60);
          const remainingMins = totalMins % 60;
          const totalDurationStr = totalHours > 0 
            ? `${totalHours}:${remainingMins.toString().padStart(2, '0')}:00`
            : `${remainingMins}:00`;
          
          // Calculate calories
          const weight = await AsyncStorage.getItem('userWeight');
          const weightVal = weight ? parseFloat(weight) : 70;
          const calories = calculateCalories(
            lastSession.workoutId,
            lastSession.elapsedTime,
            weightVal,
            lastSession.completedReps || 0
          );
          
          setWorkoutData({
            workoutName: workout?.name?.toUpperCase() || 'WORKOUT',
            duration: durationStr,
            totalDuration: totalDurationStr,
            sets: lastSession.completedSets || 0,
            reps: lastSession.completedReps || 0,
            calories: Math.round(calories),
            energy: Math.round(calories * 4.184), // kcal to kJ
            weight: Math.round(weightVal),
          });
          // Update background based on workoutId mapping for per-card visuals
          const mappedBg = cardBackgrounds[lastSession.workoutId] || defaultCardBackground;
          setBackgroundImage(mappedBg);
          setCustomBackground(null);
          setHasSessionLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    }
  };
  
  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1600,
      });
      
      if (result.assets && result.assets[0]?.uri) {
        setCustomBackground(result.assets[0].uri);
        setBackgroundImage(result.assets[0].uri);
        setWallpaperWithStorage?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error selecting image.');
    }
  };
  
  // Take photo with camera
  const takePhoto = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
      }
      
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1600,
      });
      
      if (result.assets && result.assets[0]?.uri) {
        setCustomBackground(result.assets[0].uri);
        setBackgroundImage(result.assets[0].uri);
        setWallpaperWithStorage?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Error taking photo.');
    }
  };
  
  // Save to gallery
  const saveToGallery = async () => {
    if (!fullPreviewShotRef.current && !previewShotRef.current && !viewShotRef.current) return;
    
    setIsSaving(true);
    try {
      const targetRef = fullPreviewShotRef.current || previewShotRef.current || viewShotRef.current;
      const uri = await (targetRef as unknown as { capture: () => Promise<string> }).capture();
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Gallery permission is required to save photos.');
          setIsSaving(false);
          return;
        }
      }
      
      await CameraRoll.save(uri, { type: 'photo' });
      Alert.alert('Success! 🎉', 'Workout saved to gallery.');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Error saving workout.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Share
  const shareCard = async () => {
    if (!viewShotRef.current) return;
    
    setIsLoading(true);
    try {
      // @ts-ignore
      const uri = await viewShotRef.current.capture();
      
      // Save image to gallery first
      await CameraRoll.save(uri, { type: 'photo' });
      
      // Then open share menu
      await Share.share({
        message: `I completed ${workoutData.workoutName} workout! 💪 Burned ${workoutData.calories} kcal.`,
        title: 'Workout Result',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing:', error);
        Alert.alert('Error', 'Error sharing workout.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Select preset
  const selectTemplate = (workout: (typeof allWorkouts)[number]) => {
    setWorkoutData(prev => ({
      ...prev,
      workoutName: workout.name.toUpperCase(),
    }));

    // Find matching background based on workout name
    const workoutKey = workout.workoutId.toLowerCase();
    
    // Try exact match first
    let backgroundId = WORKOUT_BACKGROUND_MAP[workoutKey];
    let matchType = 'exact';
    let matchedKey = workoutKey;
    
    // If no exact match, try partial match with longest key first (most specific)
    if (!backgroundId) {
      // Sort keys by length descending to prefer longer (more specific) matches
      const sortedKeys = Object.keys(WORKOUT_BACKGROUND_MAP).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        if (workoutKey.includes(key)) {
          backgroundId = WORKOUT_BACKGROUND_MAP[key];
          matchType = 'partial';
          matchedKey = key;
          break;
        }
      }
    }
    
    // Default to gym workout if still no match
    backgroundId = backgroundId || 1;
    
    const matchedBackground = PRESET_BACKGROUNDS.find(bg => bg.id === backgroundId);
    
    // Debug log
    console.log(`🎨 Template: "${workout.name}" (${workoutKey}) → bg ${backgroundId} (${matchedBackground?.name}) [${matchType} match: "${matchedKey}"]`);
    
    if (matchedBackground) {
      setBackgroundImage(matchedBackground.uri);
      setCustomBackground(null);
      setWallpaperWithStorage?.(matchedBackground.uri);
    }
  };
  
  // Update field
  const updateField = (field: keyof WorkoutData, value: string | number) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const performedItems = performedWorkouts
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  const renderStaticCard = () => (
    <View style={styles.fullCard}>
      {/* Background */}
      <Image
        source={{ uri: backgroundImage }}
        style={styles.cardBackground}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={styles.cardOverlay}
      />
      
      {/* Content */}
      <View style={styles.cardContent}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Workout Complete</Text>
        </View>
        
        {/* Workout Name */}
        <View style={styles.workoutNameContainer}>
          <Text style={styles.workoutName}>{workoutData.workoutName}</Text>
        </View>
        {/* Performed Workouts Subtitle */}
        <View style={[styles.workoutSubtitleContainer, styles.workoutSubtitleGrid]}>
          {performedItems.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.workoutSubtitleGridItem}>
              <Text style={styles.workoutSubtitle}>{item}</Text>
            </View>
          ))}
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          {/* Duration */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{workoutData.duration} <Text style={styles.statUnit}>min</Text></Text>
          </View>
          
          {/* Total Time */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TOTAL TIME</Text>
            <Text style={styles.statValue}>{workoutData.totalDuration} <Text style={styles.statUnit}>min</Text></Text>
          </View>
          
          {/* Sets x Reps */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SETS x REPS</Text>
            <Text style={styles.statValue}>{workoutData.sets} x {workoutData.reps} <Text style={styles.statUnit}>sets</Text></Text>
          </View>
          
          {/* Calories */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>CALORIES</Text>
            <Text style={styles.statValue}>{workoutData.calories} <Text style={styles.statUnit}>kcal</Text></Text>
          </View>
          
          {/* Energy */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ENERGY (KJ)</Text>
            <Text style={styles.statValue}>{workoutData.energy} <Text style={styles.statUnit}>kJ</Text></Text>
          </View>

          {/* Weight */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>WEIGHT (KG)</Text>
            <Text style={styles.statValue}>{workoutData.weight} <Text style={styles.statUnit}>kg</Text></Text>
          </View>
        </View>
        
        {/* Branding */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>POWERED BY MYWORKOUT</Text>
        </View>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout Sharing</Text>
        </View>
        
        {/* Preview Card */}
        <TouchableOpacity 
          style={styles.previewContainer}
          onPress={togglePreview}
          activeOpacity={0.9}
        >
          <View style={styles.cardWrapper}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1 }}
              style={styles.viewShot}
            >
              <View style={styles.card}>
                {/* Background */}
                <Image
                  source={{ uri: backgroundImage }}
                  style={styles.cardBackground}
                  resizeMode="cover"
                />
                
                {/* Gradient Overlay */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                  style={styles.cardOverlay}
                />
                
                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Badge */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Workout Complete</Text>
                  </View>
                  
                  {/* Workout Name */}
                  <TouchableOpacity 
                    onPress={() => setEditingField('workoutName')}
                    style={styles.workoutNameContainer}
                  >
                    {editingField === 'workoutName' ? (
                      <TextInput
                        style={styles.workoutNameInput}
                        value={workoutData.workoutName}
                        onChangeText={(text) => updateField('workoutName', text.toUpperCase())}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        selectTextOnFocus
                      />
                    ) : (
                      <Text style={styles.workoutName}>{workoutData.workoutName}</Text>
                    )}
                  </TouchableOpacity>
                  {/* Performed Workouts Subtitle */}
                  <TouchableOpacity
                    onPress={() => setEditingField('performedWorkouts')}
                    style={[styles.workoutSubtitleContainer, styles.workoutSubtitleGrid]}
                    activeOpacity={0.8}
                  >
                    {editingField === 'performedWorkouts' ? (
                      <TextInput
                        style={styles.workoutSubtitleInput}
                        value={performedWorkouts}
                        onChangeText={setPerformedWorkouts}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        multiline
                      />
                    ) : (
                      performedItems.map((item, index) => (
                        <View key={`${item}-${index}`} style={styles.workoutSubtitleGridItem}>
                          <Text style={styles.workoutSubtitle}>{item}</Text>
                        </View>
                      ))
                    )}
                  </TouchableOpacity>
                  
                  {/* Stats */}
                  <View style={styles.statsContainer}>
                    {/* Duration */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>DURATION</Text>
                      <TouchableOpacity onPress={() => setEditingField('duration')}>
                        {editingField === 'duration' ? (
                          <TextInput
                            style={styles.statValueInput}
                            value={workoutData.duration}
                            onChangeText={(text) => updateField('duration', text)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            keyboardType="numbers-and-punctuation"
                          />
                        ) : (
                          <Text style={styles.statValue}>{workoutData.duration} <Text style={styles.statUnit}>min</Text></Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Total Time */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>TOTAL TIME</Text>
                      <TouchableOpacity onPress={() => setEditingField('totalDuration')}>
                        {editingField === 'totalDuration' ? (
                          <TextInput
                            style={styles.statValueInput}
                            value={workoutData.totalDuration}
                            onChangeText={(text) => updateField('totalDuration', text)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            keyboardType="numbers-and-punctuation"
                          />
                        ) : (
                          <Text style={styles.statValue}>{workoutData.totalDuration} <Text style={styles.statUnit}>min</Text></Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Sets x Reps */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>SETS x REPS</Text>
                      <Text style={styles.statValue}>{workoutData.sets} x {workoutData.reps} <Text style={styles.statUnit}>sets</Text></Text>
                    </View>
                    
                    {/* Calories */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>CALORIES</Text>
                      <TouchableOpacity onPress={() => setEditingField('calories')}>
                        {editingField === 'calories' ? (
                          <TextInput
                            style={styles.statValueInput}
                            value={workoutData.calories.toString()}
                            onChangeText={(text) => updateField('calories', parseInt(text) || 0)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            keyboardType="number-pad"
                          />
                        ) : (
                          <Text style={styles.statValue}>{workoutData.calories} <Text style={styles.statUnit}>kcal</Text></Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Energy */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ENERGY (KJ)</Text>
                      <Text style={styles.statValue}>{workoutData.energy} <Text style={styles.statUnit}>kJ</Text></Text>
                    </View>

                    {/* Weight */}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>WEIGHT (KG)</Text>
                      <TouchableOpacity onPress={() => setEditingField('weight')}>
                        {editingField === 'weight' ? (
                          <TextInput
                            style={styles.statValueInput}
                            value={workoutData.weight.toString()}
                            onChangeText={(text) => updateField('weight', parseFloat(text) || 0)}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            keyboardType="number-pad"
                          />
                        ) : (
                          <Text style={styles.statValue}>{workoutData.weight} <Text style={styles.statUnit}>kg</Text></Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Branding */}
                  <View style={styles.branding}>
                    <Text style={styles.brandingText}>POWERED BY MYWORKOUT</Text>
                  </View>
                </View>
              </View>
            </ViewShot>

            {/* FAB button only - menu moved to Modal */}
            <View ref={fabButtonRef} style={{ position: 'absolute', right: 16, bottom: -60, alignItems: 'flex-end' }}>
              <Animated.View
                style={{
                  opacity: fabButtonOpacity,
                  transform: [{ scale: fabButtonScale }, { translateX: fabButtonTranslateX }],
                }}
              >
                <TouchableOpacity
                  style={styles.fabButton}
                  onPress={handleOpenFabMenu}
                  disabled={fabMenuVisible}
                >
                  <View style={styles.fabButtonInner}>
                    <Text style={styles.fabButtonText}>- +</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Subtitle placed between preview and actions */}
        <View style={[styles.headerSubtitleWrapper, { opacity: fabMenuVisible ? 0 : 1 }]}>
          <Text style={styles.headerSubtitle}>Customize and share your workout</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={shareCard}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="share-2" size={20} color="#000000ff" />
                <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.downloadButton]} 
            onPress={saveToGallery}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="download" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Background Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Background</Text>
          </View>
          
          {/* Background Carousel */}
          <FlatList
            data={PRESET_BACKGROUNDS}
            keyExtractor={(bg) => String(bg.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.backgroundList}
            snapToInterval={92}
            snapToAlignment="start"
            decelerationRate="fast"
            renderItem={({ item: bg }) => (
              <TouchableOpacity
                style={[
                  styles.backgroundItem,
                  backgroundImage === bg.uri && styles.backgroundItemSelected
                ]}
                onPress={() => {
                  setBackgroundImage(bg.uri);
                  setCustomBackground(null);
                  setWallpaperWithStorage?.(bg.uri);
                }}
              >
                <Image source={{ uri: bg.uri }} style={styles.backgroundThumbnail} />
                {backgroundImage === bg.uri && (
                  <View style={styles.backgroundSelectedOverlay}>
                    <Feather name="check" size={24} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
          
        </View>
        
        {/* Template selection button only */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.bottomLargeButton}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.bottomLargeButtonText}>Select Template</Text>
          </TouchableOpacity>
        </View>

        {/* Picker Modal for 24 cards */}
        <Modal 
          visible={pickerVisible} 
          animationType="slide" 
          transparent={false}
          statusBarTranslucent={true}
          onRequestClose={() => {
            console.log('Modal onRequestClose called');
            setPickerVisible(false);
          }}
        >
          <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#e5e5e5" />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginLeft: 15 }}>
                Select Template
              </Text>
            </View>
            <FlatList
              data={pickerCards}
              keyExtractor={(item) => item.workoutId}
              numColumns={3}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    selectTemplate(item);
                    setPickerVisible(false);
                  }}
                  style={{
                    width: (SCREEN_WIDTH - 20 * 2 - 12 * 2) / 3,
                    backgroundColor: '#1C1C1E',
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <item.SvgIcon width={40} height={40} fill="#9DEC2C" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#e5e5e5', textAlign: 'center' }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
        
        {/* Tip */}
        <View style={styles.tipContainer}>
          <Feather name="info" size={16} color="#666" />
          <Text style={styles.tipText}>
            Tap values on the card to edit them
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAB Menu Modal - like DailySummaryDetailScreen */}
      <Modal
        transparent
        visible={isFabModalVisible}
        animationType="none"
        onRequestClose={() => setFabMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFabMenuVisible(false)}>
          <View style={styles.fabMenuOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.fabMenuAnimatedWrapper,
            {
              top: menuPosition.top,
              right: menuPosition.right,
              opacity: fabMenuOpacity,
              transform: [
                { translateX: fabMenuTranslateX },
                { scale: fabMenuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <LiquidGlassMenuItem
              icon={<Feather name="grid" size={20} color="#FFF" />}
              label="Select Template"
              onPress={() => {
                console.log('=== SELECT TEMPLATE CLICKED ===');
                console.log('Current pickerVisible:', pickerVisible);
                console.log('Current isFabModalVisible:', isFabModalVisible);
                
                // IMPORTANT: Force close picker first if it's somehow stuck open
                if (pickerVisible) {
                  console.log('WARNING: pickerVisible was already true! Force closing first...');
                  setPickerVisible(false);
                }
                
                // Close FAB menu and modal
                setFabMenuVisible(false);
                setIsFabModalVisible(false);
                
                // Then open picker after ensuring it was closed
                setTimeout(() => {
                  console.log('=== OPENING PICKER NOW ===');
                  setPickerVisible(true);
                  console.log('pickerVisible set to true');
                }, 150);
              }}
            />
            <LiquidGlassMenuItem
              icon={<Feather name="sliders" size={20} color="#FFF" />}
              label="Customize Sharing"
              onPress={() => {
                setFabMenuVisible(false);
                // Wait for FAB menu animation to complete
                setTimeout(() => {
                  navigation.navigate('CustomizeSharing', {
                    workoutData,
                    performedWorkouts,
                  });
                }, 350);
              }}
            />
          </LiquidGlassCard>
        </Animated.View>
      </Modal>

      {/* Preview Modal */}
      {isPreviewVisible && (
        <View style={styles.previewModalContainer}>
          <TouchableOpacity 
            style={styles.previewModalBackdrop}
            onPress={() => setIsPreviewVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.previewModalContent}>
            <TouchableOpacity 
              style={styles.previewCloseButton}
              onPress={() => setIsPreviewVisible(false)}
              activeOpacity={0.7}
            >
              <Feather name="x" size={28} color="#fff" />
            </TouchableOpacity>
            
            <ViewShot
              options={{ format: 'png', quality: 1 }}
              style={styles.previewFullCard}
              ref={previewShotRef}
            >
              <TouchableOpacity activeOpacity={1} onPress={togglePreview} style={{ flex: 1 }}>
                {renderStaticCard()}
              </TouchableOpacity>
            </ViewShot>
          </View>
        </View>
      )}

      {/* Hidden full-screen capture for saving (offscreen) */}
      <View style={styles.hiddenPreviewContainer} pointerEvents="none">
        <ViewShot
          ref={fullPreviewShotRef}
          options={{ format: 'png', quality: 1 }}
          style={styles.previewFullCard}
        >
          {renderStaticCard()}
        </ViewShot>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'left',
  },
  headerSubtitleWrapper: {
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 26,
    paddingHorizontal: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  viewShot: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardWrapper: {
    position: 'relative',
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutNameContainer: {
    marginBottom: 8,
  },
  workoutSubtitleContainer: {
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  workoutSubtitleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  workoutSubtitleGridItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  workoutSubtitleInput: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#9DEC2C',
    paddingVertical: 4,
  },
  workoutName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  workoutNameInput: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -1,
    borderBottomWidth: 2,
    borderBottomColor: '#9DEC2C',
    paddingVertical: 4,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 25,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  statValueInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#9DEC2C',
    paddingVertical: 2,
    minWidth: 100,
  },
  branding: {
    marginTop: 40,
  },
  brandingText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#A7EC2C',
  },
  shareButtonText: {
    color: '#000',
  },
  downloadButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backgroundList: {
    gap: 12,
    paddingRight: 16,
  },
  backgroundItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  backgroundItemSelected: {
    borderColor: '#9DEC2C',
  },
  backgroundThumbnail: {
    width: '100%',
    height: '100%',
  },
  backgroundSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(157, 236, 44, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customImageButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    marginHorizontal: -4,
    marginBottom: -4,
  },
  customImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  customImageButtonText: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2A2A2E',
    borderWidth: 1,
    borderColor: '#333',
  },
  presetButtonSelected: {
    backgroundColor: '#9DEC2C',
    borderColor: '#9DEC2C',
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    color: '#000',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  tipText: {
    color: '#666',
    fontSize: 13,
  },
  previewModalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  previewModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
  },
  previewCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFullCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  fullCard: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  hiddenPreviewContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: -SCREEN_HEIGHT * 2,
    left: 0,
    opacity: 0,
  },
  // Reuse SummaryScreen bottomLargeButton styles
  bottomLargeButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 42,
    padding: 3,
    alignItems: 'center',
  },
  bottomLargeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9DEC2C',
  },
  // FAB Button styles (like DailySummaryDetailScreen goalButton)
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButtonText: {
    color: '#9DEC2C',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // FAB Menu styles (like DailySummaryDetailScreen menuWrapper)
  fabMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fabMenuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 100,
  },
  fabMenuWrapper: {
    position: 'absolute',
    borderRadius: 36,
    overflow: 'hidden',
    width: 260,
    zIndex: 100,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 25,
    paddingLeft: 31,
  },
  fabMenuIcon: {
    width: 20,
    marginRight: 12,
  },
  fabMenuText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});