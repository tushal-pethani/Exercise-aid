import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Device } from 'react-native-ble-plx';
import DeviceScanScreen from './components/DeviceScanScreen';
import VisualizationScreen from './components/VisualizationScreen';
import ExerciseStartScreen from './components/ExerciseStartScreen';
import ExerciseScreen from './components/ExerciseScreen';

// App flow:
// 1. Start with DeviceScanScreen to find and connect to device
// 2. After connection, show ExerciseStartScreen with instructions
// 3. When user starts exercise, show ExerciseScreen with gauges
// 4. When exercise is finished, go back to scan screen or offer to restart

type AppScreen = 'scan' | 'start' | 'exercise' | 'visualization';

const App = () => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('scan');

  const handleDeviceConnect = (device: Device) => {
    setConnectedDevice(device);
    setCurrentScreen('start');
  };

  const handleDeviceDisconnect = () => {
    setConnectedDevice(null);
    setCurrentScreen('scan');
  };
  
  const handleStartExercise = () => {
    setCurrentScreen('exercise');
  };
  
  const handleFinishExercise = () => {
    setCurrentScreen('start');
  };
  
  const handleShowVisualization = () => {
    setCurrentScreen('visualization');
  };

  // Render the appropriate screen based on current state
  if (currentScreen === 'scan') {
    return <DeviceScanScreen onDeviceConnect={handleDeviceConnect} />;
  }
  
  if (currentScreen === 'start' && connectedDevice) {
    return (
      <ExerciseStartScreen 
        onStartExercise={handleStartExercise} 
        deviceName={connectedDevice.name || 'Unknown Device'} 
      />
    );
  }
  
  if (currentScreen === 'exercise' && connectedDevice) {
    return (
      <ExerciseScreen
        device={connectedDevice}
        onFinishExercise={handleFinishExercise}
      />
    );
  }
  
  if (currentScreen === 'visualization' && connectedDevice) {
    return (
      <VisualizationScreen 
        device={connectedDevice} 
        onDisconnect={handleDeviceDisconnect} 
      />
    );
  }
  
  // Fallback screen (should rarely happen)
  return <DeviceScanScreen onDeviceConnect={handleDeviceConnect} />;
};

export default App;