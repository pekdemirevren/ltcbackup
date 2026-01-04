import React from 'react';
import { View, StyleSheet } from 'react-native';
import LEDDot from './LEDDot';
import { LED_PATTERNS } from '../constants/LedPatterns';

interface LEDDigitProps {
  digit: number;
  dotSize: number;
  spacing: number;
  color: string;
}

const LEDDigit = React.memo(({ digit, dotSize, spacing, color }: LEDDigitProps) => {
  const pattern = LED_PATTERNS[digit];

  if (!pattern) {
    return null; // Or render a placeholder for unknown digit
  }

  return (
    <View style={styles.digitContainer}>
      {pattern.map((row, rowIndex) => (
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
  digitContainer: {
    // Flex direction column by default, rows are children
  },
  row: {
    flexDirection: 'row',
  },
});

export default LEDDigit;
