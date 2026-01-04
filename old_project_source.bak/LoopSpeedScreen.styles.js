import { StyleSheet, Dimensions } from 'react-native';
import { BackButtonStyles } from './BackButtonStyle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (colors, isPickerVisible = false) => ({
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
    borderRadius: 24,
    paddingHorizontal: 11,
    paddingVertical: 19,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    borderRadius: 24,
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 11,
    paddingVertical: 19,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerItem: {
    color: colors.text,
    fontSize: 18,
  },
});