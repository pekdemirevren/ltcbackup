import { StyleSheet, Platform } from 'react-native';
import Theme from '../constants/theme';

const colors = Theme.dark;

export const SettingsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "flex-start",
    paddingTop: 107,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  topBackButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 36,
    color: colors.text,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingBottom: 150, // Butonun ve nav bar'ın arkasında kalmaması için
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 11,
    paddingVertical: 19,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 3,
  },
  quickStartTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'left',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 1,
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 17,
    color: '#8E8E93', // iOS'in standart soluk metin rengi
    marginRight: 8,
  },
  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] // Switch'i biraz küçültmek için
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 20,
  },
  // Picker stilleri
  pickerWrapper: { backgroundColor: colors.cardBackground, borderRadius: 16, marginTop: -8, marginBottom: 16, overflow: 'hidden' },
  pickerHeader: { padding: 16, alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: colors.pickerHeaderBorder },
  pickerButtonText: { fontSize: 18, fontWeight: '600' },
  pickerItem: { color: colors.text, fontSize: 22 },
  // Additional styles for WorkoutSettingsScreen compatibility
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
    marginTop: 4,
  },
});