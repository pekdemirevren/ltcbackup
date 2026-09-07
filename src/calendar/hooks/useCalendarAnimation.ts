import { useCallback } from 'react';
import { useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { CalendarConfig, DAY_VIEW_HEIGHT, MONTH_VIEW_HEIGHT } from '../config/CalendarConfig';

const ANIMATION_CONFIG = CalendarConfig.animation;

export const useCalendarAnimation = () => {
    const calendarHeight = useSharedValue(MONTH_VIEW_HEIGHT);
    const selectionAnim = useSharedValue(1);

    const collapse = useCallback(() => {
        'worklet';
        calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, {
            damping: ANIMATION_CONFIG.spring.damping,
            stiffness: ANIMATION_CONFIG.spring.stiffness,
            mass: ANIMATION_CONFIG.spring.mass,
        });
    }, []);

    const expand = useCallback(() => {
        'worklet';
        calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, {
            damping: ANIMATION_CONFIG.spring.damping,
            stiffness: ANIMATION_CONFIG.spring.stiffness,
            mass: ANIMATION_CONFIG.spring.mass,
        });
    }, []);

    const toggle = useCallback(() => {
        'worklet';
        if (calendarHeight.value > DAY_VIEW_HEIGHT + 50) {
            calendarHeight.value = withSpring(DAY_VIEW_HEIGHT, {
                damping: ANIMATION_CONFIG.spring.damping,
                stiffness: ANIMATION_CONFIG.spring.stiffness,
                mass: ANIMATION_CONFIG.spring.mass,
            });
        } else {
            calendarHeight.value = withSpring(MONTH_VIEW_HEIGHT, {
                damping: ANIMATION_CONFIG.spring.damping,
                stiffness: ANIMATION_CONFIG.spring.stiffness,
                mass: ANIMATION_CONFIG.spring.mass,
            });
        }
    }, []);

    const animateSelection = useCallback(() => {
        selectionAnim.value = 0;
        selectionAnim.value = withTiming(1, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        });
    }, []);

    return {
        calendarHeight,
        selectionAnim,
        collapse,
        expand,
        toggle,
        animateSelection,
        isCollapsed: () => calendarHeight.value <= DAY_VIEW_HEIGHT + 10,
    };
};
