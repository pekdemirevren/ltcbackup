import { StyleSheet } from 'react-native';
import { SquareCardMeasurements } from './SquareCardBase';

/**
 * WorkoutSquareCardStyle
 * 
 * Bu stil dosyası "EN SON KULLANILAN WORKOUT" kartı için kullanılır:
 * - Cross Trainer (son kullanılan workout)
 * - Workout_Square ID'si ile Summary'ye eklenen kart
 * 
 * ORİJİNAL ÖLÇÜLER - DEĞİŞTİRMEYİN!
 * 
 * NOT: Belirli workout kartları (Assisted Tricep Dip, T-Bar Row vb.) için
 * IndividualWorkoutCardStyle kullanılmalıdır (Workout_{workoutId}).
 */
export const WorkoutSquareCardStyle = StyleSheet.create({
    // Ana kart container
    workoutSquareCard: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#2A292A',
        borderRadius: 20,
        padding: SquareCardMeasurements.padding,
        justifyContent: 'flex-start',
    },
    
    // Başlık (Workout) - fontsize 17 diğer kartlarla eşit
    workoutSquareHeader: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
        marginTop: SquareCardMeasurements.workout.headerMarginTop,
        marginLeft: SquareCardMeasurements.workout.headerMarginLeft,
        transform: [{ translateY: 5 }], // Orijinal
    },
    
    // İçerik container - Orijinal ölçüler
    workoutSquareIconContainer: {
        width: '110%', // Orijinal
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginTop: SquareCardMeasurements.workout.containerMarginTop, // Orijinal
        paddingHorizontal: 9,
        paddingBottom: 1,
        marginHorizontal: -8,
        marginBottom: 0,
        height: 122, // Orijinal
        alignSelf: 'center',
        transform: [{ translateY: -3 }], // Orijinal
    },
    
    // İkon wrapper
    workoutSquareIconWrapper: {
        width: 63,
        height: 63,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        marginLeft: 0,
        marginBottom: 6,
    },
    
    // Workout adı
    workoutSquareName: {
        fontSize: SquareCardMeasurements.workout.nameFontSize,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 0,
    },
    
    // Action row (play icon + text)
    workoutSquareActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    
    // Action text
    workoutSquareActionText: {
        fontSize: SquareCardMeasurements.workout.actionFontSize,
        color: '#9DEC2C',
        marginLeft: 4,
        fontWeight: '500',
    },
});
