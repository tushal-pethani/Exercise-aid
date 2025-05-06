import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Use direct API_URL instead of importing from config
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

// Exercise types and body parts
const EXERCISE_TYPES = [
  { value: 'legs', label: 'Legs' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'custom', label: 'Custom' }
];

const AssignExerciseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { clientId, clientName } = route.params;
  
  // Form state
  const [exerciseType, setExerciseType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [targetAngle, setTargetAngle] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [restTime, setRestTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!exerciseType) newErrors.exerciseType = 'Please select an exercise type';
    if (!bodyPart) newErrors.bodyPart = 'Please enter the body part';
    
    // Validate target angle (numerical, 1-180)
    if (!targetAngle) {
      newErrors.targetAngle = 'Please enter a target angle';
    } else {
      const angle = parseInt(targetAngle);
      if (isNaN(angle) || angle < 1 || angle > 180) {
        newErrors.targetAngle = 'Angle must be between 1 and 180 degrees';
      }
    }
    
    // Validate sets (numerical, at least 1)
    if (!sets) {
      newErrors.sets = 'Please enter the number of sets';
    } else {
      const setsNum = parseInt(sets);
      if (isNaN(setsNum) || setsNum < 1) {
        newErrors.sets = 'Sets must be at least 1';
      }
    }
    
    // Validate reps (numerical, at least 1)
    if (!reps) {
      newErrors.reps = 'Please enter the number of reps';
    } else {
      const repsNum = parseInt(reps);
      if (isNaN(repsNum) || repsNum < 1) {
        newErrors.reps = 'Reps must be at least 1';
      }
    }
    
    // Validate rest time (numerical, at least 5 seconds)
    if (!restTime) {
      newErrors.restTime = 'Please enter the rest time';
    } else {
      const restTimeNum = parseInt(restTime);
      if (isNaN(restTimeNum) || restTimeNum < 5) {
        newErrors.restTime = 'Rest time must be at least 5 seconds';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      console.log('Submitting assignment for client:', clientId);
      console.log('Assignment data:', {
        clientId,
        exerciseType,
        bodyPart,
        targetAngle: parseInt(targetAngle),
        sets: parseInt(sets),
        reps: parseInt(reps),
        restTime: parseInt(restTime),
        notes
      });
      
      const response = await axios.post(
        `${API_URL}/assignments`,
        {
          clientId,
          exerciseType,
          bodyPart,
          targetAngle: parseInt(targetAngle),
          sets: parseInt(sets),
          reps: parseInt(reps),
          restTime: parseInt(restTime),
          notes
        },
        { 
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Assignment created successfully:', response.data);
      
      Alert.alert(
        'Success',
        'Exercise assigned successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error assigning exercise:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to assign exercise';
      
      // Try to extract a more specific error message if available
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Format validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = 'Validation errors:\n' + Object.entries(validationErrors)
          .map(([field, message]) => `- ${field}: ${message}`)
          .join('\n');
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Render an error message if there is one for the given field
  const renderError = (field) => {
    if (errors[field]) {
      return <Text style={styles.errorText}>{errors[field]}</Text>;
    }
    return null;
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assign Exercise</Text>
          <Text style={styles.headerSubtitle}>Client: {clientName}</Text>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Exercise Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Exercise Type *</Text>
            <View style={styles.optionsContainer}>
              {EXERCISE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionButton,
                    exerciseType === type.value && styles.selectedOptionButton
                  ]}
                  onPress={() => setExerciseType(type.value)}
                >
                  <Text 
                    style={[
                      styles.optionButtonText,
                      exerciseType === type.value && styles.selectedOptionButtonText
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderError('exerciseType')}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Body Part *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Left arm, Right knee"
              value={bodyPart}
              onChangeText={setBodyPart}
            />
            {renderError('bodyPart')}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Angle (degrees) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter angle (1-180)"
              value={targetAngle}
              onChangeText={setTargetAngle}
              keyboardType="number-pad"
              maxLength={3}
            />
            {renderError('targetAngle')}
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Exercise Parameters</Text>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Sets *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
                maxLength={2}
              />
              {renderError('sets')}
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Reps per Set *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                maxLength={3}
              />
              {renderError('reps')}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Rest Time Between Sets (seconds) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. a minimum of 5 seconds"
              value={restTime}
              onChangeText={setRestTime}
              keyboardType="number-pad"
              maxLength={3}
            />
            {renderError('restTime')}
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.formGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional instructions or notes for the client"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Assign Exercise</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SIZES.medium,
  },
  header: {
    marginBottom: SIZES.large,
  },
  headerTitle: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.xSmall,
  },
  headerSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SIZES.medium,
  },
  formGroup: {
    marginBottom: SIZES.medium,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: SIZES.xSmall,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.xSmall,
    padding: SIZES.small,
    fontSize: SIZES.medium,
    color: COLORS.black,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.xSmall,
  },
  optionButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.xSmall,
    paddingVertical: SIZES.xSmall,
    paddingHorizontal: SIZES.small,
    marginRight: SIZES.small,
    marginBottom: SIZES.xSmall,
  },
  selectedOptionButton: {
    backgroundColor: COLORS.primary,
  },
  optionButtonText: {
    color: COLORS.gray,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: COLORS.white,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.xSmall,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.small,
    paddingVertical: SIZES.medium,
    alignItems: 'center',
    marginTop: SIZES.medium,
    marginBottom: SIZES.xLarge,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
});

export default AssignExerciseScreen; 