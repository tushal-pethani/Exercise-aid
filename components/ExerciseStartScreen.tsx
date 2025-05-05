import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Device } from 'react-native-ble-plx';

interface ExerciseStartScreenProps {
  route: { params: { device: Device } };
  navigation: any;
}

const { width } = Dimensions.get('window');

const ExerciseStartScreen: React.FC<ExerciseStartScreenProps> = ({ 
  route,
  navigation
}) => {
  const { device } = route.params;
  
  const handleStartExercise = () => {
    navigation.navigate('Exercise', { device });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lateral Raise Exercise</Text>
        <Text style={styles.subtitle}>Connected to: {device.name || 'Unknown Device'}</Text>
      </View>
      
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>1. Place the device on your shoulder</Text>
          <Text style={styles.instructionText}>2. Stand with your feet shoulder-width apart</Text>
          <Text style={styles.instructionText}>3. Hold your arms by your sides</Text>
          <Text style={styles.instructionText}>4. Raise your arms to the sides until they're parallel to the floor</Text>
          <Text style={styles.instructionText}>5. Aim for a 100° angle at the top</Text>
          <Text style={styles.instructionText}>6. Lower your arms slowly with control</Text>
        </View>
      </View>
      
      <View style={styles.devicePlacementContainer}>
        <Text style={styles.placementTitle}>Device Placement:</Text>
        <View style={styles.placementImageContainer}>
          <View style={styles.shoulderIndicator}>
            <Text style={styles.shoulderText}>Place device here</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.thresholdInfoContainer}>
        <Text style={styles.thresholdTitle}>Exercise Parameters:</Text>
        <Text style={styles.thresholdText}>• Target angle: 100 degrees</Text>
        <Text style={styles.thresholdText}>• Control momentum for best results</Text>
        <Text style={styles.thresholdText}>• Complete exercise with full range of motion</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartExercise}
      >
        <Text style={styles.startButtonText}>Start Exercise</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
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
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ExerciseStartScreen; 