import { StyleSheet } from 'react-native';
import { SquareCardMeasurements } from './SquareCardBase';

export const SessionsSquareCardStyle = StyleSheet.create({
    container: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#2A292A',
        borderRadius: SquareCardMeasurements.borderRadius,
        padding: SquareCardMeasurements.padding,
        justifyContent: 'flex-start',
    },
    header: {
        marginTop: SquareCardMeasurements.session.headerMarginTop,
    },
    headerTitle: {
        fontSize: SquareCardMeasurements.session.headerFontSize,
        fontWeight: 'bold',
        color: '#FFF',
    },
    iconRow: {
        marginTop: SquareCardMeasurements.session.iconRowMarginTop,
        marginBottom: 4,
    },
    iconCircle: {
        width: SquareCardMeasurements.session.iconCircleSize,
        height: SquareCardMeasurements.session.iconCircleSize,
        borderRadius: SquareCardMeasurements.session.iconCircleSize / 2,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutName: {
        fontSize: SquareCardMeasurements.session.workoutNameFontSize,
        color: '#FFF',
        marginTop: SquareCardMeasurements.session.workoutNameMarginTop,
    },
    metric: {
        fontSize: SquareCardMeasurements.session.metricFontSize,
        fontWeight: '700',
        color: '#9DEC2C',
        marginTop: SquareCardMeasurements.session.metricMarginTop,
    },
    unit: {
        fontSize: SquareCardMeasurements.session.unitFontSize,
        color: '#9DEC2C',
    },
    dateLabel: {
        fontSize: SquareCardMeasurements.session.dateFontSize,
        color: '#8E8E93',
        marginTop: SquareCardMeasurements.session.dateMarginTop,
    },
    // Keep old names for compatibility with Modal
    sessionSquareCard: {
        width: SquareCardMeasurements.cardWidth,
        height: SquareCardMeasurements.cardHeight,
        backgroundColor: '#2A292A',
        borderRadius: SquareCardMeasurements.borderRadius,
        padding: SquareCardMeasurements.padding,
        justifyContent: 'flex-start',
    },
    sessionSquareHeader: {
        fontSize: SquareCardMeasurements.session.headerFontSize,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: SquareCardMeasurements.session.headerMarginTop,
    },
    sessionSquareIconRow: {
        marginTop: SquareCardMeasurements.session.iconRowMarginTop,
        marginBottom: 4,
    },
    sessionSquareIconCircle: {
        width: SquareCardMeasurements.session.iconCircleSize,
        height: SquareCardMeasurements.session.iconCircleSize,
        borderRadius: SquareCardMeasurements.session.iconCircleSize / 2,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionSquareWorkoutName: {
        fontSize: SquareCardMeasurements.session.workoutNameFontSize,
        color: '#FFF',
        marginTop: SquareCardMeasurements.session.workoutNameMarginTop,
    },
    sessionSquareMetric: {
        fontSize: SquareCardMeasurements.session.metricFontSize,
        fontWeight: '700',
        color: '#9DEC2C',
        marginTop: SquareCardMeasurements.session.metricMarginTop,
    },
    sessionSquareUnit: {
        fontSize: SquareCardMeasurements.session.unitFontSize,
        color: '#9DEC2C',
    },
    sessionSquareDate: {
        fontSize: SquareCardMeasurements.session.dateFontSize,
        color: '#8E8E93',
        marginTop: SquareCardMeasurements.session.dateMarginTop,
    },
});
