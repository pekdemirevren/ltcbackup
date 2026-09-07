import { StyleSheet, Platform } from 'react-native';

export const FabMenuStyles = StyleSheet.create({
  // FAB Container
  fabContainer: {
    position: 'absolute',
    right: 3,
    bottom: -62,
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Modal Overlay - tıklanabilir arka plan
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 5,
  },

  // Menu Wrapper - animasyon için
  fabMenuWrapper: {
    marginRight: 8,
    alignItems: 'center',
  },

  // BlurView stili - tek katman, blur arka plan (bottomLargeButton ile eşitlenmiş)
  fabMenuBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    width: 260,
    zIndex: 100,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },

  // Menu Content - BlurView içindeki semi-transparent overlay (bottomLargeButton ile eşitlenmiş)
  fabMenuContent: {
    backgroundColor: 'transparent',
  },

  // Menu Item (DailySummaryDetailScreen goal menu ile eşitlenmiş)
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 25,
    paddingLeft: 31,
  },

  // Menu Icon (DailySummaryDetailScreen goal menu ile eşitlenmiş) - fixed width for alignment
  fabMenuIcon: {
    width: 20,
    marginRight: 12,
  },

  // Menu Text (DailySummaryDetailScreen goal menu ile eşitlenmiş)
  fabMenuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Separator
  fabMenuSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },

  // FAB Button Outer
  fabOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 0,
      },
    }),
  },

  // FAB Button Inner
  fabInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  // FAB Icon Text
  fabIconText: {
    color: '#9DEC2C',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Platform-specific blur settings
export const getBlurSettings = () => {
  return Platform.select({
    ios: {
      blurType: 'dark' as const,
      blurAmount: 20,
      reducedTransparencyFallbackColor: 'transparent',
    },
    android: {
      blurType: 'dark' as const,
      blurAmount: 20,
      reducedTransparencyFallbackColor: 'transparent',
      overlayColor: 'transparent',
    },
  }) || {
    blurType: 'dark' as const,
    blurAmount: 20,
    reducedTransparencyFallbackColor: 'transparent',
  };
};

export default FabMenuStyles;
