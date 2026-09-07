import { StyleSheet, Platform } from 'react-native';
import { ThemeContextType } from '../contexts/ThemeContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPicker.styles';

export const getStyles = (colors: ThemeContextType['colors'], isAnyPickerVisible: boolean) => {
    const commonStyles = getCardButtonPickerStyles(colors, isAnyPickerVisible);

    return StyleSheet.create({
        ...commonStyles,

        // Custom overrides for MoveGoalScheduleScreen
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
            marginTop: 10,
            marginBottom: 32,
            paddingHorizontal: 24,
            alignItems: 'flex-start',
        },
        mainTitle: {
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

        // Chart styles
        chartWrapper: {
            flexDirection: 'row',
            height: 150,
            marginBottom: 30,
            alignItems: 'flex-end',
            paddingHorizontal: 24,
        },
        chartArea: {
            flex: 1,
            height: 120,
            justifyContent: 'flex-end',
            position: 'relative',
        },
        guideLine: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
        },
        gridLine: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 0.5,
            backgroundColor: 'rgba(255,255,255,0.1)',
        },
        chartBars: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            height: 100,
            zIndex: 1,
        },
        barContainer: {
            alignItems: 'center',
        },
        bar: {
            width: 2,
            backgroundColor: '#F9104E',
            borderRadius: 1,
            marginBottom: 8,
        },
        barLabel: {
            color: '#8E8E93',
            fontSize: 10,
        },
        chartAxis: {
            width: 40,
            justifyContent: 'space-between',
            height: 120,
            alignItems: 'flex-end',
            paddingLeft: 8,
        },
        axisLabel: {
            color: '#8E8E93',
            fontSize: 10,
        },

        // List styles
        listContainer: {
            paddingBottom: 24,
            paddingHorizontal: 13,
        },

        // Day Card Specifics
        card: {
            ...commonStyles.card,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 32,
            paddingVertical: 13, // Reduced by 8px total (4px top + 4px bottom)
            paddingHorizontal: 24, // Increased for better internal spacing
        },
        cardTextContainer: {
            flex: 1,
        },
        dayText: {
            fontSize: 17, // Reduced by 1 unit
            fontWeight: '600',
            color: '#ffffffff',
            marginBottom: 4,
            marginLeft: 4, // Added small extra left margin
        },
        calculatedText: {
            fontSize: 16,
            color: '#8E8E93',
            fontWeight: '600',
        },
        valueContainer: {
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            marginRight: 4, // Added small extra right margin
        },
        valueText: {
            fontSize: 20,
            fontWeight: '700',
        },
        valueUnit: {
            fontSize: 14,
            fontWeight: '600',
        },

        // Expanded Picker Logic (Side-by-side)
        expandedPickersRow: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: 'hidden',
            marginBottom: 10, // Spacing to next card
        },
        pickerCol: {
            flex: 1,
            alignItems: 'center',
        },
        pickerColLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: '#8E8E93',
            marginTop: 12,
            letterSpacing: 1,
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
        pickerItem: {
            fontSize: 22,
            color: colors.text,
        },
        pickerGradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 0, // Disabled linear gradient effect
            zIndex: 1,
        },

        // Footer
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
