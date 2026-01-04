import { StyleSheet, Platform } from 'react-native';
import Theme from '../constants/theme';

const colors = Theme.dark;

export const WorkoutScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingBottom: 100,
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
    fontSize: 23,
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
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
