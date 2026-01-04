import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const SharingIcon = ({ color = '#FFFFFF', size = 26 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.2" cy="14.4" r="3" fill={color} />
      <Circle cx="16.8" cy="14.4" r="3" fill={color} />
      <Circle cx="12" cy="7.2" r="3" fill={color} />
      <Path
        d="M8.4 16.8c0-1.2 1.2-2.4 2.4-2.4h2.4c1.2 0 2.4 1.2 2.4 2.4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M10.8 9.6c0-1.2 1.2-2.4 2.4-2.4s2.4 1.2 2.4 2.4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  );
};

export default SharingIcon;