import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { SafeAreaView } from 'react-native';

interface DeviceScanScreenProps {
  onDeviceConnect: (device: Device) => void;
}

const DeviceScanScreen: React.FC<DeviceScanScreenProps> = ({ onDeviceConnect }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manager] = useState(() => new BleManager());
  
  // Create animated value for pulsating effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Use this ref to keep track of discovered device IDs
  const deviceIdsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    requestPermissions();

    return () => {
      manager.stopDeviceScan();
    };
  }, []);
  
  // Add pulsating animation when scanning
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning, pulseAnim]);

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
          scanForDevices();
        } else {
          setError('Location permission denied');
        }
      } catch (err) {
        setError('Error requesting permissions');
        console.error(err);
      }
    } else {
      // iOS doesn't need explicit permission for BLE scanning
      scanForDevices();
    }
  };

  const scanForDevices = () => {
    setIsScanning(true);
    setDevices([]);
    setError(null);
    
    // Clear the device IDs set when starting a new scan
    deviceIdsRef.current.clear();

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

      // Only add devices with a name and don't add duplicates using our ref
      if (device?.name && !deviceIdsRef.current.has(device.id)) {
        deviceIdsRef.current.add(device.id);
        setDevices(prevDevices => [...prevDevices, device]);
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      setIsScanning(false);
      manager.stopDeviceScan();
      onDeviceConnect(device);
    } catch (error) {
      setError('Connection error');
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: Device }) => {
    const isMPU6050 = item.name?.includes('ESP32-MPU6050') || item.name?.includes('MPU6050');
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isMPU6050 && styles.highlightedDevice
        ]}
        onPress={() => connectToDevice(item)}
      >
        <View style={styles.deviceIconContainer}>
          {isMPU6050 ? (
            <View style={styles.sensorIcon}>
              <Text style={styles.sensorIconText}>MPU</Text>
            </View>
          ) : (
            <View style={styles.genericIcon}>
              <Text style={styles.genericIconText}>BT</Text>
            </View>
          )}
        </View>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, isMPU6050 && styles.highlightedText]}>
            {item.name || 'Unknown Device'}
          </Text>
          <Text style={styles.deviceId}>{item.id}</Text>
          {isMPU6050 && (
            <Text style={styles.compatibleText}>Compatible Device</Text>
          )}
        </View>
        <View style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ESP32 Motion Visualizer</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>MPU</Text>
            </View>
          </View>
          <Text style={styles.instruction}>
            Scan for nearby ESP32-MPU6050 devices and tap to connect
          </Text>
        </View>

        {isScanning ? (
          <View style={styles.scanningContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </Animated.View>
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.scanButton} onPress={scanForDevices}>
            <Text style={styles.scanButtonText}>Scan for Devices</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            {devices.length > 0 ? 'Available Devices' : 'No devices found'}
          </Text>
          <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              !isScanning && (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    No Bluetooth devices found. Try scanning again.
                  </Text>
                </View>
              )
            }
            style={styles.deviceList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 20,
  },
  scanningText: {
    color: '#4CAF50',
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#9e9e9e',
    fontSize: 16,
    marginBottom: 8,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1E1E1E',
  },
  highlightedDevice: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#2E2E2E',
  },
  deviceIconContainer: {
    marginRight: 16,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  genericIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#757575',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genericIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  deviceId: {
    color: '#9e9e9e',
    fontSize: 12,
  },
  highlightedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  compatibleText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  connectButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  emptyListText: {
    color: '#9e9e9e',
    textAlign: 'center',
  },
});

export default DeviceScanScreen; 