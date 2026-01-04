import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface PieData {
    key: string;
    value: number;
    color: string;
    label: string;
}

interface PieChartProps {
    data: PieData[];
    size?: number;
    centerLabel?: string;
    centerSubLabel?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
    data,
    size = 200,
    centerLabel,
    centerSubLabel
}) => {
    const radius = size / 2;
    const total = data.reduce((acc, current) => acc + current.value, 0);

    // Don't render empty chart
    if (total === 0) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <View style={[styles.placeholderRing, { width: size, height: size, borderRadius: size / 2 }]} />
                <View style={styles.centerTextContainer}>
                    <Text style={styles.centerLabel}>0</Text>
                    {centerSubLabel && <Text style={styles.centerSubLabel}>{centerSubLabel}</Text>}
                </View>
            </View>
        );
    }

    let startAngle = 0;

    // Helper to calculate arc path
    const createArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(0, 0, radius, endAngle);
        const end = polarToCartesian(0, 0, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        // Donut hole radius (inner radius)
        const innerRadius = radius * 0.7;
        const startInner = polarToCartesian(0, 0, innerRadius, endAngle);
        const endInner = polarToCartesian(0, 0, innerRadius, startAngle);

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "L", endInner.x, endInner.y,
            "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
            "Z"
        ].join(" ");
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`-${radius} -${radius} ${size} ${size}`}>
                <G>
                    {data.map((slice, index) => {
                        const angle = (slice.value / total) * 360;
                        const path = createArc(startAngle, startAngle + angle - 2); // -2 for small gap
                        const currentStartAngle = startAngle;
                        startAngle += angle;

                        return (
                            <Path
                                key={slice.key}
                                d={path}
                                fill={slice.color}
                            />
                        );
                    })}
                </G>
            </Svg>

            {/* Center Text Overlay */}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
                {centerSubLabel && <Text style={styles.centerSubLabel}>{centerSubLabel}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderRing: {
        borderWidth: 10,
        borderColor: '#333',
    },
    centerTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerLabel: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
    centerSubLabel: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
        fontFamily: 'System',
    }
});
