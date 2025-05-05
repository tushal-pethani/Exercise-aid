import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../utils/theme';

const RequestItem = ({ request, onAccept, onDecline, isLoading }) => {
  const { user } = useAuth();
  const isReceived = request.recipient._id === user.id;
  const otherUser = isReceived ? request.sender : request.recipient;

  // If the request is already accepted or declined
  if (request.status !== 'pending') {
    return (
      <View style={styles.requestItem}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{otherUser.username}</Text>
          <Text style={styles.userRole}>{otherUser.role}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              request.status === 'accepted'
                ? styles.acceptedStatus
                : styles.declinedStatus,
            ]}
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Text>
        </View>
      </View>
    );
  }

  // If the request is pending and user is the recipient
  if (isReceived) {
    return (
      <View style={styles.requestItem}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{otherUser.username}</Text>
          <Text style={styles.userRole}>{otherUser.role}</Text>
        </View>
        <View style={styles.actionsContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.secondary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={onAccept}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={onDecline}
              >
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  // If the request is pending and user is the sender
  return (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{otherUser.username}</Text>
        <Text style={styles.userRole}>{otherUser.role}</Text>
      </View>
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingText}>Pending</Text>
      </View>
    </View>
  );
};

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/requests`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setActionLoading(requestId);
      const response = await axios.patch(
        `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/requests/${requestId}`,
        { status: 'accepted' },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      // Update the request in the state
      setRequests(
        requests.map((req) =>
          req._id === requestId ? { ...req, status: 'accepted' } : req
        )
      );

      Alert.alert('Success', 'Request accepted');
    } catch (err) {
      console.error('Error accepting request:', err);
      Alert.alert('Error', 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      setActionLoading(requestId);
      const response = await axios.patch(
        `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/requests/${requestId}`,
        { status: 'rejected' },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      // Update the request in the state
      setRequests(
        requests.map((req) =>
          req._id === requestId ? { ...req, status: 'rejected' } : req
        )
      );

      Alert.alert('Success', 'Request declined');
    } catch (err) {
      console.error('Error declining request:', err);
      Alert.alert('Error', 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No connection requests found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <RequestItem
          request={item}
          onAccept={() => handleAccept(item._id)}
          onDecline={() => handleDecline(item._id)}
          isLoading={actionLoading === item._id}
        />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SIZES.padding,
  },
  requestItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: SIZES.small,
    color: COLORS.inactive,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius / 2,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.secondary,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  pendingContainer: {
    backgroundColor: '#FFF9C4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radius / 2,
  },
  pendingText: {
    color: '#F57F17',
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radius / 2,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  acceptedStatus: {
    color: COLORS.success,
  },
  declinedStatus: {
    color: COLORS.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.inactive,
  },
});

export default RequestsList; 