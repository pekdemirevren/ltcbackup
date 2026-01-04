import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  UIManager,
  Platform,
  Easing,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Picker } from '@react-native-picker/picker';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { loadWorkoutSettings, saveWorkoutSettings, WorkoutSettings } from '../utils/WorkoutSettingsManager';
import { useFocusEffect } from "@react-navigation/native";
import { WeightIcon } from '../assets/icons';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type WeightSelectionScreenProps = StackScreenProps<RootStackParamList, 'WeightSelectionScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
      workoutId: string;
      blockId?: string;
      settings?: any;
    }
  }
};

export function WeightSelectionScreen({ route, navigation }: WeightSelectionScreenProps) {
  const { workoutId, settings, isAddMode, blockId } = route.params || {};
  const themeContext = useContext(ThemeContext);

  if (!themeContext || !themeContext.colors) {
    throw new Error('WeightSelectionScreen must be used within ThemeProvider');
  }

  const { colors } = themeContext;

  const [weight, setWeight] = useState(settings?.weight?.toString() || '75');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerHeight = React.useRef(new Animated.Value(0)).current;
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const styles = useMemo(() => getCardButtonPickerStyles(isPickerVisible), [isPickerVisible]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (blockId && workoutId) {
          const loadedSettings = await loadWorkoutSettings(workoutId);
          const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
          if (block && block.settings.weight) {
            setWeight(block.settings.weight);
          }
        } else if (workoutId) {
          const loadedSettings = await loadWorkoutSettings(workoutId);
          if (loadedSettings.weight) {
            setWeight(loadedSettings.weight);
          }
        }
        setInitialLoadComplete(true);
      };
      load();
    }, [workoutId, blockId])
  );

  useEffect(() => {
    const save = async () => {
      if (initialLoadComplete && !isAddMode && workoutId) {
        const currentSettings = await loadWorkoutSettings(workoutId);
        if (blockId) {
          const existingBlock = currentSettings.customBlocks?.find(b => b.id === blockId);
          if (existingBlock) {
            const updatedBlock = {
              ...existingBlock,
              settings: { ...existingBlock.settings, weight: weight },
            };
            const otherBlocks = currentSettings.customBlocks?.filter(b => b.id !== blockId) || [];
            await saveWorkoutSettings({ ...currentSettings, customBlocks: [updatedBlock, ...otherBlocks] });
          }
        } else {
          await saveWorkoutSettings({ ...currentSettings, weight: weight });
        }
      }
    };

    const timer = setTimeout(() => {
      save();
    }, 500);

    return () => clearTimeout(timer);
  }, [weight, initialLoadComplete, isAddMode, workoutId, blockId]);

  const handleDone = async () => {
    if (isAddMode && workoutId) {
      const currentSettings = await loadWorkoutSettings(workoutId);
      const newBlock = {
        id: Date.now().toString(),
        type: 'weight' as const,
        settings: { weight: weight }
      };
      const updatedBlocks = [newBlock, ...(currentSettings.customBlocks || [])];
      await saveWorkoutSettings({ ...currentSettings, customBlocks: updatedBlocks });
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  const togglePicker = () => {
    const newIsVisible = !isPickerVisible;
    setIsPickerVisible(newIsVisible);
    Animated.timing(pickerHeight, {
      toValue: newIsVisible ? 220 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
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
        <TouchableOpacity onPress={handleDone} style={[styles.backButton, { backgroundColor: colors.weight.primary }]}>
          <MaterialCommunityIcons name="check" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weight Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 24,
              borderBottomLeftRadius: isPickerVisible ? 0 : 24,
              borderBottomRightRadius: isPickerVisible ? 0 : 24
            }
          ]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <WeightIcon width={32} height={32} color={colors.weight.primary} />
          </View>
          <Text style={styles.cardTitle}>Weight</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={[styles.valueText, { color: isPickerVisible ? colors.weight.primary : colors.text }]}>{weight}kg</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isPickerVisible ? 12 : 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={weight}
            onValueChange={(itemValue: string) => setWeight(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {Array.from({ length: 800 }, (_, i) => ((i + 1) * 0.25).toFixed(2)).map(val => (
              <Picker.Item key={val} label={`${val} kg`} value={val} />
            ))}
          </Picker>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
