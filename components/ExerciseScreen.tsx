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
import { COLORS, SIZES } from '../utils/theme';
import { useBluetooth } from '../context/BluetoothContext';
import RestTimerModal from './RestTimerModal';
import ExerciseCompletionModal from './ExerciseCompletionModal';
import { saveExercise } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface ExerciseConfigType {
  bodyPart: string;
  exercise: string;
  sets: number;
  reps: number;
  targetAngle: number;
  restTime: number;
  assignmentId?: string;
}

interface ExerciseScreenProps {
  route: { 
    params: { 
      device?: Device;
      exerciseConfig?: ExerciseConfigType;
    } 
  };
  navigation: any;
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

interface SensorData {
  acc?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
}

// Define rep performance types for tracking
type RepQuality = 'perfect' | 'good' | 'bad';

const { width } = Dimensions.get('window');

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ route, navigation }) => {
  const { connectedDevice, deviceInfo } = useBluetooth();
  const { user, token } = useAuth();
  const device = connectedDevice || route.params?.device;
  
  // Get exercise config from params or use defaults
  const exerciseConfig = route.params?.exerciseConfig || {
    bodyPart: 'shoulder',
    exercise: 'lateral_raise',
    sets: 3,
    reps: 10,
    targetAngle: 90,
    restTime: 60
  };
  
  // Exercise parameters based on config
  const TARGET_ANGLE = exerciseConfig.targetAngle;
  const MOMENTUM_THRESHOLD = 70; // Arbitrary units for momentum  
  const ANGLE_DEVIATION_THRESHOLD = 10; // Max degrees of deviation from target
  const REP_THRESHOLD = Math.floor(TARGET_ANGLE * 0.8); // 80% of target angle needed to count as a rep
  const REST_THRESHOLD = 30; // Angle below which the arm is considered at rest
  const REP_ZERO_THRESHOLD = 15; // Angle below which arm is considered at 0
  const REP_COUNT_THRESHOLD = Math.floor(TARGET_ANGLE * 0.85); // 85% of target angle to count as crossing threshold
  
  // Sensor data states
  const [latestAcc, setLatestAcc] = useState<{ x: number; y: number; z: number } | null>(null);
  const [latestGyro, setLatestGyro] = useState<{ x: number; y: number; z: number } | null>(null);
  
  // Exercise tracking states
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentMomentum, setCurrentMomentum] = useState(0);
  const [repCount, setRepCount] = useState(0); // Total reps in current set (initialized after calibration)
  const [completedReps, setCompletedReps] = useState(0); // Completed reps in current set
  const [setCount, setSetCount] = useState(0); // Total sets (initialized after calibration)
  const [completedSets, setCompletedSets] = useState(0); // Completed sets
  const [exerciseState, setExerciseState] = useState<'rest' | 'raising' | 'lowering'>('rest');
  const [feedback, setFeedback] = useState('Please calibrate to begin');
  
  // Track if we're connected
  const [isConnected, setIsConnected] = useState(true);
  
  // Calibration offset for angle
  const [calibrationOffset, setCalibrationOffset] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [hasCalibrated, setHasCalibrated] = useState(false);
  
  // Rep quality tracking
  const [perfectReps, setPerfectReps] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [badReps, setBadReps] = useState(0);
  const currentRepQualityRef = useRef<RepQuality>('perfect');
  const totalRepsCompletedRef = useRef(0);
  
  // Modal states
  const [showRestModal, setShowRestModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Timer states
  const [exerciseTime, setExerciseTime] = useState(0);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Warning states
  const [showAngleWarning, setShowAngleWarning] = useState(false);
  const [showVelocityWarning, setShowVelocityWarning] = useState(false);
  
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
  const [angularVelocityThreshold] = useState(120); // Increased threshold to 70 degrees per second
  const [isExceedingVelocity, setIsExceedingVelocity] = useState(false);
  const previousAngleRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  
  // Start the exercise timer
  useEffect(() => {
    // Don't start timer immediately, wait for calibration
    if (hasCalibrated) {
      console.log('Starting exercise timer after calibration');
      exerciseTimerRef.current = setInterval(() => {
        setExerciseTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        if (exerciseTimerRef.current) {
          clearInterval(exerciseTimerRef.current);
        }
      };
    }
  }, [hasCalibrated]);

  // Connection and data handling
  useEffect(() => {
    if (!device) {
      Alert.alert('Error', 'No device connected. Please connect a device first.');
      navigation.goBack();
      return;
    }
    
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
                char.monitor((error: any, characteristic: any) => {
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
      device.cancelConnection().catch((error: any) => {
        console.warn('Disconnect error:', error);
      });
      manager.destroy();
    };
  }, [device]);
  
  // Remove excessive debug logging
  useEffect(() => {
    if (showRestModal) {
      // Leave important logs
      console.log('Rest modal activated');
    }
  }, [showRestModal, exerciseConfig.restTime]);

  // Handle next set after rest period
  const handleRestComplete = () => {
    // Keep essential log
    console.log('Rest completed');
    setShowRestModal(false);
    setCompletedReps(0); // Reset completed reps for next set
    
    // Set number display is 1-based (set 1, set 2, etc.)
    const currentSetNumber = completedSets + 1;
    
    // Give feedback for new set
    setFeedback(`Starting Set ${currentSetNumber} of ${exerciseConfig.sets}`);
  };
  
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
    
    // Initialize counters after calibration
    setRepCount(exerciseConfig.reps);
    setCompletedReps(0);
    setSetCount(exerciseConfig.sets);
    setCompletedSets(0);
    
    setFeedback(`Ready to start! Complete ${exerciseConfig.reps} reps for set 1 of ${exerciseConfig.sets}`);
    
    // Reset zero-to-90 tracking
    setHasReachedZero(true);
    setHasReached90(false);
    
    // Reset rep quality tracking
    setPerfectReps(0);
    setGoodReps(0);
    setBadReps(0);
    totalRepsCompletedRef.current = 0;
    currentRepQualityRef.current = 'perfect';
    
    // Reset exercise time
    setExerciseTime(0);
    
    // Mark as calibrated
    setHasCalibrated(true);
    
    setTimeout(() => {
      setIsCalibrating(false);
    }, 1000);
  };
  
  // Handle exercise completion
  const handleExerciseComplete = () => {
    // Stop the timer
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    
    // Calculate accuracy
    const totalReps = totalRepsCompletedRef.current;
    const accuracy = totalReps > 0 ? (perfectReps / totalReps) * 100 : 0;
    
    // Show completion modal
    setShowCompletionModal(true);
  };
  
  // Handle closing the completion modal and returning to home
  const handleCompletionClose = async () => {
    setShowCompletionModal(false);
    
    // Save exercise to database
    const exerciseData = {
      exerciseType: exerciseConfig.exercise,
      bodyPart: exerciseConfig.bodyPart,
      sets: exerciseConfig.sets,
      reps: exerciseConfig.reps,
      totalReps: exerciseConfig.sets * exerciseConfig.reps,
      perfectReps: perfectReps,
      goodReps: goodReps,
      badReps: badReps,
      timeTaken: exerciseTime,
      accuracy: (perfectReps / (perfectReps + goodReps + badReps)) * 100 || 0,
      targetAngle: exerciseConfig.targetAngle
    };

    try {
      // Save to database through API
      await saveExercise(exerciseData);
      console.log('Exercise saved to database');
      
      // If this is an assigned exercise, mark it as completed
      const assignmentId = route.params?.exerciseConfig?.assignmentId;
      
      if (assignmentId) {
        console.log('Marking assignment as completed:', assignmentId);
        try {
          const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';
          await axios.patch(
            `${API_URL}/assignments/${assignmentId}`,
            { status: 'completed' },
            { headers: { 'x-auth-token': token } }
          );
          console.log('Assignment marked as completed');
        } catch (error) {
          console.error('Error marking assignment as completed:', error);
        }
      }
    } catch (error) {
      console.error('Error saving exercise to database:', error);
      Alert.alert(
        'Save Error',
        'Failed to save exercise data to the server. Your progress will not be recorded.'
      );
    }
    
    // Navigate back to drawer navigator
    navigation.reset({
      index: 0,
      routes: [{ name: 'DrawerNavigator' }],
    });
  };
  
  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Process sensor data to calculate angle and momentum
  useEffect(() => {
    if (latestAcc) {
      // Get accelerometer data - don't use absolute values to preserve direction
      const x = latestAcc.x;
      const y = latestAcc.y;
      const z = latestAcc.z;
      
      // Calculate true angle between arm and vertical
      const rawAngle = Math.atan2(x, z) * (180 / Math.PI);
      
      // Apply calibration
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
      
      // Only process rep counting and warnings if calibration has been done
      if (hasCalibrated) {
        // Check for angle deviation warning
        const absAngle = Math.abs(calibratedAngle);
        if (absAngle > TARGET_ANGLE + ANGLE_DEVIATION_THRESHOLD) {
          if (!showAngleWarning) {
            setShowAngleWarning(true);
            setFeedback('Warning: Angle too high!');
            Vibration.vibrate(200);
            
            // Downgrade rep quality
            if (currentRepQualityRef.current === 'perfect') {
              currentRepQualityRef.current = 'good';
            } else if (currentRepQualityRef.current === 'good') {
              currentRepQualityRef.current = 'bad';
            }
          }
        } else if (absAngle < TARGET_ANGLE - ANGLE_DEVIATION_THRESHOLD && absAngle > REP_THRESHOLD) {
          if (!showAngleWarning) {
            setShowAngleWarning(true);
            setFeedback('Warning: Angle too low!');
            Vibration.vibrate(200);
            
            // Downgrade rep quality
            if (currentRepQualityRef.current === 'perfect') {
              currentRepQualityRef.current = 'good';
            } else if (currentRepQualityRef.current === 'good') {
              currentRepQualityRef.current = 'bad';
            }
          }
        } else {
          setShowAngleWarning(false);
        }
        
        // Check if exceeding velocity threshold
        const isExceeding = velocity > angularVelocityThreshold;
        if (isExceeding !== isExceedingVelocity) {
          setIsExceedingVelocity(isExceeding);
          if (isExceeding) {
            setShowVelocityWarning(true);
            setFeedback('Warning: Moving too fast!');
            Vibration.vibrate(200);
            
            // Downgrade rep quality
            if (currentRepQualityRef.current === 'perfect') {
              currentRepQualityRef.current = 'good';
            } else if (currentRepQualityRef.current === 'good') {
              currentRepQualityRef.current = 'bad';
            }
          } else {
            setShowVelocityWarning(false);
          }
        }
        
        // Update current angle display
        setCurrentAngle(calibratedAngle);
        
        // Modify rep counting to work with new angle calculation
        const absAngleValue = Math.abs(calibratedAngle);
        
        if (absAngleValue <= REP_ZERO_THRESHOLD && !hasReachedZero) {
          setHasReachedZero(true);
          setHasReached90(false);
          
          // Reset quality for next rep
          currentRepQualityRef.current = 'perfect'; 
        } else if (absAngleValue >= REP_COUNT_THRESHOLD && hasReachedZero && !hasReached90) {
          setHasReached90(true);
          
          // Increment completed reps counter
          setCompletedReps(prev => {
            const newCompletedReps = prev + 1;
            // Keep only essential log
            console.log(`Rep ${newCompletedReps}/${repCount} completed`);
            
            // Track rep quality
            if (currentRepQualityRef.current === 'perfect') {
              setPerfectReps(p => p + 1);
            } else if (currentRepQualityRef.current === 'good') {
              setGoodReps(g => g + 1);
            } else {
              setBadReps(b => b + 1);
            }
            
            // Increment total completed reps
            totalRepsCompletedRef.current += 1;
            
            // Check if set is complete
            if (newCompletedReps === repCount) {
              console.log(`Set ${completedSets + 1}/${setCount} completed`);
              
              // Increment completed sets
              setCompletedSets(prevSets => {
                const newCompletedSets = prevSets + 1;
                
                // Check if all sets are completed
                if (newCompletedSets === setCount) {
                  console.log('All sets completed');
                  handleExerciseComplete();
                } else {
                  // Start rest timer between sets - remove excessive logging
                  setTimeout(() => {
                    setShowRestModal(true);
                  }, 300);
                }
                
                return newCompletedSets;
              });
            }
            
            return newCompletedReps;
          });
          
          // Only show feedback if we're still in the exercise
          if (completedReps < repCount - 1 || completedSets < setCount - 1) {
            setFeedback('Rep counted!');
            // No vibration for successful rep as requested
            
            // Show the rep flash visual feedback
            setShowRepFlash(true);
            setTimeout(() => setShowRepFlash(false), 500);
          }
        } else if (absAngleValue > REP_ZERO_THRESHOLD && absAngleValue < REP_COUNT_THRESHOLD) {
          // In the middle zone - reset hasReached90 when lowering
          if (absAngleValue < 45 && hasReached90) {
            setHasReached90(false);
          }
        }
        
        // Modify original exercise tracking logic to work with the new angle calculation
        if (absAngleValue > REP_THRESHOLD && !repInProgressRef.current) {
          // Started a new rep
          repInProgressRef.current = true;
          setExerciseState('raising');
          maxAngleReachedRef.current = absAngleValue;
        } else if (absAngleValue > maxAngleReachedRef.current && repInProgressRef.current) {
          // Continuing to raise
          maxAngleReachedRef.current = absAngleValue;
          setExerciseState('raising');
        } else if (absAngleValue < maxAngleReachedRef.current - 15 && repInProgressRef.current) {
          // Started lowering
          setExerciseState('lowering');
        } else if (absAngleValue < REST_THRESHOLD && repInProgressRef.current) {
          // Completed a rep
          repInProgressRef.current = false;
          setExerciseState('rest');
          
          // Reset max angle
          maxAngleReachedRef.current = 0;
        }
      } else {
        // Just update current angle display for visual feedback before calibration
        setCurrentAngle(calibratedAngle);
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
  }, [latestAcc, latestGyro, calibrationOffset, hasCalibrated]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Exercise In Progress</Text>
        {!isConnected && <Text style={styles.connectionError}>Device Disconnected</Text>}
      </View>
      
      {/* Timer and Set/Rep Display */}
      <View style={styles.progressContainer}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time</Text>
          <Text style={styles.timerValue}>{formatTime(exerciseTime)}</Text>
        </View>
        
        <View style={styles.progressDetails}>
          <View style={styles.setContainer}>
            <Text style={styles.setLabel}>SET</Text>
            <Text style={styles.setValue}>
              {completedSets + 1}/{setCount}
            </Text>
          </View>
          
          <View style={styles.repContainer}>
            <Text style={styles.repLabel}>REP</Text>
            <Text style={styles.repValue}>
              {completedReps}/{repCount}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.gaugesContainer}>
        <ExerciseAngleGauge 
          currentAngle={currentAngle} 
          thresholdAngle={TARGET_ANGLE} 
        />
        <ExerciseMomentumGauge 
          momentum={currentMomentum} 
          maxMomentum={MOMENTUM_THRESHOLD} 
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
      
      {/* Warnings */}
      {(showAngleWarning || showVelocityWarning) && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            {showAngleWarning 
              ? `Keep angle within ${TARGET_ANGLE}° ± ${ANGLE_DEVIATION_THRESHOLD}°` 
              : showVelocityWarning 
                ? 'Slow down your movement' 
                : ''}
          </Text>
        </View>
      )}
      
      <View style={styles.feedbackContainer}>
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
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            Alert.alert(
              'End Exercise',
              'Are you sure you want to end this exercise session?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'End', 
                  style: 'destructive',
                  onPress: () => navigation.reset({
                    index: 0,
                    routes: [{ name: 'DrawerNavigator' }],
                  })
                }
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>End Exercise</Text>
        </TouchableOpacity>
      </View>
      
      {/* Rest Timer Modal */}
      <RestTimerModal 
        visible={showRestModal} 
        duration={exerciseConfig.restTime}
        onComplete={handleRestComplete}
      />
      
      {/* Exercise Completion Modal */}
      <ExerciseCompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionClose}
        statistics={{
          totalSets: exerciseConfig.sets,
          totalReps: exerciseConfig.sets * exerciseConfig.reps,
          perfectReps: perfectReps,
          goodReps: goodReps,
          badReps: badReps,
          timeTaken: exerciseTime,
          accuracy: (perfectReps / (perfectReps + goodReps + badReps)) * 100 || 0
        }}
      />
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressDetails: {
    flexDirection: 'row',
  },
  setContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  setLabel: {
    fontSize: 12,
    color: '#666',
  },
  setValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  repContainer: {
    alignItems: 'center',
  },
  repLabel: {
    fontSize: 12,
    color: '#666',
  },
  repValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  gaugesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    height: 60, // Fixed height to prevent layout shifts
  },
  feedbackText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  warningText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
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