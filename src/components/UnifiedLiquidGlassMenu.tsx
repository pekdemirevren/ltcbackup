/**
 * UnifiedLiquidGlassMenu.tsx
 * 
 * A unified menu controller that uses react-native-reanimated for animations,
 * solving the frame synchronization issues with the calendar's reanimated animations.
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    ScrollView,
    Dimensions,
    ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { LiquidGlassCard, LiquidGlassMenuItem } from './LiquidGlass';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring config matching reanimated calendar animations
const SPRING_CONFIG = {
    damping: 18,
    stiffness: 250,
};

const TIMING_CONFIG = {
    duration: 180,
    easing: Easing.out(Easing.cubic),
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    showCheck?: boolean;
    onPress: () => void;
}

export interface MenuConfig {
    items: MenuItem[];
    position: { top: number; right: number };
    width?: number;
    maxHeight?: number;
    borderRadius?: number;
    onDismiss?: () => void;
}

interface MenuContextValue {
    openMenu: (config: MenuConfig) => void;
    closeMenu: () => void;
    isMenuOpen: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const MenuContext = createContext<MenuContextValue | null>(null);

export const useUnifiedMenu = (): MenuContextValue => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useUnifiedMenu must be used within a UnifiedLiquidGlassMenuProvider');
    }
    return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Hook - Measure anchor position
// ─────────────────────────────────────────────────────────────────────────────

export const useMeasurePosition = () => {
    const measureAndOpen = useCallback(
        (
            ref: React.RefObject<View | null>,
            openMenu: (config: MenuConfig) => void,
            menuConfig: Omit<MenuConfig, 'position'>
        ) => {
            if (!ref.current) return;

            ref.current.measureInWindow((x, y, width, height) => {
                // Place menu below the button
                const menuTop = y + height + 8;
                // Ensure menu doesn't go off-screen
                const safeTop = Math.min(menuTop, SCREEN_HEIGHT - 400);

                openMenu({
                    ...menuConfig,
                    position: { top: safeTop, right: 20 },
                });
            });
        },
        []
    );

    return { measureAndOpen };
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderProps {
    children: React.ReactNode;
}

export const UnifiedLiquidGlassMenuProvider: React.FC<ProviderProps> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);

    // Reanimated shared values for smooth animations
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    const openMenu = useCallback((config: MenuConfig) => {
        console.log('🔓 openMenu config:', config.position.top);
        runOnJS(setMenuConfig)(config);
        runOnJS(setIsVisible)(true);

        // Reset animations to prevent state race condition artifacts
        opacity.value = 0;
        scale.value = 1; // Fix scale to 1 to remove "spreading" effect

        // Use simpler opacity-only fade in
        opacity.value = withTiming(1, { duration: 150 });
    }, []);

    const closeMenu = useCallback(() => {
        console.log('🔒 closeMenu');
        opacity.value = withTiming(0, { duration: 100 });
        scale.value = withTiming(1, { duration: 100 }, (finished) => {
            'worklet';
            if (finished) {
                runOnJS(() => {
                    setIsVisible(false);
                    setMenuConfig(null);
                })();
            }
        });

        // Call onDismiss callback
        // Note: we don't have menuConfig in dependencies here to avoid re-creating the callback
        // If needed, we could use a ref for menuConfig
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        // Removed scale transform to eliminate spreading effect
    }));

    const contextValue: MenuContextValue = {
        openMenu,
        closeMenu,
        isMenuOpen: isVisible,
    };

    return (
        <MenuContext.Provider value={contextValue}>
            {children}

            <Modal
                visible={isVisible && !!menuConfig}
                transparent
                animationType="none"
                onRequestClose={closeMenu}
            >
                <TouchableWithoutFeedback onPress={closeMenu}>
                    <View style={styles.overlay}>
                        <Animated.View
                            style={[
                                styles.menuContainer,
                                animatedStyle,
                                {
                                    top: menuConfig?.position.top ?? 0,
                                    right: menuConfig?.position.right ?? 20,
                                    width: menuConfig?.width ?? 260,
                                },
                            ]}
                        >
                            <LiquidGlassCard borderRadius={menuConfig?.borderRadius ?? 28}>
                                {menuConfig?.maxHeight ? (
                                    <ScrollView
                                        style={{ maxHeight: menuConfig.maxHeight }}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {menuConfig.items.map((item) => (
                                            <LiquidGlassMenuItem
                                                key={item.id}
                                                icon={item.icon}
                                                label={item.label}
                                                textColor={item.textColor}
                                                textAlign={item.textAlign}
                                                showCheck={item.showCheck}
                                                onPress={() => {
                                                    item.onPress();
                                                    closeMenu();
                                                }}
                                            />
                                        ))}
                                    </ScrollView>
                                ) : (
                                    menuConfig?.items.map((item) => (
                                        <LiquidGlassMenuItem
                                            key={item.id}
                                            icon={item.icon}
                                            label={item.label}
                                            textColor={item.textColor}
                                            textAlign={item.textAlign}
                                            showCheck={item.showCheck}
                                            onPress={() => {
                                                item.onPress();
                                                closeMenu();
                                            }}
                                        />
                                    ))
                                )}
                            </LiquidGlassCard>
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </MenuContext.Provider>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuContainer: {
        position: 'absolute',
        zIndex: 10000, // Higher zIndex to stay above calendar and other modals
    },
});

export default UnifiedLiquidGlassMenuProvider;
