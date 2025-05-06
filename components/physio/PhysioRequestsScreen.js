import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const PhysioRequestsScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchRequests);
    return unsubscribe;
  }, [navigation]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      console.log('Current user ID (physio):', user.id || user._id); // Debug log
      
      const response = await axios.get(`${API_URL}/requests`, {
        headers: { 'x-auth-token': token }
      });
      
      console.log('All requests (physio):', JSON.stringify(response.data)); // Debug log
      
      // Filter incoming requests (where user is recipient and status is pending)
      const incoming = response.data.filter(request => {
        const isRecipient = request.recipient._id === user.id || 
                          request.recipient._id === user._id || 
                          request.recipient === user.id || 
                          request.recipient === user._id;
        return request.status === 'pending' && isRecipient;
      });
      
      // Filter outgoing requests (where user is sender and status is pending)
      const outgoing = response.data.filter(request => {
        const isSender = request.sender._id === user.id || 
                        request.sender._id === user._id || 
                        request.sender === user.id || 
                        request.sender === user._id;
        return request.status === 'pending' && isSender;
      });
      
      console.log('Outgoing requests (physio):', JSON.stringify(outgoing)); // Debug log
      
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, status) => {
    setProcessingId(requestId);
    try {
      await axios.patch(
        `${API_URL}/requests/${requestId}`,
        { status },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update local state by removing the processed request
      setIncomingRequests(incomingRequests.filter(request => request._id !== requestId));
      
      Alert.alert(
        'Success', 
        `Request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`
      );
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      Alert.alert('Error', `Failed to ${status} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      console.log('Attempting to cancel request with ID:', requestId);
      
      // Make a DELETE request to cancel the request
      const response = await axios.delete(
        `${API_URL}/requests/${requestId}`,
        { headers: { 'x-auth-token': token } }
      );
      
      console.log('Cancel request response:', response.data);
      
      // Update local state by removing the cancelled request
      setOutgoingRequests(outgoingRequests.filter(request => request._id !== requestId));
      
      Alert.alert('Success', 'Request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      console.error('Error details:', JSON.stringify({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }));
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error ||
                           error.message ||
                           `Failed to cancel request (Status: ${error.response?.status || 'unknown'})`;
      
      Alert.alert(
        'Error Cancelling Request',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingId(null);
    }
  };

  const renderIncomingRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <Image 
        source={profileImage} 
        style={styles.userImage}
      />
      
      <View style={styles.requestInfo}>
        <Text style={styles.userName}>{item.sender.username}</Text>
        <Text style={styles.userRole}>
          {item.sender.role.charAt(0).toUpperCase() + item.sender.role.slice(1)}
        </Text>
        
        {/* Display medical conditions if available */}
        {item.sender.medicalConditions && item.sender.medicalConditions.length > 0 && (
          <View style={styles.conditionsContainer}>
            <Text style={styles.conditionsLabel}>Medical Conditions:</Text>
            <Text style={styles.conditionsText}>
              {item.sender.medicalConditions.join(', ')}
            </Text>
          </View>
        )}
        
        <Text style={styles.requestTime}>
          Requested {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.declineButton,
            processingId === item._id && styles.disabledButton
          ]}
          onPress={() => handleRequest(item._id, 'declined')}
          disabled={processingId === item._id}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.acceptButton,
            processingId === item._id && styles.disabledButton
          ]}
          onPress={() => handleRequest(item._id, 'accepted')}
          disabled={processingId === item._id}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutgoingRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <Image 
        source={profileImage} 
        style={styles.userImage}
      />
      
      <View style={styles.requestInfo}>
        <Text style={styles.userName}>{item.recipient.username}</Text>
        <Text style={styles.userRole}>
          {item.recipient.role.charAt(0).toUpperCase() + item.recipient.role.slice(1)}
        </Text>
        
        {/* Display specialties if available */}
        {item.recipient.specialties && item.recipient.specialties.length > 0 && (
          <View style={styles.specialtiesContainer}>
            <Text style={styles.specialtiesLabel}>Specialties:</Text>
            <Text style={styles.specialtiesText}>
              {item.recipient.specialties.join(', ')}
            </Text>
          </View>
        )}
        
        <Text style={styles.requestTime}>
          Sent {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.cancelButton,
            processingId === item._id && styles.disabledButton
          ]}
          onPress={() => handleCancelRequest(item._id)}
          disabled={processingId === item._id}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Connection Requests</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'incoming' && styles.activeTab
          ]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'incoming' && styles.activeTabText
          ]}>
            Incoming {incomingRequests.length > 0 ? `(${incomingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'outgoing' && styles.activeTab
          ]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'outgoing' && styles.activeTabText
          ]}>
            Sent {outgoingRequests.length > 0 ? `(${outgoingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={activeTab === 'incoming' ? incomingRequests : outgoingRequests}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'incoming' ? renderIncomingRequestItem : renderOutgoingRequestItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab === 'incoming' ? 'incoming' : 'sent'} requests
              </Text>
              {activeTab === 'outgoing' && (
                <TouchableOpacity 
                  style={styles.findButton}
                  onPress={() => navigation.navigate('SearchClient')}
                >
                  <Text style={styles.findButtonText}>Find Clients</Text>
                </TouchableOpacity>
              )}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  tabText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.padding,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: SIZES.small,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  conditionsContainer: {
    marginBottom: 4,
  },
  conditionsLabel: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  conditionsText: {
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  specialtiesContainer: {
    marginBottom: 4,
  },
  specialtiesLabel: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  specialtiesText: {
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  requestTime: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 80,
  },
  actionButton: {
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  declineButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
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
    marginBottom: 20,
  },
  findButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  findButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
});

export default PhysioRequestsScreen; 