import React from 'react';
import { Svg, Path, Circle } from 'react-native-svg';

const BicycleIcon = ({ width = 24, height = 24, color = '#000000', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="5.5" cy="18" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <Circle cx="18.5" cy="18" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M5.5 18L9 12L12 15L9 12L12 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"  />
    <Path d="M12 8L14 10L18.5 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"  />
    <Path d="M9 12L12 15L18.5 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"  />
    <Path d="M12 8L13.5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"  />
    <Path d="M8 12L10 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"  />
    <Circle cx="11" cy="5" r="1.5" fill={color} />
    <Path d="M11 6.5L9.5 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"  />
    <Path d="M10 8L13 8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"  />
    <Path d="M9.5 11L8 14L12 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"  />
  </Svg>
);

export default BicycleIcon;
