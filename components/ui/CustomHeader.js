import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../utils/theme';
import { useNavigation } from '@react-navigation/native';

// Get status bar height for different platforms
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

/**
 * CustomHeader - A consistent header component that properly handles the notch area
 * 
 * @param {string} title - The title to display in the header
 * @param {boolean} showBackButton - Whether to show a back button (defaults to false)
 * @param {boolean} showDrawerButton - Whether to show the drawer menu button (defaults to false)
 * @param {function} onBackPress - Custom back button handler (optional)
 * @param {React.ReactNode} rightComponent - Optional component to render on the right side
 */
const CustomHeader = ({ 
  title, 
  showBackButton = false, 
  showDrawerButton = false,
  onBackPress,
  rightComponent
}) => {
  const navigation = useNavigation();
  
  // Default back action
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };
  
  // Handle drawer open
  const handleDrawerOpen = () => {
    navigation.openDrawer();
  };
  
  return (
    <View style={styles.header}>
      {/* Left side - Back button or drawer button */}
      {showBackButton && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleBack}
        >
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
      )}
      
      {showDrawerButton && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleDrawerOpen}
        >
          <Text style={styles.iconText}>☰</Text>
        </TouchableOpacity>
      )}
      
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Right component (if provided) */}
      {rightComponent ? (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      ) : (
        // Empty view to maintain layout if no right component
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: STATUSBAR_HEIGHT + SIZES.paddingMedium,
    paddingBottom: SIZES.paddingMedium,
    paddingHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.paddingSmall,
  },
  iconText: {
    fontSize: 24,
    color: COLORS.secondary,
  },
  title: {
    ...FONTS.heading,
    fontSize: SIZES.large,
    color: COLORS.secondary,
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  }
});

export default CustomHeader; 