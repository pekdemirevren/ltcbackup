import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface PlayIconProps {
  width?: number;
  height?: number;
  size?: number;
  color?: string;
}

const PlayIcon: React.FC<PlayIconProps> = ({ width, height, size, color }) => {
  const w = width || size || 33;
  const h = height || size || 33;
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24">
      <Path d="M8 5v14l11-7z" fill={color || '#000000'} />
    </Svg>
  );
};

export default PlayIcon;
