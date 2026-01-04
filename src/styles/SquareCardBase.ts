import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Square Card Measurements and Basic Styles
 * Extracted from SquareCardStyles.ts for shared use.
 */
export const SquareCardMeasurements = {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    cardWidth: (SCREEN_WIDTH - 42) / 2,
    cardHeight: 170,
    borderRadius: 16,
    padding: 16,

    // Session Square Internal Spacings
    session: {
        headerMarginTop: 1,
        iconRowMarginTop: 11,
        workoutNameMarginTop: -1,
        metricMarginTop: -2,
        dateMarginTop: 10,
        headerFontSize: 17,
        iconCircleSize: 37,
        workoutNameFontSize: 17,
        metricFontSize: 30,
        unitFontSize: 22,
        dateFontSize: 13,
    },
    // Workout Square Internal Spacings
    workout: {
        headerMarginTop: -3,
        headerMarginLeft: -6,
        containerMarginTop: 10,
        iconSize: 135,
        nameMarginTop: 8,
        actionMarginTop: 4,
        headerFontSize: 18,
        nameFontSize: 15,
        actionFontSize: 13,
    },

    // Global Modal Layout
    modal: {
        titleMarginTop: -48,
        titleMarginBottom: 8,
        descriptionMarginBottom: 92,
        paginationMarginBottom: 19,
        addButtonMarginBottom: 9,
        addButtonFontSize: 18,
        addButtonFontWeight: '600' as const,
        carouselCardTop: 98,
        carouselCardPaddingTop: 12,
        carouselListTop: 88,
        carouselListHeight: 196,
    },

    stack: {
        frontTop: 10,
        frontLeft: 24,
        backTop: 15,
        backLeft: ((SCREEN_WIDTH - 40 - ((SCREEN_WIDTH - 42) / 2)) / 2) + 20,
        backScale: 0.75,
        farBackTop: 15,
        farBackLeft: -50,
        farBackScale: 0.65,
    },

    // Trends Square Internal Spacings
    trends: {
        headerFontSize: 17,
        headerMarginTop: 10,
        headerMarginLeft: 16,
        iconSize: 56,
        iconMarginTop: 12,
        iconMarginLeft: 16,
        labelFontSize: 17,
        labelMarginTop: 15,
        labelMarginLeft: 16,
        valueFontSize: 17,
        valueFontWeight: '700' as const,
        valueColor: '#5AC8FA',
    }
};
