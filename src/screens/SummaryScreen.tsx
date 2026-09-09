import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { calculateCalories } from '../utils/CalorieCalculator';
import { parseStoredBodyWeight, DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';

type SummaryScreenProps = StackScreenProps<RootStackParamList, 'SummaryOverview'>;

export default function SummaryScreen(_props: SummaryScreenProps) {
  const [dailyEnergy, setDailyEnergy] = useState<number | null>(null);
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(DEFAULT_BODY_WEIGHT_KG);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('userBodyWeight');
        const parsed = parseStoredBodyWeight(stored);
        setBodyWeightKg(parsed);

        const kcal = calculateCalories({
          workoutId: 'outdoor_walk',
          durationSeconds: 30 * 60,
          bodyWeightKg: parsed,
          liftedWeightKg: 0,
          reps: 0,
        });
        setDailyEnergy(kcal);
      } catch (e) {
        console.warn('SummaryScreen: failed to load data', e);
      }
    };

    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.label}>Body weight</Text>
        <Text style={styles.value}>{bodyWeightKg} kg</Text>
        <Text style={[styles.label, { marginTop: 12 }]}>Estimated energy (example)</Text>
        <Text style={styles.value}>{dailyEnergy ?? '—'} kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
    minHeight: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
