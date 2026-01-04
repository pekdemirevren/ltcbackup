import { StyleSheet, Dimensions } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext'; // Import ThemeContextType

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BackButtonStyles = StyleSheet.create({
  topBackButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});

export const getStyles = (colors: ThemeContextType['colors']) => StyleSheet.create({
  ...BackButtonStyles,
  container: {
    flex: 1,
    paddingTop: 5,
  },
  header: {
    paddingTop: 107,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 0,
  },
  card: {
    borderRadius: 32,
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
    marginRight: 8,
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
