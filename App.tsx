import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { COLORS } from './utils/theme';
import { BluetoothProvider } from './context/BluetoothContext';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  return (
    <AuthProvider>
      <BluetoothProvider>
      <StatusBar 
        backgroundColor="transparent" 
        barStyle="light-content" 
        translucent={true} 
      />
      <AppNavigator />
      </BluetoothProvider>
    </AuthProvider>
  );
};

export default App;