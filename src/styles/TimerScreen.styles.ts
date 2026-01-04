import { StyleSheet, Dimensions, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext'; // Assuming ThemeContextType is needed for colors

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (colors: ThemeContextType['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background, // Ensure background is set
  },
  countdownArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  ledDot: { // Basic style for LEDDot, size/color will come from props
    // Minimal styling here as most is passed via props to LEDDot component
  },
  settingsButton: {
    position: 'absolute',
    bottom: 120, // Adjust as needed for navigation bar
    right: 30,
  },
  settingsIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    shadowColor: colors.settingsIconGradient[0], // Assuming this is an array in Theme colors
  },
  cycleIndicatorContainer: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    marginLeft: -112.5, // Center for 2 circles (100+25+100)/2
    flexDirection: 'row',
    gap: 25,
  },
  cycleLEDContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleCountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.playIconText, // Use theme color
  },
});
