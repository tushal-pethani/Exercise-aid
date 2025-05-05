import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../utils/theme';

const UserItem = ({ user, onSendRequest, isSending }) => {
  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.userDetails}>
          {user.age} years • {user.role}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.sendButton}
        onPress={onSendRequest}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.sendButtonText}>Connect</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const SendRequestScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with the opposite role
      const targetRole = user.role === 'patient' ? 'physiotherapist' : 'patient';
      
      const res = await axios.get(
        `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/users?role=${targetRole}`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setSending(userId);
      
      await axios.post(
        `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/requests`,
        { recipientId: userId },
        {
          headers: { 'x-auth-token': token }
        }
      );
      
      Alert.alert('Success', 'Connection request sent successfully');
      
      // Remove the user from the list
      const updatedUsers = users.filter((u) => u._id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    } catch (err) {
      console.error('Error sending request:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserItem
              user={item}
              onSendRequest={() => handleSendRequest(item._id)}
              isSending={sending === item._id}
            />
          )}
          contentContainerStyle={styles.listContainer}
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
  searchContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.medium,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  userItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  userDetails: {
    fontSize: SIZES.small,
    color: COLORS.inactive,
    textTransform: 'capitalize',
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    marginLeft: SIZES.padding,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.small,
  },
  centerContainer: {
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
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.inactive,
  },
});

export default SendRequestScreen; 