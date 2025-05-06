import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

const RestTimerModal = ({ visible, duration, onComplete }) => {
  // Timer state
  const [seconds, setSeconds] = useState(duration);
  const intervalRef = useRef(null);
  const timerStartedRef = useRef(false);
  
  // Format time in MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Simplified logging function
  const log = (message) => {
    // Keep only essential logs
    if (message.includes('Starting new timer') || 
        message.includes('Timer reached zero') ||
        message.includes('Skip button pressed')) {
      console.log(`Timer: ${message}`);
    }
  };
  
  // Start a new timer
  const startTimer = () => {
    log('Starting new timer');
    
    // Clear any existing timer
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set up new timer
    timerStartedRef.current = true;
    intervalRef.current = setInterval(() => {
      setSeconds(prevSeconds => {
        const newValue = prevSeconds - 1;
        
        if (newValue <= 0) {
          log('Timer reached zero, cleaning up');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          timerStartedRef.current = false;
          
          // Delay the callback to ensure UI updates
          setTimeout(() => {
            onComplete();
          }, 100);
          
          return 0;
        }
        
        return newValue;
      });
    }, 1000);
  };
  
  // Clear timer
  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      timerStartedRef.current = false;
    }
  };
  
  // Effect for modal visibility changes
  useEffect(() => {
    if (visible) {
      // Reset timer when modal becomes visible
      setSeconds(duration);
      
      // Start timer with a short delay to ensure state is set
      setTimeout(() => {
        startTimer();
      }, 100);
    } else {
      // Clean up when modal is hidden
      clearTimer();
    }
    
    // Clean up on unmount
    return () => {
      clearTimer();
    };
  }, [visible, duration]);
  
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.titleText}>Rest Time</Text>
          
          <View style={styles.timerContainer}>
            <View style={styles.progressRing}>
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
              {seconds > 0 && <ActivityIndicator size="small" color={COLORS.secondary} />}
            </View>
          </View>
          
          <Text style={styles.infoText}>
            <Text style={styles.secondsText}>{seconds}</Text> seconds remaining
            {'\n'}
            Rest before starting the next set
          </Text>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => {
              log('Skip button pressed');
              clearTimer();
              onComplete();
            }}
          >
            <Text style={styles.skipButtonText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  titleText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  timerContainer: {
    marginVertical: SIZES.padding,
    alignItems: 'center',
  },
  progressRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SIZES.padding,
  },
  secondsText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  skipButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.padding,
  },
  skipButtonText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: SIZES.medium,
  },
});

export default RestTimerModal; 