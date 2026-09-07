import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { ALL_WORKOUT_DAYS, WORKOUT_DAY_COLORS, WorkoutDayType } from '../../utils/WorkoutDayManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WorkoutDayPickerProps {
    visible: boolean;
    date: Date;
    selectedWorkoutDay: WorkoutDayType | null;
    onClose: () => void;
    onSave: (workoutDay: WorkoutDayType | null) => void;
    MONTHS_FULL: string[];
    WEEKDAYS_FULL: string[];
}

export const WorkoutDayPicker = ({
    visible,
    date,
    selectedWorkoutDay,
    onClose,
    onSave,
    MONTHS_FULL,
    WEEKDAYS_FULL
}: WorkoutDayPickerProps) => {
    const slideAnim = useSharedValue(SCREEN_HEIGHT);
    const [localSelected, setLocalSelected] = React.useState<WorkoutDayType | null>(selectedWorkoutDay);

    useEffect(() => {
        if (visible) {
            setLocalSelected(selectedWorkoutDay);
            slideAnim.value = withSpring(0, { damping: 25, stiffness: 100 });
        } else {
            slideAnim.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        }
    }, [visible, selectedWorkoutDay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: slideAnim.value }],
    }));

    const handleSave = () => {
        onSave(localSelected);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View style={[styles.modalContainer, animatedStyle]}>
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Set Workout Day</Text>

                        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                            <Feather name="check" size={24} color="#9DEC2C" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateSection}>
                        <Text style={styles.dateText}>
                            {date.getDate()} {MONTHS_FULL[date.getMonth()]} {date.getFullYear()}
                        </Text>
                        <Text style={styles.dateSubtext}>
                            {WEEKDAYS_FULL[date.getDay()]}
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.gridContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {ALL_WORKOUT_DAYS.map((day: WorkoutDayType) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayCard,
                                    localSelected === day && {
                                        borderColor: WORKOUT_DAY_COLORS[day],
                                        borderWidth: 2,
                                    }
                                ]}
                                onPress={() => setLocalSelected(day)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.dayCardColor,
                                        { backgroundColor: WORKOUT_DAY_COLORS[day] }
                                    ]}
                                />
                                <Text style={styles.dayCardText}>{day}</Text>
                                {localSelected === day && (
                                    <View style={styles.checkmarkContainer}>
                                        <Feather name="check" size={18} color={WORKOUT_DAY_COLORS[day]} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Option to clear */}
                        <TouchableOpacity
                            style={[
                                styles.dayCard,
                                localSelected === null && {
                                    borderColor: '#FFF',
                                    borderWidth: 2,
                                }
                            ]}
                            onPress={() => setLocalSelected(null)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.dayCardColor, { backgroundColor: '#333' }]} />
                            <Text style={styles.dayCardText}>None / Rest Day</Text>
                            {localSelected === null && (
                                <View style={styles.checkmarkContainer}>
                                    <Feather name="check" size={18} color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.8,
        paddingBottom: 40,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#666',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(157, 236, 44, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    dateSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    dateText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFF',
    },
    dateSubtext: {
        fontSize: 15,
        color: '#8E8E93',
        marginTop: 4,
    },
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    gridContainer: {
        padding: 16,
    },
    dayCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dayCardColor: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 14,
    },
    dayCardText: {
        fontSize: 17,
        color: '#FFF',
        fontWeight: '500',
    },
    checkmarkContainer: {
        marginLeft: 'auto',
    },
});
