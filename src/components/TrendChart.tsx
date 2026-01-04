import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TrendChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    showAverage?: boolean;
    unit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    data,
    labels,
    color = '#0A84FF',
    height = 200,
    showAverage = true,
    unit = '',
}) => {
    const chartWidth = SCREEN_WIDTH - 80; // Account for padding and y-axis
    const chartHeight = height;

    const maxVal = Math.max(...data, 1);
    const average = data.reduce((a, b) => a + b, 0) / data.length;

    // Calculate scale - round up to nice number
    const scaleMax = Math.ceil(maxVal * 1.1);

    // Generate Y-axis labels
    const yAxisMax = scaleMax;
    const yAxisMid = Math.round(scaleMax / 2);

    return (
        <View style={styles.container}>
            <View style={styles.chartWrapper}>
                {/* Chart Area */}
                <View style={[styles.chartArea, { height: chartHeight }]}>
                    <Svg width={chartWidth} height={chartHeight} style={styles.svg}>
                        {/* Grid Lines - Horizontal */}
                        <Line
                            x1="0"
                            y1="0"
                            x2={chartWidth}
                            y2="0"
                            stroke="#2C2C2E"
                            strokeWidth="1"
                        />
                        <Line
                            x1="0"
                            y1={chartHeight / 2}
                            x2={chartWidth}
                            y2={chartHeight / 2}
                            stroke="#2C2C2E"
                            strokeWidth="1"
                        />
                        <Line
                            x1="0"
                            y1={chartHeight}
                            x2={chartWidth}
                            y2={chartHeight}
                            stroke="#2C2C2E"
                            strokeWidth="1"
                        />

                        {/* Average Line (Dashed) */}
                        {showAverage && average > 0 && (
                            <>
                                <Line
                                    x1="0"
                                    y1={chartHeight - (average / scaleMax) * chartHeight}
                                    x2={chartWidth}
                                    y2={chartHeight - (average / scaleMax) * chartHeight}
                                    stroke="#636366"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                />
                                {/* Average Value Badge */}
                                <Rect
                                    x={chartWidth / 2 - 15}
                                    y={chartHeight - (average / scaleMax) * chartHeight - 12}
                                    width="30"
                                    height="18"
                                    fill="#2C2C2E"
                                    rx="9"
                                />
                                <SvgText
                                    x={chartWidth / 2}
                                    y={chartHeight - (average / scaleMax) * chartHeight - 1}
                                    fill="#8E8E93"
                                    fontSize="11"
                                    fontWeight="600"
                                    textAnchor="middle"
                                >
                                    {average.toFixed(1)}
                                </SvgText>
                            </>
                        )}

                        {/* Bars */}
                        {data.map((val, i) => {
                            const barWidth = (chartWidth / data.length) * 0.5; // Thinner bars
                            const barHeight = Math.max((val / scaleMax) * chartHeight, 2);
                            const x = (i / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2;
                            const y = chartHeight - barHeight;

                            // Determine if this bar should be highlighted (recent data)
                            const isHighlighted = i >= data.length - 2; // Last 2 bars highlighted
                            const barColor = isHighlighted ? color : '#3A3A3C';

                            return (
                                <Rect
                                    key={`bar-${i}`}
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={barColor}
                                    rx="2"
                                />
                            );
                        })}
                    </Svg>

                    {/* X-Axis Labels */}
                    <View style={styles.xAxisContainer}>
                        {labels.map((label, i) => {
                            const leftPosition = ((i + 0.5) / labels.length) * 100;
                            return (
                                <Text
                                    key={`x-label-${i}`}
                                    style={[
                                        styles.xAxisLabel,
                                        { left: `${leftPosition}%` }
                                    ]}
                                >
                                    {label}
                                </Text>
                            );
                        })}
                    </View>
                </View>

                {/* Y-Axis Labels (Right Side) */}
                <View style={[styles.yAxis, { height: chartHeight }]}>
                    <Text style={[styles.yAxisLabel, { top: -6 }]}>
                        {yAxisMax}
                    </Text>
                    <Text style={[styles.yAxisLabel, { top: chartHeight / 2 - 6 }]}>
                        {yAxisMid}
                    </Text>
                    <Text style={[styles.yAxisLabel, { bottom: -6 }]}>
                        0
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    chartWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
        marginBottom: 24,
    },
    svg: {
        overflow: 'visible',
    },
    xAxisContainer: {
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        height: 20,
        flexDirection: 'row',
    },
    xAxisLabel: {
        position: 'absolute',
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '400',
        width: 30,
        textAlign: 'center',
        marginLeft: -15,
    },
    yAxis: {
        width: 40,
        position: 'relative',
        paddingLeft: 8,
    },
    yAxisLabel: {
        position: 'absolute',
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '400',
        right: 0,
    },
});
