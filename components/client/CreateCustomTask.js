import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useBluetooth } from '../../context/BluetoothContext';

// Body part data with their respective exercises
const bodyPartsData = [
  {
    id: 'shoulder',
    name: 'Shoulder',
    icon: '🦾',
    exercises: [
      { id: 'lateral_raise', name: 'Lateral Raise' },
      { id: 'side_raise', name: 'Side Raise' },
      { id: 'front_raise', name: 'Front Raise' },
    ],
  },
  {
    id: 'arm',
    name: 'Arm',
    icon: '💪',
    exercises: [
      { id: 'bicep_curl', name: 'Bicep Curl' },
      { id: 'hammer_curl', name: 'Hammer Curl' },
    ],
  },
  {
    id: 'leg',
    name: 'Leg',
    icon: '🦵',
    exercises: [
      { id: 'squat', name: 'Squat' },
      { id: 'calf_raise', name: 'Calf Raise' },
    ],
  },
  {
    id: 'back',
    name: 'Back',
    icon: '🔙',
    exercises: [
      { id: 'deadlift', name: 'Deadlift' },
    ],
  },
];

const CreateCustomTask = () => {
  const navigation = useNavigation();
  const { isConnected } = useBluetooth();
  
  // State variables for multi-step form
  const [step, setStep] = useState(1);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [targetAngle, setTargetAngle] = useState('90');
  const [restTime, setRestTime] = useState('60');
  
  // Get available exercises based on selected body part
  const availableExercises = selectedBodyPart 
    ? bodyPartsData.find(bp => bp.id === selectedBodyPart)?.exercises || []
    : [];
  
  // Handle body part selection
  const handleSelectBodyPart = (bodyPartId) => {
    setSelectedBodyPart(bodyPartId);
    setSelectedExercise(null); // Reset exercise selection
    setStep(2);
  };
  
  // Handle exercise selection
  const handleSelectExercise = (exerciseId) => {
    setSelectedExercise(exerciseId);
    setStep(3);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate input
    if (!sets || !reps || !targetAngle || !restTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Parse values to numbers
    const exerciseConfig = {
      bodyPart: selectedBodyPart,
      exercise: selectedExercise,
      sets: parseInt(sets),
      reps: parseInt(reps),
      targetAngle: parseInt(targetAngle),
      restTime: parseInt(restTime),
    };
    
    // Check if device is already connected
    if (isConnected) {
      // If already connected, go directly to ExerciseStart screen
      navigation.navigate('ExerciseStack', {
        screen: 'ExerciseStart',
        params: { exerciseConfig }
      });
    } else {
      // If not connected, navigate to DeviceScan screen first
      navigation.navigate('ExerciseStack', {
        screen: 'DeviceScan',
        params: { exerciseConfig }
      });
    }
  };
  
  // Render body part selection
  const renderBodyPartSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Body Part</Text>
      <Text style={styles.stepDescription}>Choose which body part you want to exercise</Text>
      
      <View style={styles.optionsGrid}>
        {bodyPartsData.map((bodyPart) => (
          <TouchableOpacity
            key={bodyPart.id}
            style={[
              styles.bodyPartOption,
              selectedBodyPart === bodyPart.id && styles.selectedOption
            ]}
            onPress={() => handleSelectBodyPart(bodyPart.id)}
          >
            <Text style={styles.bodyPartIcon}>{bodyPart.icon}</Text>
            <Text style={styles.bodyPartName}>{bodyPart.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  // Render exercise selection
  const renderExerciseSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Exercise</Text>
      <Text style={styles.stepDescription}>
        Choose an exercise for {bodyPartsData.find(bp => bp.id === selectedBodyPart)?.name}
      </Text>
      
      <View style={styles.exercisesList}>
        {availableExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseOption,
              selectedExercise === exercise.id && styles.selectedExerciseOption
            ]}
            onPress={() => handleSelectExercise(exercise.id)}
          >
            <Text style={[
              styles.exerciseName,
              selectedExercise === exercise.id && styles.selectedExerciseName
            ]}>
              {exercise.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
      >
        <Text style={styles.backButtonText}>← Back to Body Parts</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render task configuration
  const renderTaskConfig = () => {
    const selectedExerciseData = availableExercises.find(ex => ex.id === selectedExercise);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Exercise Configuration</Text>
        <Text style={styles.stepDescription}>
          Customize your {selectedExerciseData?.name} exercise
        </Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
                placeholder="3"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reps per Set</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="10"
              />
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Target Angle (degrees)</Text>
              <TextInput
                style={styles.input}
                value={targetAngle}
                onChangeText={setTargetAngle}
                keyboardType="number-pad"
                placeholder="90"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Rest Time (seconds)</Text>
              <TextInput
                style={styles.input}
                value={restTime}
                onChangeText={setRestTime}
                keyboardType="number-pad"
                placeholder="60"
              />
            </View>
          </View>
          
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Exercise Warnings</Text>
            <Text style={styles.warningText}>
              • You will receive a warning if your angle deviates by more than 10° from target
            </Text>
            <Text style={styles.warningText}>
              • You will receive a warning if your movement velocity exceeds 30°/s
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(2)}
          >
            <Text style={styles.backButtonText}>← Back to Exercises</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleSubmit}
          >
            <Text style={styles.startButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Custom Task</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.activeStep]} />
        <View style={styles.progressLine} />
        <View style={[styles.progressStep, step >= 2 && styles.activeStep]} />
        <View style={styles.progressLine} />
        <View style={[styles.progressStep, step >= 3 && styles.activeStep]} />
      </View>
      
      {step === 1 && renderBodyPartSelection()}
      {step === 2 && renderExerciseSelection()}
      {step === 3 && renderTaskConfig()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SIZES.padding * 3,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
  },
  progressStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  activeStep: {
    backgroundColor: COLORS.secondary,
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 5,
    maxWidth: 60,
  },
  stepContainer: {
    padding: SIZES.padding,
  },
  stepTitle: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  stepDescription: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bodyPartOption: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(50, 173, 94, 0.1)',
  },
  bodyPartIcon: {
    fontSize: 40,
    marginBottom: SIZES.paddingSmall,
  },
  bodyPartName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  exercisesList: {
    marginBottom: SIZES.padding,
  },
  exerciseOption: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  selectedExerciseOption: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    backgroundColor: 'rgba(50, 173, 94, 0.1)',
  },
  exerciseName: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
  },
  selectedExerciseName: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SIZES.paddingSmall,
  },
  backButtonText: {
    color: COLORS.secondary,
    fontSize: SIZES.medium,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  inputContainer: {
    width: '48%',
  },
  inputLabel: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  warningTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    ...SHADOWS.small,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});

export default CreateCustomTask; 