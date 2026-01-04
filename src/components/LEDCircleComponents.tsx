import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  LED_CIRCLE_PATTERN,
  getCircleWithDigitPattern
} from '../constants/LedPatterns';

interface LEDCircleProps {
  color: string;
  size: number;
  spacing: number;
  digit?: number;
  showDigit?: boolean;
}

// ✅ Sadece daire (infinite mode için)
export const LEDCircle: React.FC<LEDCircleProps> = ({
  color,
  size,
  spacing,
}) => {
  return (
    <View style={styles.circleContainer}>
      {LED_CIRCLE_PATTERN.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.dot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  marginHorizontal: spacing / 2,
                  marginVertical: spacing / 2,
                  backgroundColor: pixel === 1 ? color : 'transparent',
                }
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// ✅ Daire + içinde rakam (cycle mode için)
export const LEDCircleWithDigit: React.FC<LEDCircleProps> = ({
  color,
  size,
  spacing,
  digit = 1,
  showDigit = true,
}) => {
  const pattern = showDigit ? getCircleWithDigitPattern(digit) : LED_CIRCLE_PATTERN;

  return (
    <View style={styles.circleContainer}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => {
            let dotColor = 'transparent';

            if (pixel === 2) {
              // Rakam - beyaz (efektsiz, parlak)
              dotColor = '#FFFFFF';
            } else if (pixel === 1) {
              // Daire - yeşil veya kırmızı (efektsiz, parlak)
              dotColor = color;
            }

            return (
              <View
                key={colIndex}
                style={[
                  styles.dot,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    marginHorizontal: spacing / 2,
                    marginVertical: spacing / 2,
                    backgroundColor: dotColor,
                  }
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  dot: {
    // Inline styles
  },
});
