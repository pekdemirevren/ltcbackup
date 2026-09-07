import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { CalendarConfig } from '../config/CalendarConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface CalendarHeaderProps {
    headerMonth: Date;
    onTodayPress: () => void;
    onYearPress: () => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
    showNavigation?: boolean;
}

export const CalendarHeader = React.memo(({
    headerMonth,
    onTodayPress,
    onYearPress,
    onPrevMonth,
    onNextMonth,
    showNavigation = true,
}: CalendarHeaderProps) => {
    const headerTitle = `${MONTHS_FULL[headerMonth.getMonth()]} ${headerMonth.getFullYear()}`;

    return (
        <View style={styles.container}>
            {/* Month/Year Title */}
            <View style={styles.titleContainer}>
                <TouchableOpacity onPress={onYearPress} style={styles.titleButton}>
                    <Text style={styles.monthText}>{headerTitle}</Text>
                    <Feather name="chevron-down" size={16} color="#FFFFFF" style={styles.chevron} />
                </TouchableOpacity>
            </View>

            {/* Today Button */}
            <TouchableOpacity onPress={onTodayPress} style={styles.todayButton}>
                <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>

            {/* Weekday Header */}
            <View style={styles.weekdayHeader}>
                {WEEKDAYS.map((day, idx) => (
                    <View key={idx} style={styles.weekdayCell}>
                        <Text style={[styles.weekdayText, idx >= 5 && styles.weekendText]}>
                            {day}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: 'transparent',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    chevron: {
        marginLeft: 4,
    },
    todayButton: {
        position: 'absolute',
        right: 16,
        top: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
    },
    todayText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    weekdayHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    weekendText: {
        color: '#636366',
    },
});
