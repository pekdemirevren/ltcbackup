import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [number, setNumber] = useState(99);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LEDDisplay number={number} />
    </View>
  );
}

const LEDDisplay = ({ number }) => {
  const numberString = number.toString().padStart(2, '0');
  
  return (
    <View style={styles.displayContainer}>
      {numberString.split('').map((digit, index) => (
        <LEDDigit key={index} digit={digit} />
      ))}
    </View>
  );
};

const LEDDigit = ({ digit }) => {
  const dotSize = SCREEN_WIDTH * 0.035; // Her dot'un boyutu
  const spacing = dotSize * 0.3; // Dotlar arası boşluk
  
  // 7x13 matrix için her rakamın dot pattern'i
  const patterns = {
    '0': [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    '9': [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,1,1,0],
      [0,0,0,0,1,0,0],
    ],
    '1': [
      [0,0,0,1,0,0,0],
      [0,0,1,1,0,0,0],
      [0,1,1,1,0,0,0],
      [1,1,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
    ],
    '2': [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,1,1,0],
      [0,0,0,1,1,0,0],
      [0,0,1,1,0,0,0],
      [0,1,1,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
    ],
    '3': [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,1,1,1,0,0],
      [0,0,0,0,1,1,0],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    '4': [
      [0,0,0,0,1,1,0],
      [0,0,0,1,1,1,0],
      [0,0,1,1,1,1,0],
      [0,1,1,0,1,1,0],
      [1,1,0,0,1,1,0],
      [1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,0,0,0,1,1,0],
      [0,0,0,0,1,1,0],
      [0,0,0,0,1,1,0],
      [0,0,0,0,1,1,0],
      [0,0,0,0,1,1,0],
    ],
    '5': [
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    '6': [
      [0,0,1,1,1,1,0],
      [0,1,1,1,1,1,1],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    '7': [
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,0,0,0,0,1,1],
      [0,0,0,0,1,1,0],
      [0,0,0,1,1,0,0],
      [0,0,1,1,0,0,0],
      [0,0,1,1,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,1,0,0,0,0],
    ],
    '8': [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [0,1,1,1,1,1,0],
      [0,1,1,1,1,1,0],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
  };

  const pattern = patterns[digit] || patterns['0'];
  
  return (
    <View style={styles.digitContainer}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((dot, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  margin: spacing / 2,
                  backgroundColor: dot === 1 ? '#FFFFFF' : 'transparent',
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.03,
  },
  digitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  dot: {
    // Dinamik olarak ayarlanacak
  },
});
