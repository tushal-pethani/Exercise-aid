import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import profileImage from '../../utils/profileImage';

// API URL
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

const ChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { connectionId } = route.params || {};
  const { user, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  
  const flatListRef = useRef(null);
  
  // Fetch the connection details and messages
  useEffect(() => {
    const fetchConnectionAndMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch connection details
        const userResponse = await axios.get(`${API_URL}/users/${connectionId}`, {
          headers: { 'x-auth-token': token }
        });
        
        setConnection(userResponse.data);
        
        // Fetch messages
        await fetchMessages();
      } catch (err) {
        console.error('Error fetching connection data:', err);
        setError('Failed to load conversation. Please try again.');
        Alert.alert('Error', 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    
    if (connectionId) {
      fetchConnectionAndMessages();
    } else {
      setError('No connection specified');
      setLoading(false);
    }
    
    // Set up interval to refresh messages
    const intervalId = setInterval(() => {
      if (connectionId) {
        fetchMessages(false);
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [connectionId, token]);
  
  // Fetch messages
  const fetchMessages = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(`${API_URL}/messages/conversation/${connectionId}`, {
        headers: { 'x-auth-token': token }
      });
      
      setMessages(response.data);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (showLoadingState) {
        setError('Failed to load messages. Please try again.');
      }
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    setSending(true);
    try {
      const response = await axios.post(
        `${API_URL}/messages`,
        {
          recipient: connectionId,
          content: messageText
        },
        {
          headers: { 'x-auth-token': token }
        }
      );
      
      // Add the new message to the list
      setMessages(prevMessages => [...prevMessages, response.data]);
      
      // Clear input
      setMessageText('');
      
      // Scroll to bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Format date display
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Format time
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    if (isToday) {
      return `${hours}:${minutes} ${ampm}`;
    } else {
      // For messages not from today
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
    }
  };
  
  // Message bubble renderer
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender._id === user.id;
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}
      >
        {!isOwnMessage && (
          <Image 
            source={profileImage} 
            style={styles.messageSenderImage} 
          />
        )}
        
        <View 
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          <Text 
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        {connection ? (
          <View style={styles.headerInfo}>
            <Image 
              source={profileImage} 
              style={styles.headerAvatar} 
            />
            <Text style={styles.headerTitle}>{connection.username}</Text>
          </View>
        ) : (
          <Text style={styles.headerTitle}>Chat</Text>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchMessages()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          onLayout={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.disabledButton
          ]}
          onPress={sendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  errorText: {
    fontSize: SIZES.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  messagesContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.paddingSmall,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageSenderImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.secondary,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.white,
  },
  messageText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: SIZES.xSmall,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SIZES.paddingSmall,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    marginLeft: 8,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ChatScreen; 