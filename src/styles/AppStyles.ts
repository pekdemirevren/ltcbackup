import { StyleSheet, Dimensions, Platform } from 'react-native';
import Theme from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const colors = Theme.dark;

export const AppStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Alt tarafa yasla
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 32, // Dairelerin alt kenarı ile bottomtabbar üst kenarı eşit
  },
  countdownArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  // --- Minimal Strava Style Stats ---
  statsSimpleOverlay: {
    position: 'absolute',
    top: 58, // ✅ Biraz daha aşağıya kaydır (58px)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start', // Yukarıda hizala
    zIndex: 50,
    pointerEvents: 'none',
  },
  statsSimpleContainer: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  statsSimpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 200,
  },
  statsSimpleLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsSimpleValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 16,
  },
  digitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  ledDot: {},
  // Duplicate settingsIconGradient, keep the second one as it's more refined
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48, // Daireyi yukarı taşır
    marginBottom: 64, // Daha fazla yukarı taşımak için alt boşluk
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
  // --- TimerScreen & LED Styles ---
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
    marginBottom: 32,
    gap: 18, // İki rakam arasında 2 dot dize boşluk (dotSize: 9 x 2)
  },
  ledCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  ledCircleWrapper: {
    marginHorizontal: 16,
    alignItems: 'center',
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  infoItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  controlButton: {
    backgroundColor: '#222',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginHorizontal: 12,
  },
  backButtonTimer: {
    position: 'absolute',
    top: 32,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});