import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Exercise images mapping
const exerciseImages = {
  shoulder: require('../../assets/images/lateral_raise.jpg'),
  biceps: require('../../assets/images/bicep_curl.jpg'),
  legs: require('../../assets/images/squat.jpg'),
  custom: require('../../assets/images/exercise_banner.jpg')
};

// API URL
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

const AssignedExercises = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [error, setError] = useState(null);
  
  // Fetch assignments when component mounts
  useEffect(() => {
    fetchAssignments();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchAssignments);
    return unsubscribe;
  }, [navigation]);
  
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching assignments for client');
      const response = await axios.get(`${API_URL}/assignments`, {
        headers: { 'x-auth-token': token }
      });
      
      console.log(`Found ${response.data.length} assignments`);
      
      // Transform the API data to match our UI format
      const formattedExercises = response.data.map(assignment => ({
        id: assignment._id,
        name: `${assignment.exerciseType.charAt(0).toUpperCase() + assignment.exerciseType.slice(1)} Exercise`,
        bodyPart: assignment.bodyPart,
        assignedBy: assignment.physioId?.username || 'Your Physiotherapist',
        date: new Date(assignment.createdAt).toLocaleDateString(),
        sets: assignment.sets,
        reps: assignment.reps,
        targetAngle: assignment.targetAngle,
        restTime: assignment.restTime,
        completed: assignment.status === 'completed',
        status: assignment.status,
        notes: assignment.notes || '',
        image: exerciseImages[assignment.exerciseType] || exerciseImages.custom
      }));
      
      setExercises(formattedExercises);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load your exercises. Please try again.');
      Alert.alert('Error', 'Failed to load your exercises. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };
  
  // Mark an exercise as completed
  const markAsCompleted = async (assignmentId) => {
    try {
      setLoading(true);
      
      console.log(`Marking assignment ${assignmentId} as completed`);
      const response = await axios.patch(
        `${API_URL}/assignments/${assignmentId}`,
        { status: 'completed' },
        { headers: { 'x-auth-token': token } }
      );
      
      console.log('Assignment marked as completed:', response.data);
      
      // Update the local state to show completion
      setExercises(prevExercises => 
        prevExercises.map(exercise => 
          exercise.id === assignmentId 
            ? { ...exercise, completed: true, status: 'completed' } 
            : exercise
        )
      );
      
      Alert.alert('Success', 'Exercise marked as completed!');
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
      Alert.alert('Error', 'Failed to update exercise status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter exercises based on selected filter
  const filteredExercises = exercises.filter(exercise => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !exercise.completed;
    if (filter === 'completed') return exercise.completed;
    return true;
  });
  
  const handleStartExercise = (exercise) => {
    // Navigate to exercise screen with configuration
    navigation.navigate('ExerciseStack', {
      screen: 'DeviceScan',
      params: {
        exerciseConfig: {
          bodyPart: exercise.bodyPart,
          exercise: exercise.name.toLowerCase().replace(/\s+/g, '_'),
          sets: exercise.sets,
          reps: exercise.reps,
          targetAngle: exercise.targetAngle,
          restTime: exercise.restTime,
          assignmentId: exercise.id, // Use the assignment ID to update status after completion
        },
        fromAssignedTask: true,
      },
    });
  };
  
  const getStatusBadge = (status) => {
    let color;
    let text;
    
    switch(status) {
      case 'completed':
        color = COLORS.success;
        text = 'Completed';
        break;
      case 'accepted':
        color = COLORS.info;
        text = 'Accepted';
        break;
      case 'rejected':
        color = COLORS.error;
        text = 'Rejected';
        break;
      case 'pending':
      default:
        color = COLORS.warning;
        text = 'Pending';
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };
  
  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseAssignedBy}>Assigned by: {item.assignedBy}</Text>
          <Text style={styles.exerciseDate}>Assigned on: {item.date}</Text>
          
          {item.notes ? (
            <Text style={styles.exerciseNotes}>Notes: {item.notes}</Text>
          ) : null}
        </View>
        
        {getStatusBadge(item.status)}
      </View>
      
      <View style={styles.exerciseImageContainer}>
        <Image 
          source={item.image} 
          style={styles.exerciseImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.exerciseDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{item.sets}</Text>
          <Text style={styles.detailLabel}>Sets</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{item.reps}</Text>
          <Text style={styles.detailLabel}>Reps</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{item.targetAngle}°</Text>
          <Text style={styles.detailLabel}>Target Angle</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{item.restTime}s</Text>
          <Text style={styles.detailLabel}>Rest Time</Text>
        </View>
      </View>
      
      {!item.completed ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => handleStartExercise(item)}
          >
            <Text style={styles.startButtonText}>Start Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => {
              Alert.alert(
                'Confirm Completion',
                'Have you completed this exercise? This will mark it as done.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Yes, Mark Complete', onPress: () => markAsCompleted(item.id) }
                ]
              );
            }}
          >
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>✓ Completed</Text>
        </View>
      )}
    </View>
  );
  
  const FilterButton = ({ title, filterValue }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterValue && styles.activeFilterButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Exercises</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <FilterButton title="All Exercises" filterValue="all" />
        <FilterButton title="Pending" filterValue="pending" />
        <FilterButton title="Completed" filterValue="completed" />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAssignments}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredExercises.length > 0 ? (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.secondary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No exercises found</Text>
          <Text style={styles.emptyDescription}>
            {filter === 'all' 
              ? 'You don\'t have any assigned exercises yet.'
              : filter === 'pending'
                ? 'You don\'t have any pending exercises.'
                : 'You haven\'t completed any exercises yet.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SIZES.paddingSmall,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterButton: {
    borderBottomColor: COLORS.secondary,
  },
  filterButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
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
    padding: SIZES.padding,
  },
  errorText: {
    fontSize: SIZES.medium,
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
  listContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  exerciseCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  exerciseHeader: {
    padding: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseAssignedBy: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  exerciseDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  exerciseNotes: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.xSmall,
    fontWeight: 'bold',
  },
  exerciseImageContainer: {
    height: 150,
    width: '100%',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseDetails: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    padding: SIZES.padding,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  completedContainer: {
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.paddingSmall,
    alignItems: 'center',
  },
  completedText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  emptyDescription: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default AssignedExercises; 