
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MetricColors from '../../constants/MetricColors';
import { SquareCardMeasurements } from '../../styles/SquareCardBase';
import { allWorkouts } from '../../constants/workoutData';

interface MetricCardProps {
  compId: string;
  workoutStats: { [key: string]: any };
  totalSets: number;
  averageWeight: number;
  setsChartData: number[];
  weightChartData: number[];
  onPress: () => void;
  isEditing?: boolean;
}

const renderBarChart = (data: number[], color: string, guideColor?: string) => {
    const max = Math.max(...data, 1);
    const chartHeight = 70;
    const _guideColor = guideColor || '#5E5E61';

    return (
      <View style={styles.barChartContainer}>
        {data.map((val, i) => (
          <View key={i} style={{ width: 3, height: chartHeight, justifyContent: 'flex-end' }}>
            <View style={{ ...styles.bar, height: chartHeight, backgroundColor: _guideColor, position: 'absolute', bottom: 0 }} />
            {val > 0 && (
              <View style={{ ...styles.bar, height: Math.max((val / max) * chartHeight * 0.8, 4), backgroundColor: color }} />
            )}
          </View>
        ))}
        <View style={styles.chartLabelsOverlay}>
          <Text style={styles.chartLabelText}>00</Text>
          <Text style={styles.chartLabelText}>06</Text>
          <Text style={styles.chartLabelText}>12</Text>
          <Text style={styles.chartLabelText}>18</Text>
        </View>
      </View>
    );
  };


export const MetricCard: React.FC<MetricCardProps> = ({
  compId,
  workoutStats,
  totalSets,
  averageWeight,
  setsChartData,
  weightChartData,
  onPress,
  isEditing,
}) => {
  const metrics: { [key: string]: any } = {
    'SetCount': { title: 'Set Count', color: MetricColors.sets, val: totalSets, unit: 'SET', chart: setsChartData },
    'StrengthLevel': { title: 'Strength Level', color: MetricColors.weight, val: averageWeight, unit: 'KG', chart: weightChartData },
  };

  const m = metrics[compId];

  if (compId.startsWith('Trends_')) {
    return null;
  }

  if (!m) {
    if (compId.includes('_')) {
      const lastUnderscoreIndex = compId.lastIndexOf('_');
      const wId = compId.substring(0, lastUnderscoreIndex);
      const metricId = compId.substring(lastUnderscoreIndex + 1);

      const workout = allWorkouts.find(w => w.workoutId === wId);
      const stats = workoutStats[wId];

      if (!workout || !stats) return null;

      let title = workout.name;
      let color = '#FFF', unit = '', value = '', chart: number[] = [], subLabel = 'Weekly';

      if (metricId === 'SetCount') { color = MetricColors.sets; unit = 'SET'; value = stats.weeklySets.toString(); chart = stats.charts.weeklySets; title += ' Sets'; }
      else if (metricId === 'StrengthLevel') { color = MetricColors.weight; unit = 'KG'; value = stats.weeklyStrength.toString(); chart = stats.charts.weeklyStrength; title += ' Strength'; }
      else if (metricId === 'Cadence') { color = MetricColors.speed; unit = 's/r'; value = stats.weeklyCadence.toString(); chart = stats.charts.weeklyCadence; title += ' Cadence'; }
      else if (metricId === 'Intensity') { color = MetricColors.energy; unit = ''; value = stats.weeklyIntensity; chart = stats.charts.weeklyIntensity; title += ' Intensity'; }
      else if (metricId === 'Density') { color = '#9DEC2C'; unit = '%'; value = stats.weeklyDensity.toString(); chart = stats.charts.weeklyDensity || []; title += ' Density'; }
      else if (metricId === 'Balance') { color = '#EC4899'; unit = '%'; value = stats.weeklyBalance.toString(); chart = []; title += ' Balance'; }

      return (
        <TouchableOpacity
          key={compId}
          style={[styles.halfCard, { height: 171, paddingTop: 12, paddingBottom: 6 }]}
          onPress={onPress}
          activeOpacity={1}
          disabled={isEditing}
        >
          <View style={styles.cardHeaderRow}>
            {workout.SvgIcon && <workout.SvgIcon width={21} height={21} fill="#FFF" />}
            <Text style={[styles.cardTitle, { fontSize: 13, textTransform: 'none' }]} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 4 }]}>{subLabel}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
            <Text style={[styles.metricValue, { color, fontSize: 30, fontWeight: '700' }]}>
              {value}{' '}
              <Text style={[styles.unit, { fontSize: 20, fontWeight: '700' }]}>{unit}</Text>
            </Text>
          </View>
          <View style={[styles.barChartContainer, { height: 50 }]}>
            <View style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              {chart.slice(0, 7).map((val: number, i: number) => {
                const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                const maxVal = Math.max(...chart.slice(0, 7), 1);
                const barHeight = (val / maxVal) * 30;
                return (
                  <React.Fragment key={i}>
                    <View style={{ width: 0.8, height: 48, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                    <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                      <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: color, borderRadius: 3 }]} />
                      <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
                    </View>
                    {i === 6 && (
                      <View style={{ width: 0.8, height: 48, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
          <Text style={[styles.workoutTodayFooter, { marginTop: -10 }]}>
            <Text style={{ color: '#FFF' }}>Today: </Text>
            <Text style={{ color }}>{value} {unit}</Text>
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  if (compId === 'SetCount' || compId === 'StrengthLevel') {
    const cardColor = '#1F1F20';
    const chartColor = '#5E5E61';

    return (
      <TouchableOpacity
        style={[styles.halfCard, { backgroundColor: cardColor }]}
        onPress={onPress}
        activeOpacity={1}
        disabled={isEditing}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{m.title}</Text>
        </View>
        <Text style={styles.workoutSubLabel}>Today</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
          <Text style={[styles.workoutMetricValue, { color: m.color }]}>
            {m.val}
          </Text>
          <Text style={[styles.workoutUnit, { color: m.color }]}>{m.unit}</Text>
        </View>
        <View style={styles.workoutChartContainer}>
          {renderBarChart(m.chart, chartColor, chartColor)}
        </View>
        <Text style={styles.workoutTodayFooter}>
          <Text style={{ color: '#FFF' }}>Today: </Text>
          <Text style={{ color: m.color }}>{m.val} {m.unit}</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
    halfCard: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#1F1F20', // Updated default, but can be overridden inline
        borderRadius: SquareCardMeasurements.borderRadius,
        padding: SquareCardMeasurements.padding,
        justifyContent: 'space-between',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 0,
        gap: 6,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
        flex: 1,
    },
    workoutSubLabel: {
        fontSize: 13,
        color: '#FFF',
        marginTop: 4,
    },
    workoutMetricValue: {
        fontSize: 30,
        fontWeight: '700',
    },
    workoutUnit: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 2,
    },
    workoutChartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 55,
        marginTop: 0,
        paddingBottom: 6,
        overflow: 'hidden',
    },
    barChartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 70,
        marginBottom: 0,
        position: 'relative',
    },
    chartLabelsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chartLabelText: {
        fontSize: 10,
        color: '#8E8E93',
        backgroundColor: '#2A292A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        textAlign: 'center',
    },
    bar: {
        borderRadius: 1.5,
    },
    workoutTodayFooter: {
        color: '#FFF',
        fontSize: 14,
        marginTop: -10,
        fontWeight: '500',
    },
    subLabel: {
        fontSize: 12,
        color: '#FFF',
        marginBottom: 4,
        textTransform: 'uppercase',
      },
      metricValue: {
        fontSize: 30,
        fontWeight: '500',
        marginBottom: 8,
      },
      unit: {
        fontSize: 22,
        fontWeight: '500',
      },
});
