import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

/**
 * CustomSlider component with improved UI to prevent text and icon overlap
 * 
 * @param {Object} props - Component props
 * @param {number} props.value - Current value
 * @param {Function} props.onValueChange - Callback when value changes
 * @param {number} props.minimumValue - Minimum possible value
 * @param {number} props.maximumValue - Maximum possible value
 * @param {string} props.minimumLabel - Label for minimum value
 * @param {string} props.maximumLabel - Label for maximum value
 * @param {number} props.step - Step size for value changes
 * @param {string} props.label - Main slider label
 * @param {string} props.unit - Unit to display after value
 */
const CustomSlider = ({
  value = 0,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  minimumLabel = 'Min',
  maximumLabel = 'Max',
  step = 1,
  label = 'Value',
  unit = '',
}) => {
  // Track animation value for the slider
  const animation = new Animated.Value(
    ((value - minimumValue) / (maximumValue - minimumValue)) * 100
  );
  
  // Set up pan responder for touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gestureState) => {
      // Calculate new value based on drag position
      let newWidth = gestureState.moveX - 20; // 20 is the padding
      if (newWidth < 0) newWidth = 0;
      
      // Get track width (approximated to screen width - 80px for padding)
      const trackWidth = SIZES.width - 80;
      if (newWidth > trackWidth) newWidth = trackWidth;
      
      // Calculate percentage and update animation
      const percentage = (newWidth / trackWidth) * 100;
      animation.setValue(percentage);
      
      // Calculate and report the actual value based on percentage
      const newValue = minimumValue + Math.round((percentage / 100) * (maximumValue - minimumValue) / step) * step;
      onValueChange && onValueChange(newValue);
    },
    onPanResponderRelease: () => {},
  });
  
  // Calculate width percentage for progress
  const widthPercentage = animation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={styles.container}>
      {/* Slider Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>{value}{unit}</Text>
      </View>
      
      {/* Slider Track */}
      <View style={styles.trackContainer}>
        <View style={styles.track} {...panResponder.panHandlers}>
          <Animated.View 
            style={[styles.progress, { width: widthPercentage }]}
          />
          <Animated.View 
            style={[
              styles.thumb,
              { left: widthPercentage }
            ]}
          />
        </View>
      </View>
      
      {/* Min/Max Labels */}
      <View style={styles.labelsContainer}>
        <Text style={styles.minMaxLabel}>{minimumLabel}</Text>
        <Text style={styles.minMaxLabel}>{maximumLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  valueText: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    position: 'relative',
  },
  progress: {
    height: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    position: 'absolute',
    top: -9,
    marginLeft: -12,
    ...SHADOWS.small,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  minMaxLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
});

export default CustomSlider; 