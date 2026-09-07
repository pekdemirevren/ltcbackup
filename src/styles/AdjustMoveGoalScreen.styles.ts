import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPicker.styles';

export const getStyles = (colors: ThemeContextType['colors'], isAnyPickerVisible: boolean) => {
    const commonStyles = getCardButtonPickerStyles(colors, isAnyPickerVisible);

    return StyleSheet.create({
        ...commonStyles,

        container: {
            flex: 1,
            backgroundColor: '#1C1C1E',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            overflow: 'hidden',
        },
        absoluteHeaderRow: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            zIndex: 10,
        },
        headerIconButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 0.8,
            borderColor: 'rgba(255, 255, 255, 0.18)',
            zIndex: 2,
        },
        headerIcons: {
            flexDirection: 'row',
            padding: 4,
            borderRadius: 24,
            borderWidth: 0.8,
            borderColor: 'rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            alignItems: 'center',
        },
        iconButton: {
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
        },
        stickyHeaderBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            zIndex: 0,
        },
        stickyHeaderTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
        },
        header: {
            paddingTop: 86, // 12 + 44 + 30
            paddingHorizontal: 24,
            paddingBottom: 20,
            alignItems: 'flex-start'
        },
        scrollContent: {
            paddingTop: 0,
            paddingBottom: 160,
        },
        headerTextSection: {
            paddingHorizontal: 24,
            marginBottom: 32,
            alignItems: 'flex-start',
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
        },
        description: {
            fontSize: 19, // Increased by 1 unit
            color: '#8E8E93',
            lineHeight: 24,
            textAlign: 'left',
        },

        // Picker Card Specifics
        pickerContainer: {
            width: '100%',
            marginTop: 100, // Moved 50px more down (was 50, now 100)
            marginBottom: 20,
            paddingHorizontal: 13,
        },
        pickerSection: {
            marginBottom: 10,
        },
        pickerCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 32,
            paddingHorizontal: 24, // Increased from 16 for better internal spacing
            paddingVertical: 17,
        },
        pickerCardLabel: {
            color: '#ffffffff',
            fontSize: 17, // Reduced by 1 unit
            fontWeight: '500',
            letterSpacing: 0.5,
            marginLeft: 4, // Added extra left margin
        },
        pickerCardValueRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 4,
        },
        valueContainer: {
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            marginRight: 4,
        },
        valueText: {
            fontSize: 20,
            fontWeight: '700',
        },
        valueUnit: {
            fontSize: 14,
            fontWeight: '500',
            marginLeft: 4,
        },
        pickerCardValueText: {
            color: colors.text,
            fontSize: 22,
            fontWeight: '700',
        },

        // Expanded Picker wrapper
        expandedPickerContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: 'hidden',
            marginBottom: 10,
        },
        recessedPickerWrapper: {
            width: '100%',
            height: 200, // Reduced to match TimeSettingsScreen style
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
        },
        pickerControl: {
            width: '100%',
            height: 200,
            alignSelf: 'center',
        },
        pickerGradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 60,
            zIndex: 1,
        },
        pickerItem: {
            fontSize: 22,
            color: colors.text,
        },
        pickerColLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: '#8E8E93',
            marginTop: 12,
            alignSelf: 'center',
            letterSpacing: 1,
        },

        // Calculated 1RM Result
        calculated1RMContainer: {
            alignItems: 'center',
            marginTop: 10, // Reduced to sit closer to cards
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(255,255,255,0.06)', // Matched to pickerCard
            borderRadius: 32,
            alignSelf: 'center',
            borderWidth: 0.8,
            borderColor: 'rgba(255,255,255,0.18)',
        },
        calculated1RMLabel: {
            color: '#F9104E',
            fontSize: 14,
            fontWeight: '700',
            marginBottom: 8,
            letterSpacing: 1,
        },
        calculated1RMValue: {
            fontSize: 44,
            fontWeight: '800',
            color: colors.text,
        },

        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Moved 10px lower
            backgroundColor: 'transparent',
            zIndex: 10,
        },
        footerGradient: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120, // Enough to cover button and fade
        },
        actionButton: {
            paddingVertical: 18,
            borderRadius: 32,
            alignItems: 'center',
        },
        actionButtonText: {
            color: '#CCFF00',
            fontSize: 18,
            fontWeight: '700',
        },
    });
};
