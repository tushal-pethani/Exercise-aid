import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomSlider from './CustomSlider';
import { COLORS, SIZES } from '../../utils/theme';

/**
 * Example component showing how to use the CustomSlider
 * Use this as a reference for implementing sliders throughout the app
 */
const SliderExample = () => {
  // Example state values for sliders
  const [angleValue, setAngleValue] = useState(90);
  const [repsValue, setRepsValue] = useState(10);
  const [restTimeValue, setRestTimeValue] = useState(60);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Slider Examples</Text>
      
      {/* Angle Slider */}
      <CustomSlider 
        label="Target Angle"
        value={angleValue}
        onValueChange={setAngleValue}
        minimumValue={0}
        maximumValue={180}
        minimumLabel="0°"
        maximumLabel="180°"
        step={5}
        unit="°"
      />
      
      {/* Reps Slider */}
      <CustomSlider 
        label="Repetitions"
        value={repsValue}
        onValueChange={setRepsValue}
        minimumValue={1}
        maximumValue={20}
        minimumLabel="Low"
        maximumLabel="High"
        step={1}
      />
      
      {/* Rest Time Slider */}
      <CustomSlider 
        label="Rest Time"
        value={restTimeValue}
        onValueChange={setRestTimeValue}
        minimumValue={15}
        maximumValue={120}
        minimumLabel="Short"
        maximumLabel="Long"
        step={5}
        unit="s"
      />
      
      {/* Display selected values */}
      <View style={styles.valuesContainer}>
        <Text style={styles.valuesTitle}>Selected Values:</Text>
        <Text style={styles.valueText}>Target Angle: {angleValue}°</Text>
        <Text style={styles.valueText}>Repetitions: {repsValue}</Text>
        <Text style={styles.valueText}>Rest Time: {restTimeValue}s</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  valuesContainer: {
    marginTop: SIZES.padding * 2,
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
  },
  valuesTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  valueText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default SliderExample; 