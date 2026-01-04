import React from 'react';
import { View, StyleSheet } from 'react-native';
import LEDDot from './LEDDot';
import { getCircleWithDigitPattern } from '../constants/LedPatterns';

interface LEDCircleWithDigitProps {
  digit: number;
  dotSize: number;
  spacing: number;
  circleColor: string;
}

const LEDCircleWithDigit = React.memo(({ digit, dotSize, spacing, circleColor }: LEDCircleWithDigitProps) => {
  const pattern = getCircleWithDigitPattern(digit);
  return (
    <View style={styles.container}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View key={colIndex} style={{ margin: spacing / 2 }}>
              <LEDDot
                isOn={pixel !== 0}
                size={dotSize}
                color={pixel === 2 ? 'white' : circleColor} // 2 for digit (white), 1 for circle (circleColor)
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // Flex direction column by default, rows are children
  },
  row: {
    flexDirection: 'row',
  },
});

export default LEDCircleWithDigit;
