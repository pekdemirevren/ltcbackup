import { StyleSheet } from 'react-native';
import { SquareCardMeasurements } from './SquareCardBase';

export const AddCardButtonStyle = StyleSheet.create({
    addButton: {
        backgroundColor: '#9DEC2C',
        borderRadius: 100,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SquareCardMeasurements.modal.addButtonMarginBottom,
        width: '100%',
    },
    addButtonText: {
        fontSize: SquareCardMeasurements.modal.addButtonFontSize,
        fontWeight: SquareCardMeasurements.modal.addButtonFontWeight,
        color: '#2C2C2E',
    },
    addButtonPassive: {
        backgroundColor: '#39393D',
        borderRadius: 100,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SquareCardMeasurements.modal.addButtonMarginBottom,
        width: '100%',
    },
    addButtonTextPassive: {
        fontSize: SquareCardMeasurements.modal.addButtonFontSize,
        fontWeight: SquareCardMeasurements.modal.addButtonFontWeight,
        color: '#606166',
    },
});
