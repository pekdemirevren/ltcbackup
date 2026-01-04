import React, { useRef, useEffect } from 'react';
import LottieView from 'lottie-react-native';
import { ViewStyle } from 'react-native';

interface LottieIconProps {
  source: any; // JSON animasyon dosyası
  size: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
}

export const LottieIcon: React.FC<LottieIconProps> = ({
  source,
  size,
  autoPlay = true,
  loop = true,
  style,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  return (
    <LottieView
      ref={animationRef}
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={[{ width: size, height: size }, style]}
    />
  );
};