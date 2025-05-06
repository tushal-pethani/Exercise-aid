import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

const ExerciseCompletionModal = ({ 
  visible, 
  onClose,
  statistics = {
    totalSets: 0,
    totalReps: 0,
    perfectReps: 0,
    goodReps: 0,
    badReps: 0,
    timeTaken: 0,
    accuracy: 0
  } 
}) => {
  // Calculate rating based on accuracy
  const getRating = (accuracy) => {
    if (accuracy >= 95) return { label: 'Perfect!', color: '#4CAF50' };
    if (accuracy >= 85) return { label: 'Excellent', color: '#8BC34A' };
    if (accuracy >= 75) return { label: 'Great', color: '#CDDC39' };
    if (accuracy >= 65) return { label: 'Good', color: '#FFC107' };
    if (accuracy >= 50) return { label: 'Fair', color: '#FF9800' };
    return { label: 'Needs Improvement', color: '#F44336' };
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const rating = getRating(statistics.accuracy);
  
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.completedText}>Exercise Completed Successfully</Text>
            
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: rating.color }]}>
                {rating.label}
              </Text>
              <Text style={styles.accuracyText}>
                {statistics.accuracy.toFixed(1)}% Accuracy
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.totalSets}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.totalReps}</Text>
                  <Text style={styles.statLabel}>Reps</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatTime(statistics.timeTaken)}</Text>
                  <Text style={styles.statLabel}>Time</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceTitle}>Rep Performance</Text>
              
              <View style={styles.performanceBarContainer}>
                <View style={styles.performanceRow}>
                  <Text style={styles.performanceLabel}>Perfect</Text>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${statistics.perfectReps / statistics.totalReps * 100}%`,
                          backgroundColor: '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.performanceValue}>{statistics.perfectReps}</Text>
                </View>
                
                <View style={styles.performanceRow}>
                  <Text style={styles.performanceLabel}>Good</Text>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${statistics.goodReps / statistics.totalReps * 100}%`,
                          backgroundColor: '#FFC107'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.performanceValue}>{statistics.goodReps}</Text>
                </View>
                
                <View style={styles.performanceRow}>
                  <Text style={styles.performanceLabel}>Poor</Text>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${statistics.badReps / statistics.totalReps * 100}%`,
                          backgroundColor: '#F44336'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.performanceValue}>{statistics.badReps}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
              <Text style={styles.feedbackText}>
                {statistics.accuracy >= 80 
                  ? "Great work! You maintained excellent form throughout your workout."
                  : statistics.accuracy >= 60 
                    ? "Good effort! Focus on maintaining proper form and controlling your movements."
                    : "Keep practicing! Focus on slower movements and proper angles."
                }
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  scrollContent: {
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
  },
  congratsText: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  completedText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding * 1.5,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 1.5,
  },
  ratingText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  statsContainer: {
    width: '100%',
    marginBottom: SIZES.padding * 1.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    margin: 4,
  },
  statValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  performanceContainer: {
    width: '100%',
    marginBottom: SIZES.padding * 1.5,
  },
  performanceTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  performanceBarContainer: {
    width: '100%',
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    width: 60,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  performanceValue: {
    width: 30,
    fontSize: SIZES.small,
    color: COLORS.text,
    textAlign: 'right',
  },
  feedbackContainer: {
    width: '100%',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 1.5,
  },
  feedbackTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.padding,
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});

export default ExerciseCompletionModal; 