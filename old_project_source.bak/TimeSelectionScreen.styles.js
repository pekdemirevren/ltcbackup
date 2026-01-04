import { StyleSheet, Dimensions } from 'react-native';
import { BackButtonStyles } from './BackButtonStyle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (colors, isPickerVisible) => ({
  ...BackButtonStyles,
  container: {
    flex: 1,
    paddingTop: 5,
  },
  header: {
    paddingTop: 112,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 27,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    paddingHorizontal: 11,
    paddingVertical: 19,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderBottomLeftRadius: isPickerVisible ? 0 : 24,
    borderBottomRightRadius: isPickerVisible ? 0 : 24,
    transition: 'border-radius 150ms ease'
  },
  iconContainer: {
    width: 48,
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 3,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 1,
    marginBottom: 3,
  },
  valueContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    height: 54,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startButtonText: { color: colors.background, fontWeight: '600', fontSize: 18 },
  pickerWrapper: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 0,
    marginBottom: 12,
    overflow: 'hidden',
    height: 200,
  },
  pickerItem: { color: colors.text, fontSize: 18 },
});