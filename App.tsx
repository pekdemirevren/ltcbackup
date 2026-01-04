import 'react-native-gesture-handler'; // Should be at the very top
import React, { useEffect, useContext } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker'; // Import react-native-orientation-locker

// Tema importları
import Theme from './src/constants/theme'; // default export olduğu için Theme olarak import
import { ThemeContext } from './src/contexts/ThemeContext';
import { TimerProvider } from './src/contexts/TimerContext'; // Import TimerProvider

// Import the RootNavigator
import RootNavigator from './src/navigation/RootNavigator';

// Suppress the deprecated InteractionManager warning
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (typeof message === 'string' && message.includes('InteractionManager has been deprecated')) {
    return;
  }
  originalWarn(message, ...args);
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const currentTheme = Theme.dark; // Currently using only dark theme

  useEffect(() => {
    // Lock the screen orientation to portrait
    Orientation.lockToPortrait();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeContext.Provider value={{ colors: currentTheme, Icons: Theme.Icons }}>
          <NavigationContainer key="reset-nav-state-2">
            <TimerProvider>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <RootNavigator />
            </TimerProvider>
          </NavigationContainer>
        </ThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;