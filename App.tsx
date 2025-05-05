import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { COLORS } from './utils/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  return (
    <AuthProvider>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;