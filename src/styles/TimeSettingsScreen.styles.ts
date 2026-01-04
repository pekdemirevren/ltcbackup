import { StyleSheet } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPicker.styles'; // Import the common card/button/picker styles

export const getStyles = (colors: ThemeContextType['colors'], isAnyPickerVisible: boolean) => {
  // Use the common styles and potentially override/extend them
  const commonStyles = getCardButtonPickerStyles(colors, isAnyPickerVisible);

  return StyleSheet.create({
    ...commonStyles, // Spread all common styles

    // Any specific overrides or additions for TimeSettingsScreen can go here.
    // For now, it seems to mostly rely on the common styles.
    // The `pickerWrapper` height will be controlled by Animated.Value in the component.
  });
};
