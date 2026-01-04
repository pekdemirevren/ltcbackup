import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type AllSetsMetricsScreenProps = StackScreenProps<RootStackParamList, 'AllSetsMetrics'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFrame = 'D' | 'W' | 'M' | 'Y';

export default function AllSetsMetricsScreen({ navigation }: AllSetsMetricsScreenProps) {
  const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('D');
  const [setsData, setSetsData] = useState<number[]>([]);
  const [repsData, setRepsData] = useState<number[]>([]);
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedFrame])
  );

  const loadData = async () => {
    try {
        const stored = await AsyncStorage.getItem('workoutSummaries');
        if (!stored) return;
        const allSummaries = JSON.parse(stored);
        
        const now = new Date();
        let filtered = [];
        let sData: number[] = [];
        let rData: number[] = [];

        // Helper to check if same day
        const isSameDay = (d1: Date, d2: Date) => 
            d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

        if (selectedFrame === 'D') {
            sData = new Array(24).fill(0);
            rData = new Array(24).fill(0);
            filtered = allSummaries.filter((s: any) => isSameDay(new Date(s.date), now));
            filtered.forEach((s: any) => {
                const h = new Date(s.date).getHours();
                sData[h] += (s.completedSets || 0);
                rData[h] += (s.completedReps || 0);
            });
        } else if (selectedFrame === 'W') {
            sData = new Array(7).fill(0);
            rData = new Array(7).fill(0);
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(now.getDate() - (6 - i));
                const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
                daySummaries.forEach((s: any) => {
                    sData[i] += (s.completedSets || 0);
                    rData[i] += (s.completedReps || 0);
                });
            }
        } else if (selectedFrame === 'M') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            sData = new Array(daysInMonth).fill(0);
            rData = new Array(daysInMonth).fill(0);
            filtered = allSummaries.filter((s: any) => {
                const d = new Date(s.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            filtered.forEach((s: any) => {
                const day = new Date(s.date).getDate() - 1;
                if (day >= 0 && day < daysInMonth) {
                    sData[day] += (s.completedSets || 0);
                    rData[day] += (s.completedReps || 0);
                }
            });
        } else if (selectedFrame === 'Y') {
            sData = new Array(12).fill(0);
            rData = new Array(12).fill(0);
            filtered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());
            filtered.forEach((s: any) => {
                const m = new Date(s.date).getMonth();
                sData[m] += (s.completedSets || 0);
                rData[m] += (s.completedReps || 0);
            });
        }

        setSetsData(sData);
        setRepsData(rData);
        
        setTotalSets(Math.round(sData.reduce((a, b) => a + b, 0)));
        setTotalReps(Math.round(rData.reduce((a, b) => a + b, 0)));

    } catch (e) {
        console.error(e);
    }
  };

  const getLabels = () => {
      switch(selectedFrame) {
          case 'D': return ['00', '06', '12', '18'];
          case 'W': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          case 'M': return ['1', '8', '15', '22', '29'];
          case 'Y': return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      }
  };

  const renderChart = (title: string, value: string, data: number[], color: string, unit: string = '') => {
    const maxVal = Math.max(...data, 1);
    
    let yLabels = [0, 0];
    let scaleMax = 1;

    // Simple scaling logic
    yLabels = [Math.round(maxVal), Math.round(maxVal / 2)];
    scaleMax = maxVal;
    
    const CHART_HEIGHT = 150;

    // Determine vertical grid lines based on selectedFrame
    let verticalLines: number[] = [];
    if (selectedFrame === 'W') {
        for (let i = 0; i <= 7; i++) {
            verticalLines.push((i / 7) * 100);
        }
    } else {
        verticalLines = [0, 25, 50, 75, 100];
    }

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{title}</Text>
            <Text style={[styles.chartValue, { color: color }]}>{value}<Text style={styles.chartUnit}>{unit}</Text></Text>
        </View>

        <View style={styles.chartWrapper}>
            <View style={styles.chartArea}>
                {/* Static Grid Background */}
                <View style={styles.gridContainer}>
                    <View style={[styles.gridLine, { top: 0 }]} />
                    <View style={[styles.gridLine, { top: '50%' }]} />
                    <View style={[styles.gridLine, { bottom: 0 }]} />

                    {verticalLines.map((leftPct, i) => (
                        <View key={i} style={[styles.verticalGridLine, { left: `${leftPct}%` }]} />
                    ))}
                </View>

                {/* Bars Layer */}
                <View style={[styles.barsContainer, { justifyContent: 'flex-start' }]}>
                    {data.map((val, i) => {
                        const barHeight = Math.min((val / scaleMax) * CHART_HEIGHT, CHART_HEIGHT);
                        const barWidthPct = 100 / data.length;
                        return (
                            <View key={i} style={[styles.barColumn, { width: `${barWidthPct}%` }]}>
                                <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
                            </View>
                        );
                    })}
                </View>

                {/* X-Axis Labels */}
                <View style={styles.xAxisContainer}>
                    {getLabels().map((label, i) => {
                        const isGridAligned = selectedFrame === 'D' || selectedFrame === 'M';
                        const isWeekly = selectedFrame === 'W';
                        
                        if (isWeekly) {
                            return (
                                <Text key={i} style={[styles.xAxisLabel, { 
                                    position: 'absolute', 
                                    left: `${(i / 7) * 100}%`, 
                                    marginLeft: 5, 
                                    bottom: -20,
                                    textAlign: 'left'
                                }]}>
                                    {label}
                                </Text>
                            );
                        } else if (isGridAligned) {
                             return (
                                <Text key={i} style={[styles.xAxisLabel, { 
                                    position: 'absolute', 
                                    left: `${i * 25}%`, 
                                    marginLeft: 5, 
                                    bottom: -20,
                                    textAlign: 'left'
                                }]}>
                                    {label}
                                </Text>
                             );
                        } else {
                            const pct = (i / (getLabels().length - 1)) * 100;
                            return (
                                <Text key={i} style={[styles.xAxisLabel, { 
                                    position: 'absolute', 
                                    left: `${pct}%`, 
                                    marginLeft: -15, 
                                    bottom: -20,
                                    textAlign: 'center'
                                }]}>
                                    {label}
                                </Text>
                            );
                        }
                    })}
                </View>
            </View>

            {/* Y-Axis Labels (Right Side) */}
            <View style={styles.yAxis}>
                <Text style={[styles.axisLabel, { top: -6 }]}>{yLabels[0]}</Text>
                <Text style={[styles.axisLabel, { top: '50%', marginTop: -6 }]}>{yLabels[1]}</Text>
                <Text style={[styles.axisLabel, { bottom: 0 }]}>0</Text>
            </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sets Metrics</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Timeframe Selector */}
        <View style={styles.selectorContainer}>
            {(['D', 'W', 'M', 'Y'] as TimeFrame[]).map((frame) => (
                <TouchableOpacity 
                    key={frame} 
                    style={[styles.selectorButton, selectedFrame === frame && styles.selectorButtonActive]}
                    onPress={() => setSelectedFrame(frame)}
                >
                    <Text style={[styles.selectorText, selectedFrame === frame && styles.selectorTextActive]}>{frame}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Sets Chart */}
        {renderChart('SETS', totalSets.toLocaleString(), setsData, '#F9104F')}

        {/* Reps Chart */}
        {renderChart('REPS', totalReps.toLocaleString(), repsData, '#F9104F')}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 2,
    marginBottom: 24,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16,
  },
  selectorButtonActive: {
    backgroundColor: '#636366',
  },
  selectorText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#FFF',
  },
  chartCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  chartValue: {
    fontSize: 24,
    fontWeight: '500',
  },
  chartUnit: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 180, 
  },
  chartArea: {
    flex: 1,
    height: 150,
    marginRight: 8,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
  },
  verticalGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#333',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%', 
    minHeight: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xAxisContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  yAxis: {
    width: 30,
    height: 150,
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  axisLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'right',
    position: 'absolute',
    right: 0,
  },
});
