import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../../components/LiquidGlass';
import { ViewMode, DaySubMode, MonthViewMode } from '../models/ViewMode';

interface ViewModeMenuProps {
    visible: boolean;
    onClose: () => void;
    position: { top: number; right: number };
    isCollapsed: boolean;
    daySubMode: DaySubMode;
    monthViewMode: MonthViewMode;
    onSwitchViewMode: (mode: DaySubMode) => void;
    onSwitchMonthViewMode: (mode: MonthViewMode) => void;
}

export const ViewModeMenu = ({
    visible,
    onClose,
    position,
    isCollapsed,
    daySubMode,
    monthViewMode,
    onSwitchViewMode,
    onSwitchMonthViewMode
}: ViewModeMenuProps) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const translateY = useSharedValue(-20);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.8, { duration: 150 });
            translateY.value = withTiming(-20, { duration: 150 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
    }));

    if (!visible && opacity.value === 0) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.menuWrapper,
                    {
                        top: position.top,
                        right: position.right,
                    },
                    animatedStyle
                ]}
                pointerEvents="auto"
            >
                <LiquidGlassCard borderRadius={28} width={260}>
                    {isCollapsed ? (
                        <>
                            <LiquidGlassMenuItem
                                label="Single Day"
                                onPress={() => { onSwitchViewMode('single'); onClose(); }}
                                icon={<MaterialCommunityIcons name="view-day-outline" size={20} color="#FFF" />}
                                showCheck={daySubMode === 'single'}
                            />
                            <LiquidGlassMenuItem
                                label="Multi Day"
                                onPress={() => { onSwitchViewMode('multi'); onClose(); }}
                                icon={<MaterialCommunityIcons name="view-week-outline" size={20} color="#FFF" />}
                                showCheck={daySubMode === 'multi'}
                            />
                            <LiquidGlassMenuItem
                                label="List"
                                onPress={() => { onSwitchViewMode('list'); onClose(); }}
                                icon={<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFF" />}
                                showCheck={daySubMode === 'list'}
                            />
                        </>
                    ) : (
                        <>
                            <LiquidGlassMenuItem
                                label="Compact"
                                onPress={() => { onSwitchMonthViewMode('compact'); onClose(); }}
                                icon={<MaterialCommunityIcons name="circle-small" size={20} color="#FFF" />}
                                showCheck={monthViewMode === 'compact'}
                            />
                            <LiquidGlassMenuItem
                                label="Stacked"
                                onPress={() => { onSwitchMonthViewMode('stacked'); onClose(); }}
                                icon={<MaterialCommunityIcons name="view-sequential" size={20} color="#FFF" />}
                                showCheck={monthViewMode === 'stacked'}
                            />
                            <LiquidGlassMenuItem
                                label="Details"
                                onPress={() => { onSwitchMonthViewMode('details'); onClose(); }}
                                icon={<MaterialCommunityIcons name="view-grid" size={20} color="#FFF" />}
                                showCheck={monthViewMode === 'details'}
                            />
                            <LiquidGlassMenuItem
                                label="List"
                                onPress={() => { onSwitchMonthViewMode('list'); onClose(); }}
                                icon={<MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFF" />}
                                showCheck={monthViewMode === 'list'}
                            />
                        </>
                    )}
                </LiquidGlassCard>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuWrapper: {
        position: 'absolute',
        zIndex: 1000,
    },
});
