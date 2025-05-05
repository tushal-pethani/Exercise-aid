import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

interface MomentumGaugeProps {
  accData: { x: number; y: number; z: number } | null;
}

const { width } = Dimensions.get('window');
const GAUGE_SIZE = width * 0.9;
const CENTER_X = GAUGE_SIZE / 2;
const CENTER_Y = GAUGE_SIZE / 2;
const RADIUS = GAUGE_SIZE * 0.4;
const INDICATOR_LENGTH = RADIUS * 0.9;

const MomentumGauge: React.FC<MomentumGaugeProps> = ({ accData }) => {
  const momentumRef = useRef(0);
  
  useEffect(() => {
    if (accData) {
      // Calculate the momentum magnitude from accelerometer data
      // This is a simplified version that uses the Y-axis acceleration as momentum
      // In a real app, you might want to integrate acceleration over time to get actual momentum
      
      // Scale the y-axis acceleration to a suitable angle for visualization
      // We're using y-axis because it most likely represents vertical movement in the context
      let newMomentum = accData.y * 3; // Scale factor can be adjusted
      
      // Limit the range to prevent extreme angles
      newMomentum = Math.max(-90, Math.min(90, newMomentum));
      
      // Apply some smoothing
      momentumRef.current = momentumRef.current * 0.7 + newMomentum * 0.3;
    }
  }, [accData]);
  
  // Calculate the position of the indicator needle
  const momentum = momentumRef.current;
  // Convert angle to radians and adjust for SVG coordinate system (0 degrees is vertical)
  const radians = ((momentum - 90) * Math.PI) / 180;
  
  // Calculate the endpoint of the indicator
  const indicatorEndX = CENTER_X + INDICATOR_LENGTH * Math.cos(radians);
  const indicatorEndY = CENTER_Y + INDICATOR_LENGTH * Math.sin(radians);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        {/* Semicircle gauge background */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          stroke="white"
          strokeWidth="1"
          fill="transparent"
        />
        
        {/* Tick marks */}
        <G>
          {Array.from({ length: 18 }).map((_, i) => {
            // Only draw ticks for the top half of the circle
            const tickAngle = i * 10;
            const tickRadians = ((tickAngle - 90) * Math.PI) / 180;
            const innerRadius = RADIUS * 0.9;
            const outerRadius = RADIUS;
            const x1 = CENTER_X + innerRadius * Math.cos(tickRadians);
            const y1 = CENTER_Y + innerRadius * Math.sin(tickRadians);
            const x2 = CENTER_X + outerRadius * Math.cos(tickRadians);
            const y2 = CENTER_Y + outerRadius * Math.sin(tickRadians);
            
            const isMajorTick = i % 3 === 0;
            
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth={isMajorTick ? 2 : 1}
              />
            );
          })}
        </G>
        
        {/* Center circle */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={15}
          stroke="white"
          strokeWidth="1"
          fill="white"
        />
        
        {/* Momentum indicator (green line) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={indicatorEndX}
          y2={indicatorEndY}
          stroke="#4CAF50"  // Green color
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Warning indicator (red dot) that appears when momentum is high */}
        {Math.abs(momentum) > 60 && (
          <Circle
            cx={CENTER_X + RADIUS * 0.7 * Math.cos(radians - 0.3)}
            cy={CENTER_Y + RADIUS * 0.7 * Math.sin(radians - 0.3)}
            r={5}
            fill="red"
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});

export default MomentumGauge; 