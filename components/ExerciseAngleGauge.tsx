import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G, 
  Path,
  Rect
} from 'react-native-svg';

interface ExerciseAngleGaugeProps {
  currentAngle: number;
  thresholdAngle: number;
  warningThreshold?: number; // Typically slightly below the target threshold
}

const { width } = Dimensions.get('window');
const GAUGE_SIZE = width * 0.9;
const CENTER_X = GAUGE_SIZE / 2;
const CENTER_Y = GAUGE_SIZE / 2;
const RADIUS = GAUGE_SIZE * 0.45;
const INDICATOR_LENGTH = RADIUS * 0.85;
const WHITE_INDICATOR_WIDTH = 16;
const GREEN_INDICATOR_WIDTH = 12;

const ExerciseAngleGauge: React.FC<ExerciseAngleGaugeProps> = ({ 
  currentAngle, 
  thresholdAngle,
  warningThreshold = 85 // Default value, slightly below threshold
}) => {
  // Calculate the positions for the indicators
  const currentRadians = ((currentAngle - 90) * Math.PI) / 180;
  const thresholdRadians = ((thresholdAngle - 90) * Math.PI) / 180;
  
  // Calculate the endpoint of the current angle indicator (green)
  const greenEndX = CENTER_X + INDICATOR_LENGTH * Math.cos(currentRadians);
  const greenEndY = CENTER_Y + INDICATOR_LENGTH * Math.sin(currentRadians);
  
  // Calculate the endpoint of the threshold indicator (white/gray)
  const whiteEndX = CENTER_X + INDICATOR_LENGTH * Math.cos(thresholdRadians);
  const whiteEndY = CENTER_Y + INDICATOR_LENGTH * Math.sin(thresholdRadians);

  // Calculate positions for the warning markers (red flags)
  const warningRadiansLeft = ((currentAngle - 95) * Math.PI) / 180;
  const warningRadiansRight = ((currentAngle - 85) * Math.PI) / 180;
  
  // Show warnings when approaching or exceeding the threshold
  const showWarnings = currentAngle >= warningThreshold;
  
  // Create tick marks for the gauge
  const createTicks = () => {
    const ticks = [];
    for (let i = 0; i < 36; i++) {
      const tickAngle = i * 10;
      const tickRadians = ((tickAngle - 90) * Math.PI) / 180;
      const isMajorTick = i % 3 === 0;
      
      // Skip ticks in the bottom half of the circle
      if (tickAngle > 180) continue;
      
      const innerRadius = isMajorTick ? RADIUS * 0.85 : RADIUS * 0.9;
      const outerRadius = RADIUS;
      
      const x1 = CENTER_X + innerRadius * Math.cos(tickRadians);
      const y1 = CENTER_Y + innerRadius * Math.sin(tickRadians);
      const x2 = CENTER_X + outerRadius * Math.cos(tickRadians);
      const y2 = CENTER_Y + outerRadius * Math.sin(tickRadians);
      
      ticks.push(
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
      
      // Add text for major ticks
      if (isMajorTick && tickAngle <= 180) {
        const textRadius = RADIUS * 1.1;
        const textX = CENTER_X + textRadius * Math.cos(tickRadians);
        const textY = CENTER_Y + textRadius * Math.sin(tickRadians);
        
        ticks.push(
          <SvgText
            key={`text-${i}`}
            x={textX}
            y={textY}
            fill="white"
            fontSize="12"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {tickAngle}°
          </SvgText>
        );
      }
    }
    return ticks;
  };

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        {/* Semi-circular gauge background */}
        <Path
          d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
          stroke="white"
          strokeWidth="2"
          fill="transparent"
        />
        
        {/* Tick marks */}
        <G>
          {createTicks()}
        </G>
        
        {/* Threshold line (white/gray) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={whiteEndX}
          y2={whiteEndY}
          stroke="#E0E0E0"
          strokeWidth={WHITE_INDICATOR_WIDTH}
          strokeLinecap="round"
        />
        
        {/* Current angle line (green) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={greenEndX}
          y2={greenEndY}
          stroke="#4CAF50"
          strokeWidth={GREEN_INDICATOR_WIDTH}
          strokeLinecap="round"
        />
        
        {/* Angle value display circle */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS * 0.2}
          fill="white"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Angle value text */}
        <SvgText
          x={CENTER_X}
          y={CENTER_Y + 5}
          fill="black"
          fontSize="20"
          fontWeight="bold"
          textAnchor="middle"
        >
          {Math.round(currentAngle).toFixed(1)}
        </SvgText>
        
        {/* Warning markers (red flags) - only show when approaching/exceeding threshold */}
        {showWarnings && (
          <>
            <G>
              {/* Left warning flag */}
              <G>
                <Line
                  x1={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansLeft)}
                  y1={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansLeft)}
                  x2={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansLeft) + 15}
                  y2={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansLeft) - 15}
                  stroke="#FF0000"
                  strokeWidth="2"
                />
                <Rect
                  x={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansLeft) + 5}
                  y={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansLeft) - 25}
                  width={10}
                  height={15}
                  fill="#FF0000"
                />
              </G>
              
              {/* Right warning flag */}
              <G>
                <Line
                  x1={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansRight)}
                  y1={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansRight)}
                  x2={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansRight) + 15}
                  y2={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansRight) - 15}
                  stroke="#FF0000"
                  strokeWidth="2"
                />
                <Rect
                  x={CENTER_X + RADIUS * 0.6 * Math.cos(warningRadiansRight) + 5}
                  y={CENTER_Y + RADIUS * 0.6 * Math.sin(warningRadiansRight) - 25}
                  width={10}
                  height={15}
                  fill="#FF0000"
                />
              </G>
            </G>
          </>
        )}
        
        {/* Secondary angle value display - also show the target angle */}
        <SvgText
          x={CENTER_X + RADIUS * 0.5}
          y={CENTER_Y - RADIUS * 0.5}
          fill="white"
          fontSize="14"
          textAnchor="middle"
        >
          Target: {thresholdAngle}°
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    width: '100%',
  },
});

export default ExerciseAngleGauge; 