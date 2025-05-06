import React, { useState, useEffect } from 'react';
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
  Platform,
  Switch,
  FlatList,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import profileImage from '../../utils/profileImage';

// Use direct API_URL instead of importing from config
const API_URL = process.env.API_URL|| 'http://172.20.10.5:3000/api';

// Exercise types and body parts
const EXERCISE_TYPES = [
  { value: 'legs', label: 'Legs' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'custom', label: 'Custom' }
];

const CreateExercise = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  
  // Form state
  const [exerciseType, setExerciseType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [targetAngle, setTargetAngle] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [restTime, setRestTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Client selection state
  const [sendToAll, setSendToAll] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);
  
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      // Get all connections for the current user
      const response = await axios.get(`${API_URL}/users/connections`, {
        headers: { 'x-auth-token': token }
      });
      
      // Filter connections to only show clients
      const clientConnections = response.data.filter(connection => 
        ['client', 'Client', 'CLIENT', 'patient'].includes(connection.role)
      );
      
      setClients(clientConnections);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load your clients');
    } finally {
      setLoadingClients(false);
    }
  };
  
  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => {
      // If client is already selected, remove them
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      }
      // Otherwise add them
      return [...prev, clientId];
    });
  };
  
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
    
    // Validate client selection if not sending to all
    if (!sendToAll && selectedClients.length === 0) {
      newErrors.clients = 'Please select at least one client';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Prepare the list of clients to send to
    const clientsToProcess = sendToAll ? clients.map(c => c._id) : selectedClients;
    
    // Base exercise data
    const exerciseData = {
      exerciseType,
      bodyPart,
      targetAngle: parseInt(targetAngle),
      sets: parseInt(sets),
      reps: parseInt(reps),
      restTime: parseInt(restTime),
      notes
    };
    
    try {
      const successfulAssignments = [];
      const failedAssignments = [];
      
      // Process each client
      for (const clientId of clientsToProcess) {
        try {
          // Create assignment for this client
          const response = await axios.post(
            `${API_URL}/assignments`,
            {
              ...exerciseData,
              clientId
            },
            { 
              headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          successfulAssignments.push(clientId);
        } catch (error) {
          console.error(`Error assigning exercise to client ${clientId}:`, error);
          failedAssignments.push(clientId);
        }
      }
      
      // Show results
      if (successfulAssignments.length > 0) {
        const message = sendToAll
          ? `Exercise assigned to all ${successfulAssignments.length} clients`
          : `Exercise assigned to ${successfulAssignments.length} clients`;
          
        Alert.alert(
          'Success',
          failedAssignments.length > 0
            ? `${message}. Failed to assign to ${failedAssignments.length} clients.`
            : message,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to assign exercise to any clients. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      Alert.alert(
        'Error',
        'An error occurred while assigning exercises. Please try again.',
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
  
  const renderClientItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.clientItem,
        selectedClients.includes(item._id) && styles.selectedClientItem
      ]}
      onPress={() => toggleClientSelection(item._id)}
    >
      <Image 
        source={profileImage} 
        style={styles.clientImage}
      />
      
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.username}</Text>
        {item.medicalConditions && item.medicalConditions.length > 0 && (
          <Text style={styles.clientDetail}>
            {item.medicalConditions.join(', ')}
          </Text>
        )}
      </View>
      
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          selectedClients.includes(item._id) && styles.checkboxSelected
        ]}>
          {selectedClients.includes(item._id) && (
            <Text style={styles.checkMark}>✓</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Exercise</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
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
          
          <View style={styles.section}>
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
                <Text style={styles.label}>Reps *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                {renderError('reps')}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rest Time (seconds) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 30"
                value={restTime}
                onChangeText={setRestTime}
                keyboardType="number-pad"
                maxLength={3}
              />
              {renderError('restTime')}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any additional instructions or notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign To</Text>
            
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Send to all clients</Text>
              <Switch
                value={sendToAll}
                onValueChange={setSendToAll}
                trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                thumbColor={sendToAll ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            
            {!sendToAll && (
              <View style={styles.clientsContainer}>
                <Text style={styles.label}>Select Clients *</Text>
                {loadingClients ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : clients.length > 0 ? (
                  <>
                    <FlatList
                      data={clients}
                      renderItem={renderClientItem}
                      keyExtractor={item => item._id}
                      scrollEnabled={false}
                      style={styles.clientsList}
                    />
                    {renderError('clients')}
                  </>
                ) : (
                  <Text style={styles.noClientsText}>No clients found. Add clients first.</Text>
                )}
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {sendToAll ? 'Assign to All Clients' : 'Assign to Selected Clients'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: SIZES.padding * 2.5,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: SIZES.padding,
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: SIZES.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  section: {
    marginBottom: SIZES.padding * 1.5,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  formGroup: {
    marginBottom: SIZES.padding,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 10,
    fontSize: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
    marginRight: SIZES.paddingSmall,
    marginBottom: SIZES.paddingSmall,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightGray,
  },
  selectedOptionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: COLORS.white,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  toggleLabel: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
  },
  clientsContainer: {
    marginTop: SIZES.paddingSmall,
  },
  clientsList: {
    marginTop: 8,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedClientItem: {
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
  },
  clientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.paddingSmall,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
  },
  clientDetail: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  checkboxContainer: {
    marginLeft: SIZES.paddingSmall,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkMark: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding,
    ...SHADOWS.small,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.small,
    marginTop: 4,
  },
  loader: {
    padding: SIZES.padding,
  },
  noClientsText: {
    textAlign: 'center',
    padding: SIZES.padding,
    color: COLORS.textSecondary,
  },
});

export default CreateExercise; 