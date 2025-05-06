import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Image,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
const profileImage = require('../../assets/images/profile-avatar.png');
// Placeholder data for clients
const dummyClients = [
  { id: '1', name: 'John Doe', age: 35, exercises: 3, lastActive: '2 days ago' },
  { id: '2', name: 'Jane Smith', age: 42, exercises: 5, lastActive: '5 hours ago' },
  { id: '3', name: 'Mark Johnson', age: 28, exercises: 1, lastActive: 'Just now' },
];
// Use direct API_URL instead of importing from config
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';
const PhysioHomeScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch clients when component mounts
  useEffect(() => {
    fetchClients();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchClients);
    return unsubscribe;
  }, [navigation]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Get all connections for the current user
      const response = await axios.get(`${API_URL}/users/connections`, {
        headers: { 'x-auth-token': token }
      });
      
      // Filter connections to only show clients
      const clientConnections = response.data.filter(connection => 
        ['client', 'Client', 'CLIENT', 'patient'].includes(connection.role)
      );
      
      console.log(`Found ${clientConnections.length} client connections`);
      setClients(clientConnections);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load your clients');
    } finally {
      setLoading(false);
    }
  };

  const handleManageClients = () => {
    // Navigate to clients management screen
    navigation.navigate('ManageClients');
  };

  const handleCreateExercise = () => {
    // Navigate to exercise creation screen
    navigation.navigate('CreateExercise');
  };

  const handleSearchClient = () => {
    // Navigate to client search screen
    navigation.navigate('SendRequest');
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => {
        console.log('Opening client profile from home screen with ID:', item._id);
        navigation.navigate('ClientProfile', { 
          clientId: item._id,
          clientData: item  // Pass the entire client object for fallback
        });
      }}
    >
      <Image 
        source={profileImage}
        style={styles.clientImage}
      />
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.username}</Text>
        <Text style={styles.clientDetail}>Age: {item.age}</Text>
        {item.medicalConditions && item.medicalConditions.length > 0 && (
          <Text style={styles.clientDetail}>
            Conditions: {item.medicalConditions.slice(0, 2).join(', ')}
            {item.medicalConditions.length > 2 ? '...' : ''}
          </Text>
        )}
      </View>
      <View style={styles.clientActions}>
        <Text style={styles.clientActionIcon}>📋</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />
      
      {/* Custom Header with Actions */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          Welcome, {user?.username || 'Physio'}
        </Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSearchClient}
        >
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Image 
            source={require('../../assets/images/physio_banner.jpg')} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>PHYSIO DASHBOARD</Text>
            <Text style={styles.bannerSubtitle}>Monitor and manage your clients</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.clientsButton]}
            onPress={handleManageClients}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Manage Clients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.exerciseButton]}
            onPress={handleCreateExercise}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Create Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Client Overview Section */}
        <View style={styles.clientsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Clients</Text>
            <TouchableOpacity onPress={handleManageClients}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : clients.length > 0 ? (
            <FlatList
              data={clients}
              renderItem={renderClientItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No clients yet</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleSearchClient}
              >
                <Text style={styles.emptyStateButtonText}>Find Clients</Text>
              </TouchableOpacity>
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
    paddingVertical: SIZES.paddingSmall,
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
  headerIcon: {
    fontSize: SIZES.large,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  banner: {
    height: 160,
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
  },
  bannerSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SIZES.padding,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    width: '48%',
    padding: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  clientsButton: {
    borderTopColor: COLORS.physio,
    borderTopWidth: 4,
  },
  exerciseButton: {
    borderTopColor: COLORS.secondary,
    borderTopWidth: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clientsSection: {
    marginVertical: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  clientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SIZES.padding,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginBottom: 2,
  },
  clientActive: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  clientActions: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.paddingSmall,
  },
  clientActionIcon: {
    fontSize: 24,
  },
  emptyStateContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  emptyStateText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  emptyStateButton: {
    backgroundColor: COLORS.physio,
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  loader: {
    padding: SIZES.padding * 2,
  },
});

export default PhysioHomeScreen; 