import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext'; // Assuming ThemeContextType is needed for colors

export const getStyles = (colors: ThemeContextType['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backButtonBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.backButtonBackground,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100, // Nav bar için boşluk
    gap: 16,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24, // Kartı dikeyde büyüt
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  infiniteButton: {
    borderColor: colors.quickStart.card,
  },
  infiniteButtonActive: {
    backgroundColor: colors.quickStart.card,
    borderColor: colors.quickStart.primary,
  },
  iconContainer: {
    width: 48, // İkon için alanı ayarla
    alignItems: 'center',
  },
  modeButtonText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'left',
    color: colors.text,
  },
  playIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.playIconText === '#000000' ? '#FFFFFF' : '#000000', // A placeholder or check Theme for playIconBackground
  },
  startButton: {
    marginHorizontal: 20, // Butonu yanlardan daraltmak için eklendi
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  // Modal ve Picker Stilleri (These might belong to global AppStyles or specific components)
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Using a default semi-transparent background
  },
  pickerWrapper: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.valueBackground,
    overflow: 'hidden',
  },
  pickerHeader: {
    padding: 16,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.pickerHeaderBorder,
  },
  pickerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.pickerDoneText, // Assuming pickerDoneText exists in theme
  },
  pickerItem: {
    fontSize: 22,
    color: colors.text,
  },
});
