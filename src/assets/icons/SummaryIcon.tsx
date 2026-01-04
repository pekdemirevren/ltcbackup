import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface SummaryIconProps {
  color?: string;
  size?: number;
}

const SummaryIcon: React.FC<SummaryIconProps> = ({ color = '#FFFFFF', size = 26 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Circle
        cx="12"
        cy="12"
        r="4"
        fill={color}
      />
    </Svg>
  );
};

export default SummaryIcon;