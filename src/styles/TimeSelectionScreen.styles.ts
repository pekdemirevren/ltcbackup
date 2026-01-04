import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext'; // Import ThemeContextType

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

export const getStyles = (colors: ThemeContextType['colors'], isPickerVisible: boolean) => StyleSheet.create({
  ...BackButtonStyles,
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 5 },
  header: { paddingTop: 107, paddingHorizontal: 24, paddingBottom: 20, alignItems: 'flex-start' },
  headerTitle: { fontSize: 36, color: colors.text, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 13, paddingTop: 0, paddingBottom: 60 },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 32,
    borderBottomLeftRadius: isPickerVisible ? 0 : 32,
    borderBottomRightRadius: isPickerVisible ? 0 : 32,
    paddingHorizontal: 11,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
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
  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'left',
  },
  valueContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  valueText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    height: 54,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  startButtonText: { color: colors.background, fontWeight: '600', fontSize: 18 },
  pickerWrapper: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
    // height will be controlled by Animated.Value
  },
  pickerHeader: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.pickerHeaderBorder,
  },
  pickerButtonText: { fontSize: 18, fontWeight: '600' },
  pickerItem: { color: colors.text, fontSize: 22 },
});
