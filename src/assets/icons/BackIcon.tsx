import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface BackIconProps {
  width?: number;
  height?: number;
  size?: number;
  color?: string;
}

const BackIcon: React.FC<BackIconProps> = ({ width, height, size, color = '#FFFFFF' }) => {
  const w = width || size || 24;
  const h = height || size || 24;
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BackIcon;