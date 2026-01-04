import { StyleSheet, Dimensions } from 'react-native';
import { BackButtonStyles } from './BackButtonStyle';
import Theme from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const colors = Theme.dark;

export const LoopSelectionScreenStyles = StyleSheet.create({
  ...BackButtonStyles, // Spreading BackButtonStyles here

  container: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: colors.background, // Ensure background color is set
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
    paddingTop: 24,
    paddingBottom: 60,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 11,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 1,
    marginBottom: 3,
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
});