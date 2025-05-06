import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useBluetooth } from '../context/BluetoothContext';

interface ExerciseConfigType {
  bodyPart: string;
  exercise: string;
  sets: number;
  reps: number;
  targetAngle: number;
  restTime: number;
}

interface ExerciseStartScreenProps {
  route: { 
    params: { 
      device?: Device;
      exerciseConfig?: ExerciseConfigType;
    } 
  };
  navigation: any;
}

// Map exercise IDs to exercise names
const exerciseNames: { [key: string]: string } = {
  lateral_raise: 'Lateral Raise',
  side_raise: 'Side Raise',
  front_raise: 'Front Raise',
  bicep_curl: 'Bicep Curl',
  hammer_curl: 'Hammer Curl',
  squat: 'Squat',
  calf_raise: 'Calf Raise',
  deadlift: 'Deadlift',
};

// Map body part IDs to placement instructions
const bodyPartInstructions: { [key: string]: string[] } = {
  shoulder: [
    'Place the device on your shoulder',
    'Stand with your feet shoulder-width apart',
    'Hold your arms by your sides',
    'Raise your arms to the sides until they reach target angle',
    'Lower your arms slowly with control',
  ],
  arm: [
    'Place the device on your forearm',
    'Stand with your feet shoulder-width apart',
    'Keep your elbows close to your body',
    'Curl your arms up to the target angle',
    'Lower your arms slowly with control',
  ],
  leg: [
    'Place the device on your thigh',
    'Stand with your feet shoulder-width apart',
    'Keep your back straight',
    'Bend your knees to the target angle',
    'Return to standing position with control',
  ],
  back: [
    'Place the device on your lower back',
    'Stand with your feet hip-width apart',
    'Bend at the hips with slight knee bend',
    'Lower until you reach target angle',
    'Return to standing position with a straight back',
  ],
};

const { width } = Dimensions.get('window');

const ExerciseStartScreen: React.FC<ExerciseStartScreenProps> = ({ 
  route,
  navigation
}) => {
  const { deviceInfo } = useBluetooth();
  const exerciseConfig = route.params?.exerciseConfig || {
    bodyPart: 'shoulder',
    exercise: 'lateral_raise',
    sets: 3,
    reps: 10,
    targetAngle: 90,
    restTime: 60
  };
  
  // Get the exercise name from the exercise ID
  const exerciseName = exerciseNames[exerciseConfig.exercise] || 'Custom Exercise';
  
  // Get instructions for the selected body part
  const instructions = bodyPartInstructions[exerciseConfig.bodyPart] || [
    'Place the device appropriately',
    'Stand with proper form',
    'Perform the movement with control',
    'Maintain good posture throughout',
    'Complete the full range of motion',
  ];
  
  const handleStartExercise = () => {
    navigation.navigate('Exercise', { exerciseConfig });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{exerciseName}</Text>
          <Text style={styles.subtitle}>
            Connected to: {deviceInfo?.name || 'No device connected'}
          </Text>
        </View>
        
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Instructions:</Text>
            {instructions.map((instruction, index) => (
              <Text key={index} style={styles.instructionText}>
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>
        </View>
        
        
        <View style={styles.thresholdInfoContainer}>
          <Text style={styles.thresholdTitle}>Exercise Parameters:</Text>
          <Text style={styles.thresholdText}>• Sets: {exerciseConfig.sets}</Text>
          <Text style={styles.thresholdText}>• Reps per set: {exerciseConfig.reps}</Text>
          <Text style={styles.thresholdText}>• Target angle: {exerciseConfig.targetAngle} degrees</Text>
          <Text style={styles.thresholdText}>• Rest time: {exerciseConfig.restTime} seconds</Text>
          <Text style={styles.thresholdText}>• Complete exercise with full range of motion</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartExercise}
        >
          <Text style={styles.startButtonText}>Start Exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at the bottom to ensure button is visible
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBBBBB',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#DDDDDD',
    marginBottom: 8,
    lineHeight: 22,
  },
  devicePlacementContainer: {
    marginBottom: 20,
  },
  placementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  placementImageContainer: {
    height: 120,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoulderIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoulderText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 14,
    padding: 5,
  },
  thresholdInfoContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  thresholdTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  thresholdText: {
    fontSize: 16,
    color: '#DDDDDD',
    marginBottom: 6,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30, // Add bottom margin to ensure visibility
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ExerciseStartScreen; 