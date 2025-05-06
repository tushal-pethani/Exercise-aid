import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager } from 'react-native-ble-plx';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

// Create context
const BluetoothContext = createContext();

export const BluetoothProvider = ({ children }) => {
  const [manager] = useState(() => new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load connection state from storage on app start
  useEffect(() => {
    const loadConnection = async () => {
      try {
        const storedDevice = await AsyncStorage.getItem('connectedDevice');
        
        if (storedDevice) {
          const device = JSON.parse(storedDevice);
          setIsConnected(device.isConnected);
          setDeviceInfo(device);
        }
      } catch (err) {
        console.error('Error loading connection state', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadConnection();
    
    // Cleanup BLE manager when unmounting
    return () => {
      manager.destroy();
    };
  }, []);

  // Request necessary permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Bluetooth Permission',
            message: 'This app needs access to your location to scan for Bluetooth devices.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          setError('Location permission denied');
          return false;
        }
      } catch (err) {
        setError('Error requesting permissions');
        console.error(err);
        return false;
      }
    }
    // iOS doesn't need explicit permission for BLE scanning
    return true;
  };

  // Scan for devices
  const scanForDevices = async (callback) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    setIsScanning(true);
    setError(null);
    
    // Set a timeout to stop scanning after 10 seconds
    setTimeout(() => {
      if (isScanning) {
        manager.stopDeviceScan();
        setIsScanning(false);
      }
    }, 10000);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setError('Scan error: ' + error.message);
        setIsScanning(false);
        return;
      }

      // Only include devices with a name
      if (device?.name) {
        callback && callback(device);
      }
    });
  };

  // Stop scanning
  const stopScan = () => {
    if (isScanning) {
      manager.stopDeviceScan();
      setIsScanning(false);
    }
  };

  // Connect to a device
  const connectToDevice = async (device) => {
    try {
      stopScan();
      
      // Store connected device info in AsyncStorage for later use
      const deviceData = {
        id: device.id,
        name: device.name,
        isConnected: true,
        connectedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('connectedDevice', JSON.stringify(deviceData));
      
      // Update state
      setConnectedDevice(device);
      setIsConnected(true);
      setDeviceInfo(deviceData);
      
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      setError('Connection error');
      return false;
    }
  };

  // Disconnect from a device
  const disconnectDevice = async () => {
    try {
      // Clear connected device info
      await AsyncStorage.removeItem('connectedDevice');
      
      // Update state
      setConnectedDevice(null);
      setIsConnected(false);
      setDeviceInfo(null);
      
      Alert.alert('Success', 'Device disconnected successfully');
      return true;
    } catch (error) {
      console.error('Error disconnecting device:', error);
      Alert.alert('Error', 'Failed to disconnect device');
      return false;
    }
  };

  return (
    <BluetoothContext.Provider
      value={{
        manager,
        connectedDevice,
        isConnected,
        isScanning,
        deviceInfo,
        loading,
        error,
        scanForDevices,
        stopScan,
        connectToDevice,
        disconnectDevice
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

// Hook to use the bluetooth context
export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}; 