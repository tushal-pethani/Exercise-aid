import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Image,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { useBluetooth } from '../../context/BluetoothContext';
import { fetchRecentExercises } from '../../utils/api';

const ClientHomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isConnected, deviceInfo, disconnectDevice } = useBluetooth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent activities
  useEffect(() => {
    fetchRecentActivities();
  }, []);

  // Reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecentActivities();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchRecentActivities = async () => {
    setLoading(true);
    try {
      const exercises = await fetchRecentExercises();
      setRecentActivities(exercises || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Don't show alert, just set empty data
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Render a single activity item
  const renderActivityItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.activityItem}
      onPress={() => navigation.navigate('Profile', { screen: 'ExerciseHistory' })}
    >
      <View style={styles.activityIconContainer}>
        <Text style={styles.activityIcon}>
          {item.bodyPart === 'shoulder' ? '💪' : 
           item.bodyPart === 'knee' ? '🦵' : 
           item.bodyPart === 'back' ? '🔄' : '🏋️'}
        </Text>
      </View>
      
      <View style={styles.activityInfo}>
        <Text style={styles.activityName}>
          {item.exerciseType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Text>
        
        <Text style={styles.activityDetails}>
          {item.sets} sets • {item.reps} reps • 
          <Text style={[
            styles.accuracyText, 
            { color: getAccuracyColor(item.accuracy) }
          ]}> {Math.round(item.accuracy)}% accuracy</Text>
        </Text>
      </View>
      
      <Text style={styles.activityTime}>{formatDate(item.date)}</Text>
    </TouchableOpacity>
  );
  
  // Get color based on accuracy
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50';
    if (accuracy >= 70) return '#FFC107';
    return '#F44336';
  };

  const handleCreateCustomTask = () => {
    navigation.navigate('CreateCustomTask');
  };

  const handleAssignedExercises = () => {
    navigation.navigate('AssignedExercises');
  };

  const handleDeviceConnection = () => {
    if (isConnected) {
      // Show confirmation dialog
      Alert.alert(
        'Disconnect Device',
        'Are you sure you want to disconnect from your device?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Disconnect',
            onPress: disconnectDevice,
            style: 'destructive'
          }
        ]
      );
    } else {
      // Navigate to device scan screen
      navigation.navigate('ExerciseStack', { screen: 'DeviceScan' });
    }
  };

  const handleSearchPhysio = () => {
    navigation.navigate('SearchPhysio');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header with Actions */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          Welcome, {user?.username || 'Client'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[
              styles.headerButton, 
              styles.connectButton,
              isConnected && styles.disconnectButton
            ]}
            onPress={handleDeviceConnection}
          >
            <Text style={styles.headerIcon}>{isConnected ? '✕' : '📡'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleSearchPhysio}
          >
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Connected Device Info */}
        {isConnected && deviceInfo && (
          <View style={styles.deviceInfoCard}>
            <View style={styles.deviceInfoHeader}>
              <Text style={styles.deviceInfoTitle}>Connected Device</Text>
              <TouchableOpacity 
                style={styles.disconnectTextButton}
                onPress={() => handleDeviceConnection()}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.deviceInfoContent}>
              <View style={styles.deviceIconBadge}>
                <Text style={styles.deviceIconText}>📡</Text>
              </View>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceName}>{deviceInfo.name}</Text>
                <Text style={styles.deviceId}>ID: {deviceInfo.id.substring(0, 10)}...</Text>
                <Text style={styles.connectedSince}>
                  Connected since: {new Date(deviceInfo.connectedAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      
        {/* Banner */}
        <View style={styles.banner}>
          <Image 
            source={require('../../assets/images/exercise_banner.jpg')} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>EXERCISE AID</Text>
            <Text style={styles.bannerSubtitle}>Track and improve your progress</Text>
          </View>
        </View>

        {/* Main Content - Two Buttons */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          
          <TouchableOpacity 
            style={[styles.mainButton, styles.customButton]}
            onPress={handleCreateCustomTask}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🔧</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Create Custom Task</Text>
                <Text style={styles.buttonDescription}>
                  Create your own custom exercise routine
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mainButton, styles.assignedButton]}
            onPress={handleAssignedExercises}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🩺</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Exercise Assigned by Physio</Text>
                <Text style={styles.buttonDescription}>
                  View and perform exercises assigned to you
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'history' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.secondary} />
          ) : recentActivities.length > 0 ? (
            <FlatList
              data={recentActivities}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.activitiesList}
            />
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No recent activities</Text>
              <Text style={styles.emptySubtext}>Complete an exercise to see it here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 3,
    paddingBottom: SIZES.paddingSmall,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  connectButton: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  disconnectButton: {
    backgroundColor: COLORS.error,
  },
  headerIcon: {
    fontSize: SIZES.large,
    color: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  deviceInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  deviceInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.paddingSmall,
    marginBottom: SIZES.paddingSmall,
  },
  deviceInfoTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  disconnectTextButton: {
    padding: SIZES.paddingSmall,
  },
  disconnectText: {
    color: COLORS.error,
    fontWeight: '500',
    fontSize: SIZES.small,
  },
  deviceInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 173, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  deviceIconText: {
    fontSize: SIZES.large,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deviceId: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  connectedSince: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  banner: {
    height: 180,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.padding,
    ...SHADOWS.medium,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: SIZES.xxLarge,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  bannerSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  mainContent: {
    marginVertical: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  mainButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    ...SHADOWS.medium,
  },
  customButton: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  assignedButton: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.info,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 40,
    marginRight: SIZES.padding,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  sectionContainer: {
    marginTop: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  seeAllText: {
    color: COLORS.secondary,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  activitiesList: {
    paddingVertical: SIZES.paddingSmall,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.paddingSmall,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  accuracyText: {
    fontWeight: '500',
  },
  activityTime: {
    fontSize: SIZES.xSmall,
    color: COLORS.textSecondary,
    marginLeft: SIZES.paddingSmall,
  },
  emptyActivity: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  emptySubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
});

export default ClientHomeScreen; 