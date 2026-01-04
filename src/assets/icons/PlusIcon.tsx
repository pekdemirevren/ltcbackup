import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface PlusIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({ width = 32, height = 32, color }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={color || '#FFFFFF'} />
    </Svg>
  );
};

export default PlusIcon;
