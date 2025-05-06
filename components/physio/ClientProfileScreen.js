import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import profileImage from '../../utils/profileImage';

// Use direct API_URL instead of importing from config
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

const ClientProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { clientId, clientData } = route.params;
  
  const [client, setClient] = useState(clientData || null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchClientData();
  }, [clientId, token, navigation]);
  
  const fetchClientData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching client data for ID: ${clientId}`);
      
      // Fetch client details
      const clientResponse = await axios.get(`${API_URL}/users/${clientId}`, {
        headers: { 'x-auth-token': token }
      });
      
      setClient(clientResponse.data);
      console.log('Client data fetched successfully:', clientResponse.data.username);
      
      try {
        // Fetch assignments for this client
        console.log(`Fetching assignments for client ID: ${clientId}`);
        const assignmentsResponse = await axios.get(`${API_URL}/assignments/client/${clientId}`, {
          headers: { 'x-auth-token': token }
        });
        
        console.log(`Got ${assignmentsResponse.data.length} assignments`);
        setAssignments(assignmentsResponse.data);
      } catch (assignmentError) {
        console.error('Error fetching assignments:', assignmentError.response?.data || assignmentError.message);
        Alert.alert(
          'Warning',
          'Could not load assignments. You can still view client details.',
          [{ text: 'OK' }]
        );
        // Don't set error state here, allow the screen to render with client data
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching client data:', error.response?.data || error.message);
      setError('Could not load client data. Please try again.');
      
      // If the client data came from route params, use that as fallback
      if (route.params.clientData) {
        console.log('Using client data from route params as fallback');
        setClient(route.params.clientData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateExercise = () => {
    navigation.navigate('AssignExercise', { 
      clientId: clientId,
      clientName: client?.username || 'Client'
    });
  };
  
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the deleted assignment from state
      setAssignments(assignments.filter(a => a._id !== assignmentId));
      
      Alert.alert('Success', 'Assignment deleted successfully');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      Alert.alert('Error', 'Failed to delete assignment');
    }
  };
  
  const renderAssignmentItem = ({ item }) => {
    // Function to get appropriate status color
    const getStatusColor = (status) => {
      switch(status) {
        case 'pending': return COLORS.warning;
        case 'accepted': return COLORS.info;
        case 'completed': return COLORS.success;
        case 'rejected': return COLORS.error;
        default: return COLORS.textSecondary;
      }
    };
    
    return (
      <View style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View>
            <Text style={styles.exerciseType}>{item.exerciseType} - {item.bodyPart}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Assignment',
                'Are you sure you want to delete this assignment?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', onPress: () => handleDeleteAssignment(item._id), style: 'destructive' }
                ]
              );
            }}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.assignmentDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Target Angle:</Text>
            <Text style={styles.detailValue}>{item.targetAngle}°</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sets:</Text>
            <Text style={styles.detailValue}>{item.sets}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reps:</Text>
            <Text style={styles.detailValue}>{item.reps}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rest Time:</Text>
            <Text style={styles.detailValue}>{item.restTime} sec</Text>
          </View>
        </View>
        
        {item.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}
        
        <Text style={styles.dateText}>
          Assigned on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  // If we still don't have client data after loading is complete, show error
  if (!client) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Client Profile</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchClientData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Client Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Client Profile Section */}
        <View style={styles.profileSection}>
          <Image source={profileImage} style={styles.profileImage} />
          
          <View style={styles.profileInfo}>
            <Text style={styles.clientName}>{client?.username || 'Client'}</Text>
            <Text style={styles.clientEmail}>{client?.email || 'No email'}</Text>
            <Text style={styles.clientDetail}>Age: {client?.age || 'N/A'}</Text>
            
            {client?.medicalConditions && client.medicalConditions.length > 0 ? (
              <View style={styles.conditionsContainer}>
                <Text style={styles.conditionsLabel}>Medical Conditions:</Text>
                <View style={styles.tagContainer}>
                  {client.medicalConditions.map((condition, index) => (
                    <View key={index} style={styles.conditionTag}>
                      <Text style={styles.conditionText}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.noConditions}>No medical conditions</Text>
            )}
          </View>
        </View>
        
        {/* Assigned Exercises Section */}
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Exercises</Text>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateExercise}
            >
              <Text style={styles.addButtonText}>+ Assign Exercise</Text>
            </TouchableOpacity>
          </View>
          
          {assignments.length > 0 ? (
            <FlatList
              data={assignments}
              renderItem={renderAssignmentItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises assigned yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateExercise}
              >
                <Text style={styles.createButtonText}>Create Assignment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    fontSize: SIZES.large,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  profileSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: SIZES.padding,
  },
  profileInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  conditionsContainer: {
    marginTop: 8,
  },
  conditionsLabel: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionTag: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  conditionText: {
    color: COLORS.white,
    fontSize: SIZES.small,
  },
  noConditions: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  exercisesSection: {
    marginTop: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  createButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  assignmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.paddingSmall,
  },
  exerciseType: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
    marginBottom: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.paddingSmall,
  },
  detailItem: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  notesContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.paddingSmall,
    marginBottom: SIZES.paddingSmall,
  },
  notesLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  dateText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ClientProfileScreen; 