
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { allWorkouts, Workout } from '../../constants/workoutData';
import { WorkoutSquareCardStyle } from '../../styles/workoutsquarecardstyle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WorkoutCardProps {
    type: 'Shortcuts' | 'Square';
    shortcuts: Workout[];
    latestSession: any;
    onPress: (workout: Workout) => void;
    isEditing?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
    type,
    shortcuts,
    latestSession,
    onPress,
    isEditing,
}) => {
    if (type === 'Square') {
        const latest = latestSession
            ? allWorkouts.find(w => w.workoutId === latestSession.workoutId)
            : allWorkouts[0];
        const SvgIcon = latest?.SvgIcon;

        return (
            <TouchableOpacity
                onPress={() => latest && onPress(latest)}
                activeOpacity={1}
                disabled={isEditing}
                style={WorkoutSquareCardStyle.workoutSquareCard}
            >
                <Text style={WorkoutSquareCardStyle.workoutSquareCardTitle}>Workout</Text>
                {SvgIcon && (
                    <View style={WorkoutSquareCardStyle.workoutIcon}>
                        <SvgIcon width={135} height={135} fill="#9DEC2C" />
                    </View>
                )}
                <Text style={WorkoutSquareCardStyle.workoutName}>
                    {latest?.name || 'Workout'}
                </Text>
                <Text style={WorkoutSquareCardStyle.startWorkoutLabel}>Start Workout</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.sectionCard, { paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8 }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { }}>
                <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 4, marginBottom: 12, fontSize: 17 }]}>Workout</Text>
            </TouchableOpacity>
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                paddingHorizontal: 8,
                justifyContent: 'flex-start',
            }}>
                {shortcuts.slice(0, 4).map((workout: Workout, index: number) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            width: (SCREEN_WIDTH - 32 - 16 - 8) / 2,
                            borderRadius: 16,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            borderWidth: 0,
                            marginBottom: 2,
                        }}
                        onPress={() => onPress(workout)}
                        activeOpacity={1}
                        disabled={isEditing}
                    >
                        {workout.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}
                        <Text style={styles.shortcutName} numberOfLines={1}>{workout.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: '#2A292A',
        borderRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 2,
        marginBottom: 0,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 10,
    },
    shortcutName: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'left',
    },
});
