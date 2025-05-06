import { Platform } from 'react-native';

const COLORS = {
  // Main brand colors
  primary: '#C4DB93',     // Light green
  secondary: '#32AD5E',   // Darker green
  
  // UI colors
  background: '#EFEDE2',  // Light cream
  card: '#FFFFFF',        // White for cards
  text: '#333333',        // Dark gray for text
  textSecondary: '#757575', // Secondary text
  
  // Status colors
  error: '#FF3B30',       // Red for errors
  success: '#34C759',     // Green for success
  warning: '#FFCC00',     // Yellow for warnings
  info: '#5AC8FA',        // Blue for information
  
  // Navigation and UI elements
  inactive: '#8E8E93',    // Gray for inactive elements
  border: '#E0E0E0',      // Light gray for borders
  
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Exercise specific colors
  exercise: {
    good: '#4CAF50',      // Good performance
    average: '#FFC107',   // Average performance
    poor: '#F44336',      // Poor performance
  },
  
  // Transparent colors for overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Client vs Physio
  client: '#32AD5E',      // Green for client
  physio: '#448AFF',      // Blue for physio
};

const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

const SIZES = {
  // Font sizes
  xSmall: 10,
  small: 12,
  medium: 16,
  large: 20,
  xLarge: 24,
  xxLarge: 32,
  
  // Spacing
  padding: 16,
  paddingSmall: 8,
  paddingLarge: 24,
  margin: 16,
  marginSmall: 8,
  marginLarge: 24,
  
  // UI elements
  radius: 8,
  radiusSmall: 4,
  radiusLarge: 16,
  
  // Specific components
  buttonHeight: 48,
  inputHeight: 48,
  headerHeight: 60,
  iconSize: 24,
};

// Common style mixins
const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export { COLORS, FONTS, SIZES, SHADOWS }; 