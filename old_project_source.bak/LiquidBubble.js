// ltc/LiquidBubble.js
import React from 'react';
import Svg, { Path, Defs, Filter, FeGaussianBlur } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { interpolate as flubberInterpolate } from 'flubber';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Helper function to create a rounded rect SVG path string
function createRoundedRectPath(x, y, width, height, r) {
  return `
    M${x + r},${y}
    L${x + width - r},${y}
    A${r},${r},0,0,1,${x + width},${y + r}
    L${x + width},${y + height - r}
    A${r},${r},0,0,1,${x + width - r},${y + height}
    L${x + r},${y + height}
    A${r},${r},0,0,1,${x},${y + height - r}
    L${x},${y + r}
    A${r},${r},0,0,1,${x + r},${y}
    Z
  `;
}

export default function LiquidBubble({ translateX, tabWidth, bubbleHeight, bubbleBorderRadius }) {
  const y = (64 - bubbleHeight) / 2; // 64 is container height

  // Define the three target paths for the bubble at each tab position
  const path0 = createRoundedRectPath(0, y, tabWidth, bubbleHeight, bubbleBorderRadius);
  const path1 = createRoundedRectPath(tabWidth, y, tabWidth, bubbleHeight, bubbleBorderRadius);
  const path2 = createRoundedRectPath(tabWidth * 2, y, tabWidth, bubbleHeight, bubbleBorderRadius);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    let d;
    if (translateX.value < tabWidth) {
      // Morphing between tab 0 and tab 1
      const progress = translateX.value / tabWidth;
      const interpolator = flubberInterpolate(path0, path1, { maxSegmentLength: 5 });
      d = interpolator(progress);
    } else {
      // Morphing between tab 1 and tab 2
      const progress = (translateX.value - tabWidth) / tabWidth;
      const interpolator = flubberInterpolate(path1, path2, { maxSegmentLength: 5 });
      d = interpolator(progress);
    }
    return { d };
  });

  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
      <Defs>
        <Filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </Filter>
      </Defs>

      <AnimatedPath
        animatedProps={animatedProps}
        fill="rgba(205, 255, 0, 0.3)"
        stroke="rgba(205, 255, 0, 0.4)"
        strokeWidth="1"
      />
    </Svg>
  );
}