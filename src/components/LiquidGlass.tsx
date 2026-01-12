/**
 * LiquidGlass Component for React Native
 * Uses @callstack/liquid-glass for iOS 26+ native effect
 * Falls back to BlurView for older iOS versions
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  Pressable,
  Platform,
  Text,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import AnimatedRe, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
// Safe import with fallback for unsupported iOS versions
let LiquidGlassView: any = null;
let isLiquidGlassSupported: boolean = false;

try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported === true;
} catch (e) {
  // @callstack/liquid-glass not available or failed to load
  isLiquidGlassSupported = false;
}

// Safety check: only use native LiquidGlass on iOS 26+ when explicitly supported
const supportsNativeLiquidGlass = Platform.OS === 'ios' && isLiquidGlassSupported === true && LiquidGlassView !== null;

interface LiquidGlassProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  blurAmount?: number;
  saturation?: number;
  borderWidth?: number;
  borderColor?: string;
  highlightColor?: string;
  shadowColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  elasticity?: number;
  variant?: 'default' | 'prominent' | 'subtle';
  interactive?: boolean;
  effect?: 'clear' | 'regular';
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  style,
  borderRadius = 24,
  blurAmount = 20,
  saturation = 1.4,
  borderWidth = 0.8,
  borderColor = 'rgba(255,255,255,0.18)',
  highlightColor = 'rgba(255,255,255,0.25)',
  shadowColor = '#000',
  onPress,
  disabled = false,
  elasticity = 0.15,
  variant = 'default',
  interactive = true,
  effect = 'regular',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  // Variant-specific styles
  const variantStyles = {
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      gradientColors: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
    },
    prominent: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      gradientColors: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    },
    subtle: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      gradientColors: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'],
    },
  };

  const currentVariant = variantStyles[variant];

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1 - elasticity,
        useNativeDriver: true,
        damping: 15,
        stiffness: 400,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 300,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
  };

  // Use native LiquidGlassView on iOS 26+ if supported
  if (supportsNativeLiquidGlass) {
    const nativeContent = (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LiquidGlassView
          style={[
            containerStyle,
            style,
          ]}
          interactive={interactive}
          effect={effect}
          colorScheme="dark"
        >
          <View style={styles.content}>{children}</View>
        </LiquidGlassView>
      </Animated.View>
    );

    if (onPress && !disabled) {
      return (
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
        >
          {nativeContent}
        </Pressable>
      );
    }

    return nativeContent;
  }

  // Fallback for older iOS and Android
  const content = (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      {/* Blur background for glass effect */}
      {Platform.OS === 'ios' ? (
        <BlurView
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          blurType="ultraThinMaterialDark"
          blurAmount={32}
          reducedTransparencyFallbackColor="rgba(30,30,30,0.75)"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(30,30,30,0.65)',
              borderRadius,
            }
          ]}
        />
      )}

      {/* Glass tint overlay - reduced opacity for more blur visibility */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius,
          }
        ]}
      />

      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.2)',
          },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

// Specialized button variant
interface LiquidGlassButtonProps extends Omit<LiquidGlassProps, 'children'> {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  size = 'medium',
  borderRadius,
  ...props
}) => {
  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: borderRadius ?? 16 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: borderRadius ?? 20 },
    large: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: borderRadius ?? 24 },
  };

  const currentSize = sizeStyles[size];

  return (
    <LiquidGlass
      borderRadius={currentSize.borderRadius}
      elasticity={0.08}
      {...props}
      style={[
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        props.style,
      ]}
    >
      {children}
    </LiquidGlass>
  );
};

// Card variant for menus
interface LiquidGlassCardProps extends LiquidGlassProps {
  width?: number | string;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  width = 260,
  borderRadius = 28,
  ...props
}) => {
  return (
    <LiquidGlass
      borderRadius={borderRadius}
      variant="prominent"
      {...props}
      style={[
        {
          width: width as any,
          paddingVertical: 8,
        },
        props.style,
      ]}
    >
      {children}
    </LiquidGlass>
  );
};

// Menu item for inside LiquidGlassCard
interface LiquidGlassMenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  textColor?: string;
  iconWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  showCheck?: boolean;
}

export const LiquidGlassMenuItem: React.FC<LiquidGlassMenuItemProps> = ({
  icon,
  label,
  onPress,
  textColor = '#FFF',
  iconWidth = 20,
  textAlign = 'left',
  showCheck = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        damping: 20,
        stiffness: 400,
      }),
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.menuItem,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.menuItemHighlight,
            {
              opacity: bgOpacity,
            },
          ]}
        />
        {icon && (
          <View style={[styles.menuIcon, { width: iconWidth }]}>
            {icon}
          </View>
        )}
        <Animated.Text style={[styles.menuText, { color: textColor, textAlign: textAlign, flex: 1 }]}>
          {label}
        </Animated.Text>
        {showCheck && (
          <View style={styles.checkIcon}>
            <Feather name="check" size={18} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

interface LiquidGlassCardWrapperProps {
  visible: boolean;
  children: React.ReactNode;
  position: { top: number; right: number };
  onDismiss: () => void;
}

export const LiquidGlassCardWrapper = ({
  visible,
  children,
  position,
  onDismiss
}: LiquidGlassCardWrapperProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 25, stiffness: 300 });
      scale.value = withSpring(1, { damping: 25, stiffness: 300 });
    } else {
      opacity.value = withSpring(0, { damping: 25, stiffness: 300 });
      scale.value = withSpring(0.3, { damping: 25, stiffness: 300 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: (1 - scale.value) * -50 }
    ],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={true} animationType="none">
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <AnimatedRe.View
            style={[
              {
                position: 'absolute',
                top: position.top,
                right: position.right,
              },
              animStyle
            ]}
          >
            <TouchableWithoutFeedback>
              {children}
            </TouchableWithoutFeedback>
          </AnimatedRe.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 40, 40, 0.85)', // Fallback background
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  topHighlightGradient: {
    flex: 1,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuItemHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  menuIcon: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 17,
    fontWeight: '400',
  },
  checkIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
});

// Re-export for convenience
export { isLiquidGlassSupported, supportsNativeLiquidGlass };

export default LiquidGlass;
