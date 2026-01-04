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
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';

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
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
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
          blurAmount={25}
          reducedTransparencyFallbackColor="rgba(40,40,40,0.85)"
        />
      ) : (
        <View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: 'rgba(40,40,40,0.75)',
              borderRadius,
            }
          ]} 
        />
      )}

      {/* Glass tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(255,255,255,0.08)',
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
}

export const LiquidGlassMenuItem: React.FC<LiquidGlassMenuItemProps> = ({
  icon,
  label,
  onPress,
  textColor = '#FFF',
  iconWidth = 20,
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
        <Animated.Text style={[styles.menuText, { color: textColor }]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '500',
  },
});

// Re-export isLiquidGlassSupported for convenience
export { isLiquidGlassSupported };

export default LiquidGlass;
