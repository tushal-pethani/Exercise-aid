import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';

interface AngleGaugeProps {
  gyroData: { x: number; y: number; z: number } | null;
  accData: { x: number; y: number; z: number } | null;
  thresholdAngle?: number;
}

const { width } = Dimensions.get('window');
const GAUGE_SIZE = width * 0.9;
const CENTER_X = GAUGE_SIZE / 2;
const CENTER_Y = GAUGE_SIZE / 2;
const RADIUS = GAUGE_SIZE * 0.4;
const INDICATOR_LENGTH = RADIUS * 0.9;

const AngleGauge: React.FC<AngleGaugeProps> = ({ 
  gyroData, 
  accData, 
  thresholdAngle = 90 
}) => {
  const angleRef = useRef(0);
  
  useEffect(() => {
    if (accData) {
      // Calculate the angle based on accelerometer data
      // Using atan2 to get the angle in radians, convert to degrees
      const x = accData.x;
      const y = accData.y;
      const z = accData.z;
      
      // Calculate tilt angle using accelerometer data
      // This is a simplified calculation for visualization purposes
      const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
      const roll = Math.atan2(-x, z) * (180 / Math.PI);
      
      // We'll use the larger of pitch or roll for our visualization
      angleRef.current = Math.abs(pitch) > Math.abs(roll) ? pitch : roll;
    }
  }, [accData]);

  // Calculate the position of the indicator needle
  const angle = angleRef.current;
  // Convert angle to radians and adjust for SVG coordinate system
  const radians = ((angle - 90) * Math.PI) / 180;
  
  // Calculate the endpoint of the indicator
  const indicatorEndX = CENTER_X + INDICATOR_LENGTH * Math.cos(radians);
  const indicatorEndY = CENTER_Y + INDICATOR_LENGTH * Math.sin(radians);
  
  // Calculate threshold indicator positions
  const thresholdRadians = ((thresholdAngle - 90) * Math.PI) / 180;
  const thresholdEndX = CENTER_X + INDICATOR_LENGTH * Math.cos(thresholdRadians);
  const thresholdEndY = CENTER_Y + INDICATOR_LENGTH * Math.sin(thresholdRadians);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        {/* Gauge circle */}
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
          {Array.from({ length: 36 }).map((_, i) => {
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
        
        {/* Center point */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={15}
          stroke="white"
          strokeWidth="1"
          fill="white"
        />
        
        {/* Angle display */}
        <SvgText
          x={CENTER_X}
          y={CENTER_Y + 5}
          fontSize="12"
          fontWeight="bold"
          fill="black"
          textAnchor="middle"
        >
          {Math.round(angle)}°
        </SvgText>
        
        {/* Threshold indicator (white) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={thresholdEndX}
          y2={thresholdEndY}
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Real-time indicator (green) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={indicatorEndX}
          y2={indicatorEndY}
          stroke="#4CAF50"  // Green color
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Red markers can be added based on specific conditions */}
        {Math.abs(angle) > thresholdAngle && (
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

export default AngleGauge; 