import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * DailyWorkoutWidgetStyle
 * 
 * Workout Widget - Günlük antrenman özeti
 * 
 * Layout:
 * - LEG DAY
 * - (5px) 5/7
 * - (10px) separator
 * - (10px) Saatlik: SET sayısı / kart ikonu / KCAL
 * - (10px) separator
 * - (10px) Günlük satırlar (5 adet):
 *   [Kart adı (Leg Press)] [10px] [kart ikonu] [10px] [min kg] [progress bar] [5px] [max kg]
 */

const WIDGET_WIDTH = SCREEN_WIDTH - 32;

export const DailyWorkoutWidgetStyle = StyleSheet.create({
  // Ana widget container
  widgetContainer: {
    width: WIDGET_WIDTH,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 10,
  },

  // === ÜST BÖLÜM ===
  // Workout Day başlığı (LEG DAY)
  workoutDayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // 5/7 büyük sayı (5px altında)
  workoutDayCount: {
    fontSize: 44,
    fontWeight: '300',
    color: '#FFF',
    marginTop: 5,
  },

  // Sağ üst köşe - Durum bilgisi
  statusContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },

  statusIconContainer: {
    marginBottom: 4,
  },

  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'right',
  },

  statusSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: 2,
  },

  // Separator (10px margin üst/alt)
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },

  // === ORTA BÖLÜM - Saatlik gösterim (kartlar) ===
  hourlyContainer: {
    marginTop: 10,
  },

  hourlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  hourlyItem: {
    alignItems: 'center',
    flex: 1,
  },

  // KCAL değeri (üstte) - örn: 120KCAL
  hourlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },

  // Kart ikonu container (yeşil gradient yuvarlak - Sessions tarzı)
  hourlyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  // SET ve KG değeri (altta) - örn: 4SET
  hourlyValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },

  hourlyValueUnit: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // === ALT BÖLÜM - Günlük satırlar (kartlar) ===
  dailyContainer: {
    marginTop: 10,
  },

  // Her satır (10px aralık)
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    marginBottom: 10,
  },

  dailyRowLast: {
    marginBottom: 0,
  },

  // Kart adı (sol - Leg Press, Pull up vb.)
  dailyCardName: {
    width: 65,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },

  // Kart ikonu container (10px sol boşluk) - Sessions tarzı yeşil gradient yuvarlak
  dailyIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Kalori bar container (10px sol boşluk)
  dailyWeightLevelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Günlük hedef kalori (bar solunda) - örn: 1000kcal
  dailyMinValue: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    width: 48,
    textAlign: 'right',
  },

  // Progress bar (kalori seviyesi)
  dailyProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
    overflow: 'hidden',
  },

  dailyProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Kartın yakacağı kalori (5px sol boşluk, sağda) - örn: 120KCAL
  dailyCardWeight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    width: 55,
    textAlign: 'right',
    marginLeft: 5,
  },
});

// Gradient renkleri
export const ProgressGradientColors = {
  blue: '#48A9FE',
  green: '#9DEC2C',
  orange: '#F5A623',
  yellow: '#FFD93D',
};

// İkon gradient renkleri (Sessions kartındaki gibi - koyu yeşil)
export const IconGradientColors = {
  start: '#122003',
  end: '#213705',
};
