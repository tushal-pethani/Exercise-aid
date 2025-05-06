import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import ExerciseHistoryTab from './ExerciseHistoryTab';
import { fetchExerciseStatistics } from '../../utils/api';
import profileImage from '../../utils/profileImage';

// Tab component for switching between profile views
const TabBar = ({ activeTab, setActiveTab, showHistoryTab }) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tab, 
          activeTab === 'profile' && styles.activeTab,
          !showHistoryTab && styles.fullWidthTab
        ]}
        onPress={() => setActiveTab('profile')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'profile' && styles.activeTabText
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
      
      {showHistoryTab && (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText
            ]}
          >
            Exercise History
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    totalTime: 0,
    averageAccuracy: 0,
  });
  const [loading, setLoading] = useState(false);
  
  // Determine if the user should see the Exercise History tab (only for clients)
  const showHistoryTab = user?.role?.toLowerCase() === 'client';
  
  // If user is physio and history tab is active, switch to profile tab
  useEffect(() => {
    if (!showHistoryTab && activeTab === 'history') {
      setActiveTab('profile');
    }
  }, [showHistoryTab, activeTab]);
  
  // Helper function to determine color based on accuracy
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50'; // Green
    if (accuracy >= 75) return '#FFC107'; // Yellow 
    if (accuracy >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };
  
  // Function to fetch statistics
  const fetchStats = async () => {
    setLoading(true);
    try {
      const stats = await fetchExerciseStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching exercise statistics:', error);
      // Keep default values in case of error
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch exercise statistics when the screen loads
  useEffect(() => {
    fetchStats();
  }, []);
  
  // Refresh statistics when switching to profile tab
  useEffect(() => {
    if (activeTab === 'profile') {
      fetchStats();
    }
  }, [activeTab]);
  
  // Profile information tab content
  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.profileContainer}>
        <Image 
          source={profileImage} 
          style={styles.profileImage}
        />
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.role}>
          {user?.role === 'client' ? 'Client' : 'Physiotherapist'}
        </Text>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not available'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{user?.age || 'Not available'}</Text>
          </View>
          
          {user?.role === 'physio' && (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Specialties</Text>
                <Text style={styles.infoValue}>
                  {user?.specialties?.length 
                    ? user.specialties.join(', ') 
                    : 'None specified'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Qualifications</Text>
                <Text style={styles.infoValue}>
                  {user?.qualifications?.length 
                    ? user.qualifications.join(', ') 
                    : 'None specified'}
                </Text>
              </View>
            </>
          )}
          
          {user?.role === 'client' && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Medical Conditions</Text>
              <Text style={styles.infoValue}>
                {user?.medicalConditions?.length 
                  ? user.medicalConditions.join(', ') 
                  : 'None specified'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>App Statistics</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.connections?.length || 0}
            </Text>
            <Text style={styles.statLabel}>
              {user?.role === 'client' ? 'Physios' : 'Clients'}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={styles.statValue}>{statistics.totalSessions}</Text>
            )}
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={styles.statValue}>
                {Math.floor(statistics.totalTime / 60)}
              </Text>
            )}
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={[
                styles.statValue,
                { color: getAccuracyColor(statistics.averageAccuracy) }
              ]}>
                {statistics.averageAccuracy ? statistics.averageAccuracy.toFixed(1) : '0'}%
              </Text>
            )}
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <TabBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showHistoryTab={showHistoryTab} 
      />
      
      {activeTab === 'profile' ? renderProfileTab() : <ExerciseHistoryTab />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.paddingSmall,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  tabText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SIZES.padding,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  username: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  role: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  infoSection: {
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SIZES.paddingSmall,
  },
  infoLabel: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',  // Adjust for 2 items per row
    marginBottom: SIZES.padding,
  },
  statValue: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.padding,
    marginBottom: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  fullWidthTab: {
    flex: 2,
  },
});

export default ProfileScreen; 