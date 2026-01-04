import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function WorkoutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout</Text>
      
      {/* Workout kartları buraya gelecek */}
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>Outdoor Run</Text>
      </View>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>Outdoor Cycle</Text>
      </View>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>Hiking</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  workoutCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});