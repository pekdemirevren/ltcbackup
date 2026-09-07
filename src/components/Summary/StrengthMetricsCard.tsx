import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SquareCardMeasurements } from '../../styles/SquareCardBase';
import MetricColors from '../../constants/MetricColors';

interface StrengthMetricsCardProps {
    type: 'Grid' | 'Square';
    max1RM: number;
    relativeStrength: number; // Ratio (e.g., 1.5)
    todayVolume: number; // KG
    weeklyVolume: number; // KG
    trend: 'up' | 'down' | 'stable';
    onPress: () => void;
    isEditing?: boolean;
}

/**
 * StrengthMetricsCard - Displays key strength metrics
 * - Max 1RM (Estimated One Rep Max)
 * - Relative Strength (1RM / Body Weight)
 * - Volume (Today & Weekly)
 * - Trend indicator
 */
export const StrengthMetricsCard: React.FC<StrengthMetricsCardProps> = ({
    type,
    max1RM,
    relativeStrength,
    todayVolume,
    weeklyVolume,
    trend,
    onPress,
    isEditing,
}) => {
    const trendColor = trend === 'up' ? '#9DEC2C' : trend === 'down' ? '#FF3B30' : '#8E8E93';
    const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';

    if (type === 'Square') {
        // Single focused metric card (1RM)
        return (
            <TouchableOpacity
                style={styles.squareCard}
                onPress={onPress}
                activeOpacity={1}
                disabled={isEditing}
            >
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color="#F9104E" />
                    <Text style={styles.cardTitle}>Best 1RM</Text>
                </View>
                <View style={styles.mainValueContainer}>
                    <Text style={[styles.mainValue, { color: '#F9104E' }]}>
                        {Math.round(max1RM)}
                    </Text>
                    <Text style={styles.mainUnit}>KG</Text>
                </View>
                <View style={styles.subMetricRow}>
                    <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
                    <Text style={[styles.subMetricValue, { color: trendColor }]}>
                        {relativeStrength.toFixed(2)}xBW
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Grid type: 2x2 mini-metrics
    const metrics = [
        { label: '1RM', value: Math.round(max1RM), unit: 'KG', color: '#F9104E' },
        { label: 'Ratio', value: relativeStrength.toFixed(2), unit: 'xBW', color: '#00C7BE' },
        { label: 'Today', value: Math.round(todayVolume / 1000), unit: 'T', color: '#9DEC2C' },
        { label: 'Week', value: Math.round(weeklyVolume / 1000), unit: 'T', color: MetricColors.weight },
    ];

    return (
        <TouchableOpacity
            style={styles.gridCard}
            onPress={onPress}
            activeOpacity={1}
            disabled={isEditing}
        >
            <View style={styles.gridHeader}>
                <MaterialCommunityIcons name="arm-flex" size={20} color="#F9104E" />
                <Text style={styles.gridTitle}>Strength Metrics</Text>
                <MaterialCommunityIcons name={trendIcon} size={18} color={trendColor} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.metricsGrid}>
                {metrics.map((m, idx) => (
                    <View key={idx} style={styles.metricItem}>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                            <Text style={[styles.metricUnit, { color: m.color }]}>{m.unit}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    squareCard: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#1F1F20',
        borderRadius: SquareCardMeasurements.borderRadius,
        padding: SquareCardMeasurements.padding,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    mainValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    mainValue: {
        fontSize: 48,
        fontWeight: '700',
    },
    mainUnit: {
        fontSize: 24,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        marginLeft: 4,
    },
    subMetricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    subMetricValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Grid Card Styles
    gridCard: {
        backgroundColor: '#2A292A',
        borderRadius: 24,
        padding: 16,
        marginBottom: 0,
    },
    gridHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    gridTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricItem: {
        width: '48%',
        marginBottom: 12,
    },
    metricLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    metricUnit: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 2,
    },
});

export default StrengthMetricsCard;
