import { StyleSheet, Dimensions } from 'react-native';
import { BackButtonStyles } from './BackButtonStyle'; // Yeni import yolu

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Colors {
  text: string;
  background: string;
  quickStart: { primary: string };
  speed: { primary: string };
  backButtonBackground: string; // BackButtonStyles'ta kullanıldığı için eklendi
  playIconText: string; // playIconText ekledim
  // Diğer renkler Theme.ts'den gelecek
}

export const getStyles = (colors: Colors) => StyleSheet.create({
  ...BackButtonStyles, // BackButtonStyles'ı dahil et
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
    paddingBottom: 60,
  },
  card: {
    borderRadius: 32,
    paddingHorizontal: 11,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    fontWeight: '500',
    color: colors.text,
    textAlign: 'left',
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