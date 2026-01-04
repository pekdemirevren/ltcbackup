import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext'; // Assuming ThemeContextType is needed for colors

export const getStyles = (colors: ThemeContextType['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  iconTitleContainer: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: -12,
    paddingLeft: 8,
    position: 'relative',
    top: -12,
  },
  bottomBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    top: 12,
  },
});
