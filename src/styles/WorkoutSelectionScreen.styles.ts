import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext';

export const getStyles = (colors: ThemeContextType['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 100,
  },
  headerBlurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerCenterTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stickyTitleText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  largeTitleContainer: {
    paddingHorizontal: 0,
    paddingTop: 80,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backButtonBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    color: colors.text,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 120, // To avoid being covered by header
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', // Example background, can be themed
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
