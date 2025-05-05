import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G, 
  Path,
  Rect
} from 'react-native-svg';

interface ExerciseMomentumGaugeProps {
  momentum: number; // Value between -100 and 100
  maxMomentum?: number; // Maximum momentum value
}

const { width } = Dimensions.get('window');
const GAUGE_SIZE = width * 0.9;
const CENTER_X = GAUGE_SIZE / 2;
const CENTER_Y = GAUGE_SIZE / 2;
const RADIUS = GAUGE_SIZE * 0.45;
const INDICATOR_WIDTH = 12;

const ExerciseMomentumGauge: React.FC<ExerciseMomentumGaugeProps> = ({ 
  momentum,
  maxMomentum = 100
}) => {
  // Ensure momentum is within bounds
  const normalizedMomentum = Math.max(-maxMomentum, Math.min(maxMomentum, momentum));
  
  // Convert momentum to angle (90° is straight up, 0° is right, 180° is left)
  // Map momentum from [-100, 100] to angle range [180, 0]
  const angle = 90 - (normalizedMomentum / maxMomentum * 90);
  
  // Convert angle to radians
  const radians = (angle * Math.PI) / 180;
  
  // Calculate the endpoint of the indicator
  const endX = CENTER_X + RADIUS * Math.cos(radians);
  const endY = CENTER_Y + RADIUS * Math.sin(radians);
  
  // Warning zones: show red marker when momentum is too high
  const showWarning = Math.abs(normalizedMomentum) > 0.7 * maxMomentum;
  
  // Create tick marks for the gauge
  const createTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 18; i++) {
      // We want ticks from 0 to 180 degrees
      const tickAngle = i * 10;
      const tickRadians = (tickAngle * Math.PI) / 180;
      const isMajorTick = i % 3 === 0;
      
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
      
      // Add text for major ticks at 0, 90, and 180 degrees
      if (tickAngle === 0 || tickAngle === 90 || tickAngle === 180) {
        const textRadius = RADIUS * 1.15;
        const textX = CENTER_X + textRadius * Math.cos(tickRadians);
        const textY = CENTER_Y + textRadius * Math.sin(tickRadians);
        
        let label;
        if (tickAngle === 0) label = `+${maxMomentum}`;
        else if (tickAngle === 90) label = "0";
        else if (tickAngle === 180) label = `-${maxMomentum}`;
        
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
            {label}
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
        
        {/* Center circle */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS * 0.15}
          fill="white"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Momentum indicator (green line) */}
        <Line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={endX}
          y2={endY}
          stroke="#4CAF50"
          strokeWidth={INDICATOR_WIDTH}
          strokeLinecap="round"
        />
        
        {/* Warning marker (red dot) when momentum is high */}
        {showWarning && (
          <Circle
            cx={CENTER_X + RADIUS * 0.7 * Math.cos(radians - 0.2)}
            cy={CENTER_Y + RADIUS * 0.7 * Math.sin(radians - 0.2)}
            r={8}
            fill="#FF0000"
          />
        )}
        
        {/* Momentum value text */}
        <SvgText
          x={CENTER_X}
          y={CENTER_Y + RADIUS + 20}
          fill="white"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
        >
          Momentum: {Math.round(normalizedMomentum)}
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

export default ExerciseMomentumGauge; 