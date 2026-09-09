import 'react-native-gesture-handler/jestSetup';

const mockSerializableMappingCache = new Map();
const mockRuntimeKind = { ReactNative: 0, Worklet: 1 };

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  default: {},
  useSharedValue: jest.fn(),
  useRunOnJS: jest.fn(),
  useWorklet: jest.fn(),
  createWorkletRuntime: jest.fn(),
  runOnUI: jest.fn(),
  runOnJS: jest.fn(),
  makeMutable: jest.fn((value) => value),
  createSerializable: jest.fn((value) => value),
  makeShareableCloneRecursive: jest.fn((value) => value),
  isWorkletFunction: jest.fn(() => false),
  serializableMappingCache: mockSerializableMappingCache,
  scheduleOnUI: jest.fn(),
  RuntimeKind: mockRuntimeKind,
}));

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock');
  return {
    ...reanimated,
    configureReanimatedLogger: jest.fn(),
    ReanimatedLogLevel: { warn: 'warn', error: 'error', info: 'info' },
  };
});

jest.mock('react-native-orientation-locker', () => ({
  __esModule: true,
  default: {
    lockToPortrait: jest.fn(),
    lockToLandscape: jest.fn(),
    unlockAllOrientations: jest.fn(),
    addOrientationListener: jest.fn(),
    removeOrientationListener: jest.fn(),
    getOrientation: jest.fn(() => 'PORTRAIT'),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
