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
const REP_ZERO_THRESHOLD = 15; // Angle below which arm is considered at 0
const REP_COUNT_THRESHOLD = 85; // Angle threshold to count as crossing 90 degrees

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
  
  // Add rep flash indicator state
  const [showRepFlash, setShowRepFlash] = useState(false);
  
  // Use refs to track the exercise state over time
  const repInProgressRef = useRef(false);
  const maxAngleReachedRef = useRef(0);
  
  // Track zero-to-90 movement
  const [hasReachedZero, setHasReachedZero] = useState(true); // Start true to avoid immediate rep count
  const [hasReached90, setHasReached90] = useState(false);
  
  // Manager for BLE
  const [manager] = useState(() => new BleManager());

  // Add state for tracking angular momentum/velocity
  const [angularVelocity, setAngularVelocity] = useState(0);
  const [angularVelocityThreshold] = useState(35); // degrees per second
  const [isExceedingVelocity, setIsExceedingVelocity] = useState(false);
  const previousAngleRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  // Connection and data handling
  useEffect(() => {
    let unmounted = false;
    
    const connectAndListen = async () => {
      try {
        // Connect to the device
        const connectedDevice = await device.connect();
        console.log('Connected to device:', device.name || device.id);
        
        if (unmounted) {
          await connectedDevice.cancelConnection();
          return;
        }
        
        // Discover services and characteristics
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setIsConnected(true);
        console.log('Services and characteristics discovered');
        
        const services = await connectedDevice.services();
        console.log(`Found ${services.length} services`);
        
        // Find the sensor data service
        for (const service of services) {
          console.log(`Checking service: ${service.uuid}`);
          if (service.uuid.toLowerCase().includes(SERVICE_UUID)) {
            console.log(`Found matching service: ${service.uuid}`);
            const characteristics = await service.characteristics();
            console.log(`Found ${characteristics.length} characteristics`);
            
            // Find the sensor data characteristic
            for (const char of characteristics) {
              console.log(`Checking characteristic: ${char.uuid}`);
              if (char.uuid.toLowerCase().includes(CHARACTERISTIC_UUID)) {
                console.log(`Found matching characteristic: ${char.uuid}`);
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
                    
                    if (parsed && parsed.acc) {
                      setLatestAcc(parsed.acc);
                      console.log('Received acc data:', parsed.acc);
                    }
                    if (parsed && parsed.gyro) {
                      setLatestGyro(parsed.gyro);
                    }
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
    
    // Get accelerometer data
    const x = latestAcc.x;
    const y = latestAcc.y;
    const z = latestAcc.z;
    
    // Use the same raw angle calculation - preserve sign for directionality
    const rawAngle = Math.atan2(x, z) * (180 / Math.PI);
    
    console.log(`Calibrating with raw angle: ${rawAngle.toFixed(1)}°`);
    setCalibrationOffset(rawAngle);
    
    // Reset exercise tracking
    repInProgressRef.current = false;
    maxAngleReachedRef.current = 0;
    setRepCount(0);
    setExerciseState('rest');
    setFeedback('Calibrated! Start your exercise.');
    
    // Reset zero-to-90 tracking
    setHasReachedZero(true);
    setHasReached90(false);
    
    setTimeout(() => {
      setIsCalibrating(false);
    }, 1000);
  };
  
  // Process sensor data to calculate angle and momentum
  useEffect(() => {
    if (latestAcc) {
      // Get accelerometer data - don't use absolute values to preserve direction
      const x = latestAcc.x;
      const y = latestAcc.y;
      const z = latestAcc.z;
      
      // CORRECTED LATERAL RAISE CALCULATION
      // For lateral raises, orient based on device placement:
      // Assuming device is on upper arm with screen facing outward:
      
      // Calculate true angle between arm and vertical (not using absolute values)
      // This preserves the sign and gives a more accurate representation
      const rawAngle = Math.atan2(x, z) * (180 / Math.PI);
      
      // No need to adjust the range - keep full -180 to +180 degrees
      // This preserves directionality and gives a more complete picture
      
      // Apply calibration - will zero the angle at starting position
      const calibratedAngle = rawAngle - calibrationOffset;
      
      // Calculate angular velocity (degrees per second)
      const currentTime = Date.now();
      const elapsedTime = (currentTime - lastUpdateTimeRef.current) / 1000; // seconds
      const angleDifference = calibratedAngle - previousAngleRef.current;
      const velocity = elapsedTime > 0 ? Math.abs(angleDifference / elapsedTime) : 0;
      
      // Update refs for next calculation
      previousAngleRef.current = calibratedAngle;
      lastUpdateTimeRef.current = currentTime;
      
      // Set angular velocity state
      setAngularVelocity(velocity);
      
      // Check if exceeding threshold
      const isExceeding = velocity > angularVelocityThreshold;
      if (isExceeding !== isExceedingVelocity) {
        setIsExceedingVelocity(isExceeding);
        if (isExceeding) {
          // Play alert sound when crossing the threshold
          Vibration.vibrate(100);
          console.log(`Angular velocity threshold exceeded: ${velocity.toFixed(1)}°/s`);
        }
      }
      
      // Debug logging
      console.log(`Raw sensor: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`);
      console.log(`Raw angle: ${rawAngle.toFixed(1)}°, Calibrated: ${calibratedAngle.toFixed(1)}°`);
      console.log(`Angular velocity: ${velocity.toFixed(1)}°/s`);
      
      setCurrentAngle(calibratedAngle);
      
      // Modify rep counting to work with new angle calculation
      // Need to handle positive and negative angles
      const absAngle = Math.abs(calibratedAngle);
      
      if (absAngle <= REP_ZERO_THRESHOLD && !hasReachedZero) {
        setHasReachedZero(true);
        setHasReached90(false);
      } else if (absAngle >= REP_COUNT_THRESHOLD && hasReachedZero && !hasReached90) {
        setHasReached90(true);
        // Increment rep count when crossing from 0 to 90
        setRepCount(prev => prev + 1);
        setFeedback('Rep counted!');
        Vibration.vibrate(200);
        
        // Show the rep flash visual feedback
        setShowRepFlash(true);
        setTimeout(() => setShowRepFlash(false), 500);
      } else if (absAngle > REP_ZERO_THRESHOLD && absAngle < REP_COUNT_THRESHOLD) {
        // In the middle zone - reset hasReached90 when lowering
        if (absAngle < 45 && hasReached90) {
          setHasReached90(false);
        }
      }
      
      // Modify original exercise tracking logic to work with the new angle calculation
      if (absAngle > REP_THRESHOLD && !repInProgressRef.current) {
        // Started a new rep
        repInProgressRef.current = true;
        setExerciseState('raising');
        maxAngleReachedRef.current = absAngle;
      } else if (absAngle > maxAngleReachedRef.current && repInProgressRef.current) {
        // Continuing to raise
        maxAngleReachedRef.current = absAngle;
        setExerciseState('raising');
      } else if (absAngle < maxAngleReachedRef.current - 15 && repInProgressRef.current) {
        // Started lowering
        setExerciseState('lowering');
      } else if (absAngle < REST_THRESHOLD && repInProgressRef.current) {
        // Completed a rep
        repInProgressRef.current = false;
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
        
        // Track that we've reached 0 (resting position) again
        setHasReachedZero(true);
        
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
          thresholdAngle={TARGET_ANGLE} 
        />
        <ExerciseMomentumGauge 
          style={styles.gauge} 
          currentMomentum={currentMomentum} 
          threshold={MOMENTUM_THRESHOLD} 
        />
      </View>
      
      {/* Angular Velocity Display */}
      <View style={styles.velocityContainer}>
        <Text style={styles.velocityLabel}>Angular Velocity:</Text>
        <View style={styles.velocityBarContainer}>
          <View 
            style={[
              styles.velocityBar, 
              {width: `${Math.min(100, (angularVelocity / (angularVelocityThreshold * 2)) * 100)}%`},
              isExceedingVelocity ? styles.velocityBarExceeding : null
            ]} 
          />
        </View>
        <Text style={[
          styles.velocityValue, 
          isExceedingVelocity ? styles.velocityValueExceeding : null
        ]}>
          {angularVelocity.toFixed(1)}°/s
          {isExceedingVelocity && " ⚠️"}
        </Text>
      </View>
      
      <View style={styles.feedbackContainer}>
        <Text style={styles.repCountText}>Repetitions: {repCount}</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>
        
        {/* Visual rep count flash indicator */}
        {showRepFlash && (
          <View style={styles.repFlash}>
            <Text style={styles.repFlashText}>+1 REP</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.calibrateButton]}
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
    opacity: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  repFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  repFlashText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  velocityContainer: {
    padding: 10,
    marginHorizontal: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    marginTop: 5,
  },
  velocityLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
  },
  velocityBarContainer: {
    height: 15,
    backgroundColor: '#555',
    borderRadius: 7.5,
    overflow: 'hidden',
  },
  velocityBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 7.5,
  },
  velocityBarExceeding: {
    backgroundColor: '#FF5252',
  },
  velocityValue: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 5,
  },
  velocityValueExceeding: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
});

export default ExerciseScreen; 