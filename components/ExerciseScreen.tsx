import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Alert,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'base-64';
import parseSensorData from '../utils/parseSensorData';
import ExerciseAngleGauge from './ExerciseAngleGauge';
import ExerciseMomentumGauge from './ExerciseMomentumGauge';
import { COLORS } from '../utils/theme';

interface ExerciseScreenProps {
  route: { params: { device: Device } };
  navigation: any;
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Exercise configuration
const TARGET_ANGLE = 100; // Degrees
const MOMENTUM_THRESHOLD = 70; // Arbitrary units for momentum
const REP_THRESHOLD = 80; // Angle needed to count as a rep
const REST_THRESHOLD = 30; // Angle below which the arm is considered at rest

interface SensorData {
  acc?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
}

const { width } = Dimensions.get('window');

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ route, navigation }) => {
  const { device } = route.params;
  
  // Sensor data states
  const [latestAcc, setLatestAcc] = useState<{ x: number; y: number; z: number } | null>(null);
  const [latestGyro, setLatestGyro] = useState<{ x: number; y: number; z: number } | null>(null);
  
  // Exercise tracking states
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [exerciseState, setExerciseState] = useState<'rest' | 'raising' | 'lowering'>('rest');
  const [feedback, setFeedback] = useState('');
  
  // Track if we're connected
  const [isConnected, setIsConnected] = useState(true);
  
  // Calibration offset for angle
  const [calibrationOffset, setCalibrationOffset] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Use refs to track the exercise state over time
  const repInProgressRef = useRef(false);
  const maxAngleReachedRef = useRef(0);
  
  // Manager for BLE
  const [manager] = useState(() => new BleManager());

  // Connection and data handling
  useEffect(() => {
    let unmounted = false;
    
    const connectAndListen = async () => {
      try {
        // Connect to the device
        const connectedDevice = await device.connect();
        
        if (unmounted) {
          await connectedDevice.cancelConnection();
          return;
        }
        
        // Discover services and characteristics
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setIsConnected(true);
        
        const services = await connectedDevice.services();
        
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
                      setIsConnected(false);
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
          setIsConnected(false);
        }
      }
    };
    
    connectAndListen();
    
    // Clean up on unmount
    return () => {
      unmounted = true;
      device.cancelConnection().catch(error => {
        console.warn('Disconnect error:', error);
      });
      manager.destroy();
    };
  }, [device]);
  
  // Handle calibration
  const calibrateAngle = () => {
    if (!latestAcc) {
      Alert.alert('Error', 'Sensor data not available for calibration');
      return;
    }
    
    setIsCalibrating(true);
    
    // Calculate current angle to use as offset
    const x = latestAcc.x;
    const y = latestAcc.y;
    const z = latestAcc.z;
    
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
    const roll = Math.atan2(-x, z) * (180 / Math.PI);
    
    const currentRawAngle = Math.abs(roll);
    setCalibrationOffset(currentRawAngle);
    
    // Reset exercise tracking
    repInProgressRef.current = false;
    maxAngleReachedRef.current = 0;
    setRepCount(0);
    setExerciseState('rest');
    setFeedback('Calibrated! Start your exercise.');
    
    setTimeout(() => {
      setIsCalibrating(false);
    }, 1000);
  };
  
  // Process sensor data to calculate angle and momentum
  useEffect(() => {
    if (latestAcc) {
      // Calculate arm angle based on accelerometer
      // For lateral raises, we'll primarily use the Y-axis tilt
      const x = latestAcc.x;
      const y = latestAcc.y;
      const z = latestAcc.z;
      
      // Calculate tilt angle - this is simplified for demonstration
      // In real app, would need more complex calculation based on device placement
      const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
      const roll = Math.atan2(-x, z) * (180 / Math.PI);
      
      // Use the larger of pitch or roll for lateral raises and apply calibration
      const rawAngle = Math.abs(roll);
      const calibratedAngle = Math.max(0, rawAngle - calibrationOffset);
      setCurrentAngle(calibratedAngle);
      
      // Track exercise state
      if (calibratedAngle > REP_THRESHOLD && !repInProgressRef.current) {
        // Started a new rep
        repInProgressRef.current = true;
        setExerciseState('raising');
        maxAngleReachedRef.current = calibratedAngle;
      } else if (calibratedAngle > maxAngleReachedRef.current && repInProgressRef.current) {
        // Continuing to raise
        maxAngleReachedRef.current = calibratedAngle;
        setExerciseState('raising');
      } else if (calibratedAngle < maxAngleReachedRef.current - 15 && repInProgressRef.current) {
        // Started lowering
        setExerciseState('lowering');
      } else if (calibratedAngle < REST_THRESHOLD && repInProgressRef.current) {
        // Completed a rep
        repInProgressRef.current = false;
        setRepCount(prev => prev + 1);
        setExerciseState('rest');
        
        // Give feedback based on max angle reached
        if (maxAngleReachedRef.current >= TARGET_ANGLE - 5) {
          setFeedback('Great rep!');
          Vibration.vibrate(200);
        } else if (maxAngleReachedRef.current >= TARGET_ANGLE - 15) {
          setFeedback('Good, but try to raise higher');
          Vibration.vibrate([100, 50, 100]);
        } else {
          setFeedback('Raise your arm higher next time');
          Vibration.vibrate([50, 30, 50, 30, 50]);
        }
        
        // Reset max angle
        maxAngleReachedRef.current = 0;
      }
    }
    
    if (latestAcc && latestGyro) {
      // Calculate momentum based on a combination of acceleration and gyroscope
      // This is a simplified calculation for demonstration
      const accMagnitude = Math.sqrt(
        latestAcc.x * latestAcc.x + 
        latestAcc.y * latestAcc.y + 
        latestAcc.z * latestAcc.z
      );
      
      const gyroMagnitude = Math.sqrt(
        latestGyro.x * latestGyro.x + 
        latestGyro.y * latestGyro.y + 
        latestGyro.z * latestGyro.z
      );
      
      // Combine for momentum (weighted more toward gyro for rotational movement)
      const momentum = Math.min(100, (gyroMagnitude * 0.7 + accMagnitude * 0.3) * 10);
      setCurrentMomentum(momentum);
    }
  }, [latestAcc, latestGyro, calibrationOffset]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Exercise Session</Text>
        {!isConnected && <Text style={styles.connectionError}>Device Disconnected</Text>}
      </View>
      
      <View style={styles.gaugesContainer}>
        <ExerciseAngleGauge 
          style={styles.gauge} 
          currentAngle={currentAngle} 
          targetAngle={TARGET_ANGLE} 
        />
        <ExerciseMomentumGauge 
          style={styles.gauge} 
          currentMomentum={currentMomentum} 
          threshold={MOMENTUM_THRESHOLD} 
        />
      </View>
      
      <View style={styles.feedbackContainer}>
        <Text style={styles.repCountText}>Repetitions: {repCount}</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.calibrateButton, isCalibrating && styles.disabledButton]}
          onPress={calibrateAngle}
          disabled={isCalibrating}
        >
          <Text style={styles.buttonText}>
            {isCalibrating ? 'Calibrating...' : 'Calibrate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Finish Exercise</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  connectionError: {
    fontSize: 14,
    color: 'red',
    marginTop: 4,
  },
  gaugesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  gauge: {
    width: width / 2 - 30,
    height: width / 2 - 30,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  repCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  calibrateButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default ExerciseScreen; 