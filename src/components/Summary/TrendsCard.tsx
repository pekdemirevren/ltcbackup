
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TrendsSquareCardStyle } from '../../styles/trendssquarecardstyle';
import MetricColors from '../../constants/MetricColors';

interface TrendsCardProps {
    type: 'Grid' | 'Square';
    trendStats: any;
    onPress: (trend: any) => void;
    isEditing?: boolean;
    card?: any;
}

export const TrendsCard: React.FC<TrendsCardProps> = ({
    type,
    trendStats,
    onPress,
    isEditing,
    card,
}) => {
    if (type === 'Square' && card) {
        return (
            <TouchableOpacity
                style={TrendsSquareCardStyle.trendSquareCard}
                onPress={() => onPress(card)}
                activeOpacity={1}
                disabled={isEditing}
            >
                <Text style={TrendsSquareCardStyle.trendSquareHeader}>Trends</Text>
                <View style={[TrendsSquareCardStyle.trendSquareIconWrapper, { overflow: 'hidden' }]}>
                    <MaterialCommunityIcons name="trending-up" size={48} color={card.color} />
                </View>
                <Text style={TrendsSquareCardStyle.trendSquareLabel}>{card.title}</Text>
                <Text style={[TrendsSquareCardStyle.trendSquareValue, { color: card.color }]}>
                    {card.val} {card.unit}
                </Text>
            </TouchableOpacity>
        );
    }

    const trends = [
        { label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => onPress({ modal: 'energy' }) },
        { label: 'Strength', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => onPress({ modal: 'strength' }) },
        { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => onPress({ modal: 'sets' }) },
        { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => onPress({ modal: 'consistency' }) }
    ];

    return (
        <TouchableOpacity
            onPress={() => onPress({ screen: 'Trends' })}
            activeOpacity={1}
            disabled={isEditing}
            style={[styles.sectionCard, TrendsSquareCardStyle.trendsGridContainer]}
        >
            <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
            <View style={TrendsSquareCardStyle.trendGrid}>
                {trends.map((t, idx) => (
                    <TouchableOpacity
                        key={idx}
                        onPress={t.action}
                        activeOpacity={1}
                        disabled={isEditing}
                        style={TrendsSquareCardStyle.trendItem}
                    >
                        <View style={[TrendsSquareCardStyle.trendIconDown, { backgroundColor: t.color }]}>
                            <MaterialCommunityIcons name="trending-up" size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text>
                            <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>
                                {t.val} {t.unit}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
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
});
