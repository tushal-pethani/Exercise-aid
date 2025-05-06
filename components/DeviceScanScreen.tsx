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
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useBluetooth } from '../context/BluetoothContext';

interface DeviceScanScreenProps {
  onDeviceConnect?: (device: Device) => void;
}

const DeviceScanScreen: React.FC<DeviceScanScreenProps> = ({ onDeviceConnect }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    isScanning, 
    scanForDevices, 
    stopScan, 
    connectToDevice,
    error 
  } = useBluetooth();
  
  const [devices, setDevices] = useState<Device[]>([]);
  
  // Create animated value for pulsating effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Use this ref to keep track of discovered device IDs
  const deviceIdsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const startScanning = async () => {
      // Clear the device IDs set when starting a new scan
      deviceIdsRef.current.clear();
      setDevices([]);
      
      // Start scanning and collect devices
      await scanForDevices((device) => {
        if (!deviceIdsRef.current.has(device.id)) {
          deviceIdsRef.current.add(device.id);
          setDevices(prevDevices => [...prevDevices, device]);
        }
      });
    };
    
    startScanning();

    return () => {
      stopScan();
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

  const handleScanForDevices = () => {
    // Clear the device IDs set when starting a new scan
    deviceIdsRef.current.clear();
    setDevices([]);
    
    // Start scanning and collect devices
    scanForDevices((device) => {
      if (!deviceIdsRef.current.has(device.id)) {
        deviceIdsRef.current.add(device.id);
        setDevices(prevDevices => [...prevDevices, device]);
      }
    });
  };

  const handleConnectToDevice = async (device: Device) => {
    const success = await connectToDevice(device);
    
    if (success) {
      // Call the onDeviceConnect callback if it exists
      if (onDeviceConnect) {
      onDeviceConnect(device);
      }
      
      // Get exercise config if coming from custom task
      const exerciseConfig = route.params?.exerciseConfig;
      
      if (exerciseConfig) {
        // If we have exercise config, navigate to exercise start screen
        navigation.navigate('ExerciseStart', { exerciseConfig });
      } else {
        // Otherwise just go back
        navigation.goBack();
      }
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
        onPress={() => handleConnectToDevice(item)}
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
          <Text style={styles.deviceId}>{item.id.substring(0, 17)}...</Text>
          {isMPU6050 && (
            <Text style={styles.compatibleText}>Compatible Device</Text>
          )}
        </View>
        <View style={styles.connectButtonContainer}>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => handleConnectToDevice(item)}
          >
          <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />
      
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Connect Device</Text>
        
        <View style={styles.headerRight}>
          {/* Empty view for balance */}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>📡</Text>
            </View>
          </View>
          <Text style={styles.instruction}>
            Scan for nearby ESP32-MPU6050 devices and tap to connect
          </Text>
        </View>

        {isScanning ? (
          <View style={styles.scanningContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
            </Animated.View>
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.scanButton} onPress={handleScanForDevices}>
            <Text style={styles.scanButtonText}>Scan for Devices</Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

          <Text style={styles.sectionTitle}>
          {devices.length > 0 
            ? `Available Devices (${devices.length})` 
            : 'No devices found'}
          </Text>

          <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
            style={styles.deviceList}
          />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.paddingSmall,
    paddingBottom: SIZES.paddingSmall,
    backgroundColor: COLORS.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerIcon: {
    fontSize: SIZES.large,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  iconContainer: {
    marginBottom: SIZES.padding,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconText: {
    fontSize: 32,
  },
  instruction: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  scanningContainer: {
    alignItems: 'center',
    marginVertical: SIZES.padding,
  },
  scanningText: {
    marginTop: SIZES.paddingSmall,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginVertical: SIZES.padding,
    ...SHADOWS.small,
  },
  scanButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginVertical: SIZES.padding,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: SIZES.padding,
  },
  deviceList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SIZES.padding,
  },
  deviceItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  highlightedDevice: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  deviceIconContainer: {
    marginRight: SIZES.padding,
  },
  sensorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 173, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  sensorIconText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  genericIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inactive,
  },
  genericIconText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  highlightedText: {
    color: COLORS.secondary,
  },
  deviceId: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  compatibleText: {
    fontSize: SIZES.small,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  connectButtonContainer: {
    marginLeft: SIZES.paddingSmall,
  },
  connectButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
});

export default DeviceScanScreen; 