import { StyleSheet, Platform } from 'react-native';
import Theme from '../constants/theme';

const colors = Theme.dark;

export const WorkoutScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    zIndex: 100,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 200 : 180,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    bottom: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  stickyTitleText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  largeTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 10,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: Platform.OS === 'ios' ? 200 : 180, // Adjusted for taller header
    paddingBottom: 0,
  },
  card: {
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    minHeight: 200,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  bottomButtonsWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    height: 66,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  filterSection: {
    marginTop: 0,
    width: '100%',
  },
  categoryScrollContainer: {
    marginTop: 12,
    marginHorizontal: -16, // Bleed to edges
  },
  categoryListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
