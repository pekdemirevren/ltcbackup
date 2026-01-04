import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface PlayIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const PlayIcon: React.FC<PlayIconProps> = ({ width = 33, height = 33, color }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path d="M8 5v14l11-7z" fill={color || '#000000'} />
    </Svg>
  );
};

export default PlayIcon;
