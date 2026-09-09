module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-worklets|react-native-gesture-handler|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-orientation-locker|react-native-calendars|react-native-linear-gradient|react-native-circular-progress|react-native-draggable-flatlist|react-native-sortables|react-native-sound|react-native-view-shot|react-native-webview|react-native-image-picker|react-native-vector-icons|react-native-haptic-feedback|react-native-calendar-events|@notifee|@callstack|@shopify|@mgcrea|@react-native-community|@react-native-async-storage/async-storage)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};
