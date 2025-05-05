import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  Dimensions,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'base-64';
import parseSensorData from '../utils/parseSensorData';
import ExerciseAngleGauge from './ExerciseAngleGauge';
import ExerciseMomentumGauge from './ExerciseMomentumGauge';

interface ExerciseScreenProps {
  device: Device;
  onFinishExercise: () => void;
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

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ device, onFinishExercise }) => {
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
      
      // Use the larger of pitch or roll for lateral raises
      const angle = Math.abs(roll);
      setCurrentAngle(angle);
      
      // Track exercise state
      if (angle > REP_THRESHOLD && !repInProgressRef.current) {
        // Started a new rep
        repInProgressRef.current = true;
        setExerciseState('raising');
        maxAngleReachedRef.current = angle;
      } else if (angle > maxAngleReachedRef.current && repInProgressRef.current) {
        // Continuing to raise
        maxAngleReachedRef.current = angle;
        setExerciseState('raising');
      } else if (angle < maxAngleReachedRef.current - 15 && repInProgressRef.current) {
        // Started lowering
        setExerciseState('lowering');
      } else if (angle < REST_THRESHOLD && repInProgressRef.current) {
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
      
      // Combine both factors, with more weight on gyroscope for momentum
      const momentum = (gyroMagnitude * 0.7 + accMagnitude * 0.3) * 10;
      
      // Apply some smoothing
      setCurrentMomentum(prev => prev * 0.7 + momentum * 0.3);
    }
  }, [latestAcc, latestGyro]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lateral Raise Exercise</Text>
        {!isConnected && (
          <Text style={styles.connectionWarning}>⚠️ Connection lost</Text>
        )}
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={onFinishExercise}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.repCountContainer}>
        <Text style={styles.repCountLabel}>Repetitions</Text>
        <Text style={styles.repCount}>{repCount}</Text>
        {feedback && (
          <Text style={styles.feedback}>{feedback}</Text>
        )}
      </View>
      
      <View style={styles.gaugeContainer}>
        <Text style={styles.gaugeTitle}>Arm Angle</Text>
        <ExerciseAngleGauge 
          currentAngle={currentAngle} 
          thresholdAngle={TARGET_ANGLE}
          warningThreshold={TARGET_ANGLE - 10}
        />
      </View>
      
      <View style={styles.gaugeContainer}>
        <Text style={styles.gaugeTitle}>Movement Speed</Text>
        <ExerciseMomentumGauge 
          momentum={currentMomentum}
          maxMomentum={MOMENTUM_THRESHOLD * 1.5}
        />
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={[
          styles.statusText,
          exerciseState === 'raising' && styles.raisingText,
          exerciseState === 'lowering' && styles.loweringText,
          exerciseState === 'rest' && styles.restText,
        ]}>
          {exerciseState === 'raising' 
            ? 'RAISING - Keep going!' 
            : exerciseState === 'lowering' 
              ? 'LOWERING - Control the movement' 
              : 'REST - Prepare for next rep'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
  },
  connectionWarning: {
    color: '#FF0000',
    marginHorizontal: 8,
  },
  finishButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  repCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    marginBottom: 16,
  },
  repCountLabel: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  repCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  feedback: {
    fontSize: 14,
    color: '#DDDDDD',
    marginTop: 8,
  },
  gaugeContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  gaugeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#AAAAAA',
    flex: 1,
  },
  raisingText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  loweringText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  restText: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
});

export default ExerciseScreen; 