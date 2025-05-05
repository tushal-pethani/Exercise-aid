import React, { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Text,
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'base-64';
import parseSensorData from './utils/parseSensorData.ts';
import AngleGauge from './components/AngleGauge';
import MomentumGauge from './components/MomentumGauge';

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

interface SensorData {
  acc?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
}

const App = () => {
  const manager = new BleManager();
  const [data, setData] = useState<string[]>([]);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [latestAcc, setLatestAcc] = useState<{ x: number; y: number; z: number } | null>(null);
  const [latestGyro, setLatestGyro] = useState<{ x: number; y: number; z: number } | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanAndConnect();
        subscription.remove();
      }
    }, true);

    return () => {
      manager.destroy();
    };
  }, []);

  const scanAndConnect = () => {
    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
        return;
      }

      if (device?.name === 'ESP32-MPU6050') {
        setDeviceName(device.name);
        manager.stopDeviceScan();

        try {
          const connectedDevice = await device.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();
          const services = await connectedDevice.services();

          for (const service of services) {
            if (service.uuid.toLowerCase().includes(SERVICE_UUID)) {
              const characteristics = await service.characteristics();
              for (const char of characteristics) {
                if (char.uuid.toLowerCase().includes(CHARACTERISTIC_UUID)) {
                  char.monitor((error, characteristic) => {
                    if (error) {
                      console.warn('Notification error:', error);
                      return;
                    }
                    const value = characteristic?.value;
                    if (value) {
                      const decoded = base64.decode(value);
                      setData((prev) => [decoded, ...prev.slice(0, 19)]);
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
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>
        {deviceName ? `Connected to ${deviceName}` : 'Scanning for ESP32...'}
      </Text>

      {/* Angle Gauge Visualization */}
      <View style={styles.gaugeContainer}>
        <AngleGauge accData={latestAcc} gyroData={latestGyro} thresholdAngle={90} />
      </View>

      {/* Momentum Gauge Visualization */}
      <View style={styles.gaugeContainer}>
        <MomentumGauge accData={latestAcc} />
      </View>

      {/* Sensor Data Display */}
      <View style={styles.dataDisplay}>
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

      {/* Raw Data Log (Optional) */}
      {showRawData && (
        <View style={styles.rawDataContainer}>
          <FlatList
            data={data}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.dataText}>{item}</Text>}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    padding: 10 
  },
  heading: { 
    color: '#0f0', 
    fontSize: 20, 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  gaugeContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  dataDisplay: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 5,
  },
  sensorText: { 
    color: '#fff', 
    fontSize: 16, 
    marginVertical: 5 
  },
  rawDataContainer: {
    height: 150,
    marginVertical: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 5,
  },
  dataText: { 
    color: '#ccc', 
    fontSize: 12, 
    marginVertical: 2 
  },
});

export default App;