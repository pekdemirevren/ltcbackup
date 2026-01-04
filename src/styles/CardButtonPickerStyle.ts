import { StyleSheet, Dimensions, Platform } from 'react-native';
import { BackButtonStyles } from './BackButtonStyle';
import Theme from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const colors = Theme.dark;

// Button Text: "Start Workout"
export const getCardButtonPickerStyles = (isPickerVisible = false) => StyleSheet.create({
  ...BackButtonStyles,

  // Layout Styles
  container: { 
    flex: 1, 
    backgroundColor: colors.background, 
    paddingTop: 5 
  },
  
  header: { 
    paddingTop: 107, 
    paddingHorizontal: 24, 
    paddingBottom: 20, 
    alignItems: 'flex-start' 
  },
  
  headerTitle: { 
    fontSize: 36, 
    color: colors.text, 
    fontWeight: "bold" 
  },
  
  scrollContent: { 
    paddingHorizontal: 13, 
    paddingTop: 0, 
    paddingBottom: 60 
  },

  // Card Styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 32,
    ...(isPickerVisible && {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    }),
    paddingHorizontal: 11,
    paddingVertical: 19,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isPickerVisible ? 0 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  iconContainer: {
    width: 48,
    alignItems: 'center',
  },

  cardTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'left',
  },

  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 1,
    marginBottom: 3,
  },

  // Value Display Styles
  valueContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  valueText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Button Styles
  startButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  startButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 18
  },

  // Picker Styles
  pickerWrapper: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 0,
    overflow: 'hidden',
    height: 300,
  },

  pickerHeader: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.pickerHeaderBorder
  },

  pickerButtonText: {
    fontSize: 18,
    fontWeight: '600'
  },

  pickerItem: {
    color: colors.text,
    fontSize: 22
  },
});