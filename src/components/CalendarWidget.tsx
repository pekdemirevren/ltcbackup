import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface CalendarWidgetProps {
    onPress: () => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onPress }) => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const monthName = today.toLocaleDateString('en-US', { month: 'short' });
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}>
            {/* Header - Month/Year */}
            <View style={styles.header}>
                <Text style={styles.monthText}>{monthName}</Text>
                <Feather name="calendar" size={16} color="#8E8E93" />
            </View>

            {/* Day Number - Large */}
            <Text style={styles.dayNumber}>{dayOfMonth}</Text>

            {/* Day Name */}
            <Text style={styles.dayName}>{dayName}</Text>

            {/* Indicator Row */}
            <View style={styles.indicatorRow}>
                <View style={styles.dot} />
                <Text style={styles.eventCountText}>3 Events</Text>
            </View>
        </TouchableOpacity>
    );
};

export default CalendarWidget;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 16,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dayNumber: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFF',
        marginVertical: 4,
    },
    dayName: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#007AFF',
    },
    eventCountText: {
        fontSize: 12,
        color: '#8E8E93',
    },
});
