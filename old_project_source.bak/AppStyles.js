import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  ledDot: {},
  settingsIconGradient: {
    width: 64, // 48'den biraz daha büyük
    height: 64,
    borderRadius: 20, // 16'dan biraz daha büyük
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    shadowColor: colors.settingsIconGradient[0],
  },
  settingsButton: {
    position: 'absolute',
    bottom: 120, // Navigasyon barının üstüne gelecek şekilde ayarlandı
    right: 30,
  },
  settingsIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    shadowColor: colors.settingsIconGradient[0],
  },
  // Döngü Gösterge Daireleri
  cycleIndicatorContainer: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    marginLeft: -112.5, // 2 daire için merkezleme (100+25+100)/2
    flexDirection: 'row',
    gap: 25,
  },
  cycleIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleLEDContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleCountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.playIconText, // Use theme color
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.pickerHeaderBorder,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  modalBody: {
    paddingHorizontal: 0, // Picker'lar tam genişlikte olacak
    paddingVertical: 10,
  },
  settingSection: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: colors.valueBackground,
    padding: 15,
  },
  settingLabel: {
    fontSize: 17,
    color: colors.text,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeOption: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
  },
  cycleOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  cycleOption: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    width: '30%',
  },
  timeOptionActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  timeOptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeOptionTextActive: {
    color: colors.background,
  },
  timeOptionLocked: {
    opacity: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    // Bu stil artık kullanılmıyor, çünkü Picker'lar doğrudan settingSection içinde.
    // İsterseniz silebilirsiniz.
  },
  pickerItem: {
    // Bu stil App.js'de kullanılıyor.
    color: colors.text,
    fontSize: 22,
    height: 150, // iOS'te daha iyi görünüm için
  },
  // Pro Modal Styles
  proModalContent: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  proModalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.time.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  proModalDescription: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  proFeaturesList: {
    marginBottom: 30,
  },
  proFeature: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
    paddingLeft: 10,
  },
  proButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
  },
  proButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
  },
  restoreButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.time.primary,
  },
  restoreButtonText: {
    fontSize: 14,
    color: colors.time.primary,
    textAlign: 'center',
  },
  proCancelButton: {
    paddingVertical: 12,
  },
  proCancelButtonText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});