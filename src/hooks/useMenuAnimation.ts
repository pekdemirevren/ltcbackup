import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated as RNAnimated } from 'react-native';

/**
 * Custom hook to manage menu animations and visibility state.
 * Ensures the modal/menu is rendered before showing and 
 * cleaned up after hiding.
 */
export const useMenuAnimation = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const animation = useRef(new RNAnimated.Value(0)).current;

    const show = useCallback(() => {
        setShouldRender(true);
        setIsVisible(true);
    }, []);

    const hide = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Toggle logic for showing/hiding with animations
    useEffect(() => {
        if (isVisible && shouldRender) {
            // Wait for one frame to ensure the component is rendered before starting animation
            requestAnimationFrame(() => {
                RNAnimated.spring(animation, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 300,
                }).start();
            });
        } else if (!isVisible && shouldRender) {
            // Animate out, then unmount
            RNAnimated.spring(animation, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 300,
            }).start(({ finished }) => {
                if (finished) {
                    setShouldRender(false);
                }
            });
        }
    }, [isVisible, shouldRender, animation]);

    return {
        shouldRender,
        animation,
        show,
        hide,
        isVisible // Added for consistency if needed
    };
};
