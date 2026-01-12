import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WIDGET_SIZE = (SCREEN_WIDTH - 48) / 2; // Roughly square widget for 2-column layout

const MONTHS_FULL = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface CalendarWidgetProps {
    onPress?: () => void;
}

export default function CalendarWidget({ onPress }: CalendarWidgetProps) {
    const now = new Date();

    const days = useMemo(() => {
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDayOfWeek = firstDay.getDay() - 1; // Monday start
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const d: (number | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            d.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            d.push(i);
        }
        return d;
    }, []);

    const weeks = useMemo(() => {
        const w = [];
        for (let i = 0; i < days.length; i += 7) {
            w.push(days.slice(i, i + 7));
        }
        return w;
    }, [days]);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Text style={styles.monthTitle}>{MONTHS_FULL[now.getMonth()]}</Text>

            <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, idx) => (
                    <Text key={idx} style={[styles.weekdayText, (idx >= 5) && styles.weekendText]}>
                        {day}
                    </Text>
                ))}
            </View>

            <View style={styles.grid}>
                {weeks.map((week, weekIdx) => (
                    <View key={weekIdx} style={styles.weekRow}>
                        {week.map((day, dayIdx) => {
                            const isToday = day === now.getDate();
                            return (
                                <View key={dayIdx} style={styles.dayCell}>
                                    {day !== null && (
                                        <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                                            <Text style={[
                                                styles.dayText,
                                                isToday && styles.todayText,
                                                (dayIdx >= 5 && !isToday) && styles.weekendText
                                            ]}>
                                                {day}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: WIDGET_SIZE,
        height: WIDGET_SIZE,
        backgroundColor: '#1C1C1E', // Dark grey iOS widget background
        borderRadius: 22, // iOS smooth corners
        padding: 12,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    monthTitle: {
        color: '#FF3B30', // iOS Red
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 2,
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    weekdayText: {
        flex: 1,
        color: '#8E8E93',
        fontSize: 8,
        fontWeight: '600',
        textAlign: 'center',
    },
    grid: {
        flex: 1,
    },
    weekRow: {
        flexDirection: 'row',
        height: 18,
    },
    dayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCircle: {
        backgroundColor: '#FF3B30',
    },
    dayText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '500',
    },
    todayText: {
        fontWeight: '700',
    },
    weekendText: {
        color: '#48484A', // Darker grey for weekends
    },
});
