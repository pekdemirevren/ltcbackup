import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Text, StatusBar } from 'react-native';
import ActivityCard from '../components/ActivityCard';

const ActivitySummaryDemoScreen = () => {
    // Sample Data
    const runningData = {
        iconName: 'running',
        title: 'Running',
        weeklyDistance: 25.00,
        unit: 'KM',
        todayDistance: 7.00,
        dailyData: [
            { value: 5, isToday: false },
            { value: 0, isToday: false },
            { value: 8, isToday: false },
            { value: 5, isToday: false },
            { value: 7, isToday: true },
            { value: 0, isToday: false },
            { value: 0, isToday: false },
        ],
    };

    const cyclingData = {
        iconName: 'biking',
        title: 'Cycling',
        weeklyDistance: 80.00,
        unit: 'KM',
        todayDistance: 25.00,
        dailyData: [
            { value: 20, isToday: false },
            { value: 0, isToday: false },
            { value: 35, isToday: false },
            { value: 0, isToday: false },
            { value: 25, isToday: true },
            { value: 0, isToday: false },
            { value: 0, isToday: false },
        ],
    };

    const swimmingData = {
        iconName: 'swimmer',
        title: 'Swimming',
        weeklyDistance: 3.00,
        unit: 'KM',
        todayDistance: 1.00,
        dailyData: [
            { value: 1, isToday: false },
            { value: 0, isToday: false },
            { value: 2, isToday: true },
            { value: 0, isToday: false },
            { value: 0, isToday: false },
            { value: 0, isToday: false },
            { value: 0, isToday: false },
        ],
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.screenTitle}>Add a Card to Your Summary</Text>
                <ActivityCard {...runningData} />
                <ActivityCard {...cyclingData} />
                <ActivityCard {...swimmingData} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    screenTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
    }
});

export default ActivitySummaryDemoScreen;
