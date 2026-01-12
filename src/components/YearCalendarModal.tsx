import React, { useMemo, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface YearCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onMonthSelect: (year: number, monthIndex: number) => void;
    initialYear?: number;
}

const YearCalendarModal: React.FC<YearCalendarModalProps> = ({ visible, onClose, onMonthSelect, initialYear }) => {
    // Memoized year data for FlatList performance (2026-2050)
    const yearData = useMemo(() => {
        const years = [];
        for (let y = 2026; y <= 2050; y++) {
            years.push(y);
        }
        return years;
    }, []);

    // Get mini calendar for a month - memoized helper
    const getMiniMonthDays = useCallback((year: number, month: number): (number | null)[] => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (number | null)[] = [];

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(d);
        }

        return days;
    }, []);

    // Render a single year item for FlatList
    const renderYearItem = useCallback(({ item: year }: { item: number }) => {
        const today = new Date();
        // Highlight current year or default 2026
        const isCurrentYear = today.getFullYear() === year || (year === 2026 && today.getFullYear() < 2026);

        return (
            <View style={styles.yearSection}>
                {/* Year Title */}
                <Text style={[styles.yearTitle, isCurrentYear && styles.currentYearTitle]}>{year}</Text>
                <View style={styles.yearTitleSeparator} />

                {/* 12 months grid for this year */}
                <View style={styles.monthsGrid}>
                    {MONTHS.map((monthName, monthIndex) => {
                        const days = getMiniMonthDays(year, monthIndex);
                        const isCurrentMonth = isCurrentYear && today.getMonth() === monthIndex;

                        return (
                            <TouchableOpacity
                                key={`${year}-${monthName}`}
                                style={styles.miniMonthContainer}
                                onPress={() => onMonthSelect(year, monthIndex)}
                                activeOpacity={1}
                            >
                                <Text style={[
                                    styles.miniMonthTitle,
                                    isCurrentMonth && styles.currentMonthTitle,
                                ]}>
                                    {monthName.substring(0, 3)}
                                </Text>

                                {/* Mini weekday header */}
                                <View style={styles.miniWeekdayRow}>
                                    {WEEKDAYS.map((day, i) => (
                                        <Text key={i} style={styles.miniWeekdayText}>{day}</Text>
                                    ))}
                                </View>

                                {/* Mini days grid */}
                                <View style={styles.miniDaysGrid}>
                                    {days.map((day, dayIndex) => {
                                        const isTodayDay = day !== null &&
                                            isCurrentYear &&
                                            today.getDate() === day &&
                                            today.getMonth() === monthIndex;

                                        return (
                                            <View key={dayIndex} style={styles.miniDayCell}>
                                                {day !== null && (
                                                    <View style={[
                                                        styles.miniDayCircle,
                                                        isTodayDay && styles.miniTodayCircle,
                                                    ]}>
                                                        <Text style={[
                                                            styles.miniDayText,
                                                            isTodayDay && styles.miniTodayText,
                                                        ]}>
                                                            {day}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    }, [getMiniMonthDays, onMonthSelect]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.yearPickerContainer}>
                {/* Header */}
                <View style={styles.yearPickerHeader}>
                    <View style={{ width: 80 }} />
                    <View style={styles.headerRightPill}>
                        <TouchableOpacity style={styles.headerRightIcon}>
                            <Feather name="search" size={18} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerRightSeparator} />
                        <TouchableOpacity
                            style={styles.headerRightIcon}
                            onPress={onClose}
                        >
                            <Feather name="plus" size={22} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FlatList for years */}
                <FlatList
                    data={yearData}
                    renderItem={renderYearItem}
                    keyExtractor={(item) => item.toString()}
                    style={styles.yearScrollView}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={2}
                    maxToRenderPerBatch={2}
                    windowSize={5}
                    removeClippedSubviews={true}
                    getItemLayout={(_, index) => ({
                        length: 450, // Approx height of year section
                        offset: 450 * index,
                        index,
                    })}
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />

                {/* Bottom bar */}
                <View style={styles.yearPickerBottomBar}>
                    <TouchableOpacity
                        style={styles.todayPill}
                        onPress={() => {
                            const today = new Date();
                            onMonthSelect(today.getFullYear(), today.getMonth());
                        }}
                    >
                        <Text style={styles.todayPillText}>Today</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    yearPickerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    yearPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        height: 60,
    },
    headerRightPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        height: 48,
        paddingHorizontal: 4,
        borderWidth: 0.8,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerRightIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRightSeparator: {
        width: 0.8,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    yearScrollView: {
        flex: 1,
        paddingHorizontal: 8,
    },
    yearSection: {
        marginBottom: 16,
    },
    yearTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FF3B30', // Red for 2026/Current
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    currentYearTitle: {
        color: '#FF3B30',
    },
    yearTitleSeparator: {
        height: 1,
        backgroundColor: '#333',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    miniMonthContainer: {
        width: (SCREEN_WIDTH - 48) / 3,
        marginBottom: 24,
    },
    miniMonthTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 8,
    },
    currentMonthTitle: {
        color: '#FF3B30',
    },
    miniWeekdayRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    miniWeekdayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 9,
        color: '#8E8E93',
        fontWeight: '500',
    },
    miniDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    miniDayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniDayCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniTodayCircle: {
        backgroundColor: '#FF3B30',
    },
    miniDayText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '400',
    },
    miniTodayText: {
        color: '#FFF',
        fontWeight: '600',
    },
    yearPickerBottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 40,
        backgroundColor: '#000', // Or transparent with blur? IOS is blurred. Solid for now.
    },
    todayPill: {
        alignSelf: 'flex-start',
    },
    todayPillText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '500',
    },
});

export default YearCalendarModal;
