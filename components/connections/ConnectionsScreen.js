import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import profileImage from '../../utils/profileImage';

// Use direct API_URL instead of importing from config
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

const ConnectionsScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Determine if user is client or physio
  const isClient = user?.role.toLowerCase() === 'client';
  
  useEffect(() => {
    fetchConnections();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchConnections);
    return unsubscribe;
  }, [navigation]);
  
  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users/connections`, {
        headers: { 'x-auth-token': token }
      });
      setConnections(response.data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      Alert.alert('Error', 'Failed to load your connections');
      setConnections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchConnections();
  };
  
  const filteredConnections = connections.filter(
    connection => connection.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleViewProfile = (connectionId) => {
    // Navigate to connection profile
    navigation.navigate('ConnectionProfile', { connectionId });
  };
  
  const handleChat = (connectionId) => {
    // Navigate to chat screen
    navigation.navigate('Chat', { connectionId });
  };
  
  const handleFindConnections = () => {
    navigation.navigate('SearchPhysio');
  };
  
  const handleViewRequests = () => {
    navigation.navigate('Requests');
  };
  
  const renderConnectionItem = ({ item }) => (
    <View style={styles.connectionCard}>
      <Image 
        source={profileImage} 
        style={styles.connectionImage}
      />
      
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>{item.username}</Text>
        
        {isClient && item.specialties && item.specialties.length > 0 ? (
          <View style={styles.specialtiesContainer}>
            {item.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        ) : null}
        
        <Text style={styles.lastActive}>
          Last active: {item.lastActive || 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.connectionActions}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => handleViewProfile(item._id)}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => handleChat(item._id)}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search your ${isClient ? 'physios' : 'clients'}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleFindConnections}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            My {isClient ? 'Physiotherapists' : 'Clients'}
          </Text>
          
          <TouchableOpacity 
            style={styles.requestsButton}
            onPress={handleViewRequests}
          >
            <Text style={styles.requestsButtonText}>View Requests</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} />
        ) : filteredConnections.length > 0 ? (
          <FlatList
            data={filteredConnections}
            keyExtractor={(item) => item._id}
            renderItem={renderConnectionItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {isClient ? 'physiotherapists' : 'clients'} found.
            </Text>
            <TouchableOpacity 
              style={styles.findButton}
              onPress={handleFindConnections}
            >
              <Text style={styles.findButtonText}>
                Find {isClient ? 'Physiotherapists' : 'Clients'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    fontSize: SIZES.medium,
    ...SHADOWS.small,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  requestsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 6,
  },
  requestsButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  listContainer: {
    paddingBottom: SIZES.padding,
  },
  connectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    ...SHADOWS.small,
  },
  connectionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.padding,
  },
  connectionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  connectionName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  specialtyTag: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  specialtyText: {
    color: COLORS.white,
    fontSize: SIZES.small,
  },
  lastActive: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  exerciseCount: {
    fontSize: SIZES.small,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  connectionActions: {
    justifyContent: 'space-between',
    paddingLeft: SIZES.paddingSmall,
  },
  profileButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  profileButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  chatButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  findButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  findButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ConnectionsScreen; 