import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { SharingWorkoutData } from '../types/sharing';

 type CustomizeRoute = RouteProp<RootStackParamList, 'CustomizeSharing'>;

const CustomizeSharingScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<CustomizeRoute>();
  const { workoutData, performedWorkouts } = route.params;

  const [form, setForm] = useState<SharingWorkoutData>(workoutData);
  const [subtitle, setSubtitle] = useState(performedWorkouts);

  const updateField = (key: keyof SharingWorkoutData, value: string) => {
    if (key === 'sets' || key === 'reps' || key === 'calories' || key === 'energy' || key === 'weight') {
      setForm(prev => ({ ...prev, [key]: Number(value) || 0 }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    // Save to AsyncStorage instead of callback
    try {
      await AsyncStorage.setItem('customizedSharingData', JSON.stringify({
        workoutData: form,
        performedWorkouts: subtitle
      }));
    } catch (e) {
      console.error('Error saving customized data:', e);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Customize Sharing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Workout Title</Text>
        <TextInput
          style={styles.input}
          value={form.workoutName}
          onChangeText={(text) => updateField('workoutName', text.toUpperCase())}
          placeholder="LEG DAY"
          placeholderTextColor="#777"
        />

        <Text style={styles.label}>Performed Workouts (subtitle)</Text>
        <TextInput
          style={styles.input}
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Leg Press, Dumbbell Lunge..."
          placeholderTextColor="#777"
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              value={form.duration}
              onChangeText={(text) => updateField('duration', text)}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Total Time (min)</Text>
            <TextInput
              style={styles.input}
              value={form.totalDuration}
              onChangeText={(text) => updateField('totalDuration', text)}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Sets</Text>
            <TextInput
              style={styles.input}
              value={String(form.sets)}
              onChangeText={(text) => updateField('sets', text)}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              value={String(form.reps)}
              onChangeText={(text) => updateField('reps', text)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              value={String(form.calories)}
              onChangeText={(text) => updateField('calories', text)}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Energy (kJ)</Text>
            <TextInput
              style={styles.input}
              value={String(form.energy)}
              onChangeText={(text) => updateField('energy', text)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={String(form.weight)}
          onChangeText={(text) => updateField('weight', text)}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomizeSharingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2F2F32',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#9DEC2C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
