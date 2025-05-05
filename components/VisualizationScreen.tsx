import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'base-64';
import parseSensorData from '../utils/parseSensorData';
import AngleGauge from './AngleGauge';
import MomentumGauge from './MomentumGauge';

interface VisualizationScreenProps {
  device: Device;
  onDisconnect: () => void;
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

interface SensorData {
  acc?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
}

const VisualizationScreen: React.FC<VisualizationScreenProps> = ({ device, onDisconnect }) => {
  const [latestAcc, setLatestAcc] = useState<{ x: number; y: number; z: number } | null>(null);
  const [latestGyro, setLatestGyro] = useState<{ x: number; y: number; z: number } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [manager] = useState(() => new BleManager());

  useEffect(() => {
    let unmounted = false;
    
    const connectAndListen = async () => {
      try {
        if (unmounted) return;
        
        setConnectionStatus('connecting');
        
        // Connect to the device
        const connectedDevice = await device.connect();
        
        if (unmounted) {
          // If component unmounted during connection, disconnect
          await connectedDevice.cancelConnection();
          return;
        }
        
        // Discover services and characteristics
        await connectedDevice.discoverAllServicesAndCharacteristics();
        const services = await connectedDevice.services();
        
        setConnectionStatus('connected');
        
        // Find the sensor data service
        for (const service of services) {
          if (service.uuid.toLowerCase().includes(SERVICE_UUID)) {
            const characteristics = await service.characteristics();
            
            // Find the sensor data characteristic
            for (const char of characteristics) {
              if (char.uuid.toLowerCase().includes(CHARACTERISTIC_UUID)) {
                // Listen for notifications
                char.monitor((error, characteristic) => {
                  if (error) {
                    console.warn('Notification error:', error);
                    if (!unmounted) {
                      setConnectionStatus('error');
                    }
                    return;
                  }
                  
                  const value = characteristic?.value;
                  if (value && !unmounted) {
                    const decoded = base64.decode(value);
                    const parsed = parseSensorData(decoded) as SensorData;
                    
                    if (parsed && parsed.acc) setLatestAcc(parsed.acc);
                    if (parsed && parsed.gyro) setLatestGyro(parsed.gyro);
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Connection error:', err);
        if (!unmounted) {
          setConnectionStatus('error');
          Alert.alert(
            'Connection Error',
            'Failed to connect to the device. Please try again.',
            [{ text: 'OK', onPress: onDisconnect }]
          );
        }
      }
    };
    
    connectAndListen();
    
    // Clean up on unmount
    return () => {
      unmounted = true;
      // Disconnect when component unmounts
      device.cancelConnection().catch(error => {
        console.warn('Disconnect error:', error);
      });
      manager.destroy();
    };
  }, [device]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ESP32 Motion Visualization</Text>
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>Connected to: {device.name}</Text>
        <Text style={styles.connectionStatus}>
          Status: {
            connectionStatus === 'connecting' ? 'Connecting...' :
            connectionStatus === 'connected' ? 'Connected' :
            'Connection Error'
          }
        </Text>
      </View>
      
      {connectionStatus === 'connecting' ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Connecting to device...</Text>
        </View>
      ) : (
        <>
          {/* Angle Gauge Visualization */}
          <View style={styles.gaugeContainer}>
            <Text style={styles.gaugeTitle}>Device Angle</Text>
            <AngleGauge accData={latestAcc} gyroData={latestGyro} thresholdAngle={90} />
          </View>

          {/* Momentum Gauge Visualization */}
          <View style={styles.gaugeContainer}>
            <Text style={styles.gaugeTitle}>Device Momentum</Text>
            <MomentumGauge accData={latestAcc} />
          </View>

          {/* Sensor Data Display */}
          <View style={styles.dataDisplay}>
            <Text style={styles.dataTitle}>Sensor Data</Text>
            {latestAcc && (
              <Text style={styles.sensorText}>
                Acc → X: {latestAcc.x.toFixed(2)} Y: {latestAcc.y.toFixed(2)} Z: {latestAcc.z.toFixed(2)}
              </Text>
            )}
            {latestGyro && (
              <Text style={styles.sensorText}>
                Gyro → X: {latestGyro.x.toFixed(2)} Y: {latestGyro.y.toFixed(2)} Z: {latestGyro.z.toFixed(2)}
              </Text>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  disconnectText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  deviceInfo: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  connectionStatus: {
    color: '#9e9e9e',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4CAF50',
    fontSize: 18,
  },
  gaugeContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  gaugeTitle: {
    color: '#9e9e9e',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  dataDisplay: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
  },
  dataTitle: {
    color: '#9e9e9e',
    fontSize: 16,
    marginBottom: 8,
  },
  sensorText: {
    color: 'white',
    fontSize: 14,
    marginVertical: 4,
    fontFamily: 'monospace',
  },
});

export default VisualizationScreen; 