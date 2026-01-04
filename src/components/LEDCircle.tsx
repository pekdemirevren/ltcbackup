import React from 'react';
import { View, StyleSheet } from 'react-native';
import LEDDot from './LEDDot';
import { LED_CIRCLE_PATTERN } from '../constants/LedPatterns';

interface LEDCircleProps {
  dotSize: number;
  spacing: number;
  color: string;
}

const LEDCircle = React.memo(({ dotSize, spacing, color }: LEDCircleProps) => {
  return (
    <View style={styles.circleContainer}>
      {LED_CIRCLE_PATTERN.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View key={colIndex} style={{ margin: spacing / 2 }}>
              <LEDDot isOn={pixel === 1} size={dotSize} color={color} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  circleContainer: {
    // Flex direction column by default, rows are children
  },
  row: {
    flexDirection: 'row',
  },
});

export default LEDCircle;
