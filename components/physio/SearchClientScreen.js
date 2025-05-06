import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
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

const SearchClientScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState({});
  const [loading, setLoading] = useState(false);

  // Function to search for clients
  const searchClients = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${API_URL}/search/users`, {
        params: { 
          role: 'client',
          query: searchQuery 
        },
        headers: { 'x-auth-token': token }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching clients:', error);
      const errorMsg = error.response?.data?.message || 
                      `Failed to search (Status: ${error.response?.status || 'unknown'})`;
      Alert.alert(
        'Search Error', 
        errorMsg, 
        [{ text: 'OK' }]
      );
    } finally {
      setSearching(false);
    }
  };

  // Function to fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/requests`, {
        headers: { 'x-auth-token': token }
      });
      
      // Create a map of recipient ids to request status
      const requestMap = {};
      response.data.forEach(request => {
        if (request.sender._id === user._id) {
          requestMap[request.recipient._id] = request.status;
        }
      });
      
      setSentRequests(requestMap);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Function to send a connection request
  const sendConnectionRequest = async (recipientId) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/requests`,
        { recipientId },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update the local state to show request sent
      setSentRequests(prev => ({
        ...prev,
        [recipientId]: 'pending'
      }));
      
      Alert.alert('Success', 'Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  // Render a single user item
  const renderUserItem = ({ item }) => {
    const hasRequestPending = sentRequests[item._id] === 'pending';
    const isConnected = sentRequests[item._id] === 'accepted';
    
    return (
      <View style={styles.userCard}>
        <Image 
          source={profileImage} 
          style={styles.userImage}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          
          {item.medicalConditions && item.medicalConditions.length > 0 ? (
            <View style={styles.conditionsContainer}>
              {item.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.conditionTag}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          ) : null}
          
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.connectButton,
            hasRequestPending && styles.pendingButton,
            isConnected && styles.connectedButton,
            loading && styles.disabledButton
          ]}
          onPress={() => sendConnectionRequest(item._id)}
          disabled={hasRequestPending || isConnected || loading}
        >
          <Text style={styles.connectButtonText}>
            {isConnected ? 'Connected' : 
             hasRequestPending ? 'Pending' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Find Clients</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchClients}
          returnKeyType="search"
        />
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchClients}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {searching ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? 'No clients found' : 'Search for clients'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    marginRight: SIZES.paddingSmall,
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.padding,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  conditionTag: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  conditionText: {
    color: COLORS.white,
    fontSize: SIZES.small,
  },
  userEmail: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  connectButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  pendingButton: {
    backgroundColor: COLORS.warning,
  },
  connectedButton: {
    backgroundColor: COLORS.success,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default SearchClientScreen; 