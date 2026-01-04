import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LEDDotProps {
  isOn: boolean;
  size: number;
  color: string;
}

const LEDDot = React.memo(({ isOn, size, color }: LEDDotProps) => {
  return (
    <View
      style={[
        styles.ledDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOn ? color : 'transparent',
        }
      ]}
    />
  );
});

const styles = StyleSheet.create({
  ledDot: {
    // Add any base styles here if necessary, otherwise it's just sizing and color from props
  },
});

export default LEDDot;
