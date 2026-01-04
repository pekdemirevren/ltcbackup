import { StyleSheet } from 'react-native';
import { SquareCardMeasurements } from './SquareCardBase';

/**
 * IndividualWorkoutCardStyle
 * 
 * Bu stil dosyası BELİRLİ workout kartları için kullanılır:
 * - Assisted Tricep Dip
 * - T-Bar Row
 * - Cable Fly
 * - vb.
 * 
 * Bunlar Workout_{workoutId} formatında Summary'ye eklenen kartlardır.
 * Modal'daki carousel kartlarıyla aynı ölçüleri kullanır.
 * 
 * NOT: Cross Trainer gibi "en son kullanılan workout" kartları için
 * WorkoutSquareCardStyle kullanılmalıdır (Workout_Square).
 */
export const IndividualWorkoutCardStyle = StyleSheet.create({
    // Ana kart container
    individualWorkoutCard: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#2A292A',
        borderRadius: 20,
        padding: SquareCardMeasurements.padding,
        paddingTop: SquareCardMeasurements.padding - 2,
        paddingBottom: SquareCardMeasurements.padding - 2,
        justifyContent: 'flex-start',
    },
    
    // Başlık (Workout) - fontsize 17 diğer kartlarla eşit
    individualWorkoutHeader: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
        marginTop: SquareCardMeasurements.workout.headerMarginTop,
        marginLeft: SquareCardMeasurements.workout.headerMarginLeft,
        transform: [{ translateY: 2 }, { translateX: 4 }], // Modal carousel ile aynı
    },
    
    // İçerik container - Modal carousel ile aynı ölçüler
    individualWorkoutIconContainer: {
        width: '113%', // Modal carousel ile aynı
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'flex-start',
        alignItems: 'flex-start', // Modal carousel ile aynı
        marginTop: 18, // Orijinal değer geri alındı
        paddingHorizontal: 9, // Modal carousel ile aynı
        paddingBottom: 0, // 1 birim azaltıldı
        marginHorizontal: -8, // Modal carousel ile aynı
        marginBottom: 0,
        height: 120, // Modal carousel ile aynı
        alignSelf: 'center',
    },
    
    // İkon wrapper - ikon 4 birim büyütüldü, boşluk 1 birim azaltıldı
    individualWorkoutIconWrapper: {
        width: 77,
        height: 77,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -2,
        marginLeft: 0,
        marginBottom: 3,
    },
    
    // Workout adı
    individualWorkoutName: {
        fontSize: SquareCardMeasurements.workout.nameFontSize,
        fontWeight: '600',
        color: '#FFF',
        marginTop: -2,
    },
    
    // Action row (play icon + text)
    individualWorkoutActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    
    // Action text
    individualWorkoutActionText: {
        fontSize: SquareCardMeasurements.workout.actionFontSize,
        color: '#9DEC2C',
        marginLeft: 4,
        fontWeight: '500',
    },
});
