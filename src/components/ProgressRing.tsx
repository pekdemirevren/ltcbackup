import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G, Path } from 'react-native-svg';

interface ProgressRingProps {
    size: number;
    strokeWidth: number;
    progress: number; // 0-100
    backgroundColor?: string;
    progressColor?: string;
    gradientColors?: string[];
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    size,
    strokeWidth,
    progress,
    backgroundColor = 'rgba(255,255,255,0.2)',
    progressColor,
    gradientColors,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (progress / 100) * circumference;

    // Clamp progress between 0-100
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const offset = circumference - (clampedProgress / 100) * circumference;

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        {gradientColors ?
                            gradientColors.map((color, index) => (
                                <Stop
                                    key={index}
                                    offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                                    stopColor={color}
                                />
                            ))
                            : [
                                <Stop key="s1" offset="0%" stopColor="#9DEC2C" />,
                                <Stop key="s2" offset="100%" stopColor="#5CB85C" />
                            ]
                        }
                    </LinearGradient>
                </Defs>

                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress Circle Border Glow - Thin outer stroke */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius + strokeWidth / 2}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={0.5}
                    fill="transparent"
                />

                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={progressColor || 'url(#progressGradient)'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />

                {/* Inner Glow Stroke */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius - strokeWidth / 2}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={0.5}
                    fill="transparent"
                />

                {/* Arrow Indicator */}
                {clampedProgress > 0 && (
                    <G
                        transform={`rotate(${(clampedProgress / 100) * 360 - 90} ${size / 2} ${size / 2})`}
                    >
                        <Circle
                            cx={size / 2 + radius}
                            cy={size / 2}
                            r={strokeWidth * 0.7}
                            fill="#FFFFFF"
                            stroke="rgba(0,0,0,0.1)"
                            strokeWidth={1}
                        />
                        <Path
                            d={`M ${size / 2 + radius - strokeWidth * 0.2} ${size / 2 - strokeWidth * 0.3} 
                               L ${size / 2 + radius + strokeWidth * 0.2} ${size / 2} 
                               L ${size / 2 + radius - strokeWidth * 0.2} ${size / 2 + strokeWidth * 0.3}`}
                            stroke="#000"
                            strokeWidth={1.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </G>
                )}
            </Svg>
        </View>
    );
};

// Helper function to calculate level progress within current rarity tier
export const getLevelProgressInTier = (level: number): { progress: number; tierMin: number; tierMax: number } => {
    // Rarity tiers:
    // Bronze: 0-19 (20 levels)
    // Silver: 20-39 (20 levels)
    // Gold: 40-64 (25 levels)
    // Pro: 65-84 (20 levels)
    // Legend: 85-99 (15 levels)

    if (level < 20) {
        return { progress: (level / 19) * 100, tierMin: 0, tierMax: 19 };
    } else if (level < 40) {
        return { progress: ((level - 20) / 19) * 100, tierMin: 20, tierMax: 39 };
    } else if (level < 65) {
        return { progress: ((level - 40) / 24) * 100, tierMin: 40, tierMax: 64 };
    } else if (level < 85) {
        return { progress: ((level - 65) / 19) * 100, tierMin: 65, tierMax: 84 };
    } else {
        return { progress: ((level - 85) / 14) * 100, tierMin: 85, tierMax: 99 };
    }
};

// Helper function to get rarity from level
export const getRarityFromLevel = (level: number): 'bronze' | 'silver' | 'gold' | 'pro' | 'legend' => {
    if (level < 20) return 'bronze';
    if (level < 40) return 'silver';
    if (level < 65) return 'gold';
    if (level < 85) return 'pro';
    return 'legend';
};

// Calculate stat boost based on level (every 10 levels +1-2 boost)
export const getStatBoost = (level: number): number => {
    return Math.floor(level / 10);
};

export default ProgressRing;
