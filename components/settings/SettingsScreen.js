import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  
  // App settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [bluetoothAutoConnect, setBluetoothAutoConnect] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  
  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, you would update the settings in the backend
    Alert.alert('Success', 'Settings saved successfully');
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };
  
  const renderSettingItem = ({ title, value, onValueChange, description }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        trackColor={{ false: COLORS.inactive, true: COLORS.secondary }}
        thumbColor={value ? COLORS.white : COLORS.white}
        ios_backgroundColor={COLORS.inactive}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <View style={styles.settingsList}>
          {renderSettingItem({
            title: 'Enable Notifications',
            value: notificationsEnabled,
            onValueChange: setNotificationsEnabled,
            description: 'Receive notifications about exercise reminders and updates'
          })}
          
          {renderSettingItem({
            title: 'Dark Mode',
            value: darkMode,
            onValueChange: setDarkMode,
            description: 'Use dark theme throughout the app'
          })}
          
          {renderSettingItem({
            title: 'Auto-connect Bluetooth',
            value: bluetoothAutoConnect,
            onValueChange: setBluetoothAutoConnect,
            description: 'Automatically connect to paired devices'
          })}
          
          {renderSettingItem({
            title: 'Haptic Feedback',
            value: hapticFeedback,
            onValueChange: setHapticFeedback,
            description: 'Enable vibration feedback during exercises'
          })}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        
        <View style={styles.settingsList}>
          {renderSettingItem({
            title: 'Data Synchronization',
            value: dataSync,
            onValueChange: setDataSync,
            description: 'Sync exercise data with cloud storage'
          })}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutList}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>User</Text>
            <Text style={styles.aboutValue}>{user?.username || 'N/A'}</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Role</Text>
            <Text style={styles.aboutValue}>
              {user?.role === 'client' ? 'Client' : 'Physiotherapist'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    paddingTop: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    paddingHorizontal: SIZES.padding,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  settingsList: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.padding,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingContent: {
    flex: 1,
    marginRight: SIZES.padding,
  },
  settingTitle: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  aboutList: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aboutLabel: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    padding: SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  saveButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});

export default SettingsScreen; 