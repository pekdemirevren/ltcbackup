// This component is deprecated - lottie-react-native is not installed
// Use SVG icons instead

import React from 'react';
import { View, ViewStyle } from 'react-native';

interface LottieIconProps {
  source: any;
  size: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
}

// Placeholder component - returns empty view
export const LottieIcon: React.FC<LottieIconProps> = ({ size, style }) => {
  return <View style={[{ width: size, height: size }, style]} />;
};