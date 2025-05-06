import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { fetchUserExercises, fetchExerciseStatistics, deleteExercise } from '../../utils/api';

const ExerciseHistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load exercise history and statistics
  const loadData = async () => {
    setLoading(true);
    try {
      const historyData = await fetchUserExercises();
      const statsData = await fetchExerciseStatistics();
      
      setHistory(historyData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading exercise history:', error);
      Alert.alert('Error', 'Failed to load exercise history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle delete entry
  const handleDeleteEntry = (id) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(id);
              loadData(); // Reload data after deletion
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise record');
            }
          }
        }
      ]
    );
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Render exercise history item
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEntry(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.historyContent}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.exerciseType}</Text>
          <Text style={styles.bodyPartText}>{item.bodyPart}</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.sets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(item.timeTaken)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue, 
              { color: getAccuracyColor(item.accuracy) }
            ]}>
              {item.accuracy.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Perfect</Text>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${item.perfectReps / item.totalReps * 100}%`,
                    backgroundColor: '#4CAF50'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressValue}>{item.perfectReps}</Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Good</Text>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${item.goodReps / item.totalReps * 100}%`,
                    backgroundColor: '#FFC107'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressValue}>{item.goodReps}</Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Poor</Text>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${item.badReps / item.totalReps * 100}%`,
                    backgroundColor: '#F44336'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressValue}>{item.badReps}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Get color based on accuracy percentage
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50';
    if (accuracy >= 70) return '#FFC107';
    return '#F44336';
  };

  // Render statistics section
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.sectionTitle}>Exercise Summary</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{statistics.totalSessions}</Text>
            <Text style={styles.statBoxLabel}>Sessions</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{formatTime(statistics.totalTime)}</Text>
            <Text style={styles.statBoxLabel}>Total Time</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={[
              styles.statBoxValue, 
              { color: getAccuracyColor(statistics.averageAccuracy) }
            ]}>
              {statistics.averageAccuracy.toFixed(1)}%
            </Text>
            <Text style={styles.statBoxLabel}>Avg. Accuracy</Text>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading exercise history...</Text>
      </View>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Exercise History</Text>
        <Text style={styles.emptyMessage}>
          Complete an exercise session to see your history and progress here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderStatistics}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
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
    backgroundColor: COLORS.background,
    padding: SIZES.padding * 2,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding * 2,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  emptyMessage: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  statisticsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statBox: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.paddingSmall,
    minWidth: '30%',
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statBoxLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
  },
  historyDate: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  historyContent: {
    padding: SIZES.padding,
  },
  exerciseInfo: {
    marginBottom: SIZES.paddingSmall,
  },
  exerciseName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bodyPartText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
  },
  statValue: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.xSmall,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginTop: SIZES.padding,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    width: 45,
    fontSize: SIZES.xSmall,
    color: COLORS.text,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    width: 30,
    fontSize: SIZES.xSmall,
    color: COLORS.text,
    textAlign: 'right',
  },
});

export default ExerciseHistoryTab; 