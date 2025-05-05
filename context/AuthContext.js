import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Set auth header
          axios.defaults.headers.common['x-auth-token'] = storedToken;
        }
      } catch (err) {
        console.error('Error loading auth state', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Registration attempt with:', JSON.stringify(userData));
      console.log('Using API URL:', `${process.env.API_URL || 'http://172.20.10.5:3000/api'}/auth/signup`);
      
      const res = await axios.post(`${process.env.API_URL || 'http://172.20.10.5:3000/api'}/auth/signup`, userData);
      
      console.log('Registration response:', JSON.stringify(res.data));
      
      const { token, user } = res.data;
      
      // Save to storage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set state
      setToken(token);
      setUser(user);
      
      // Set auth header
      axios.defaults.headers.common['x-auth-token'] = token;
      
      return { success: true };
    } catch (err) {
      console.error('Registration error details:', err);
      console.error('Error response:', JSON.stringify(err.response?.data));
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', JSON.stringify(err.response?.headers));
      
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${process.env.API_URL || 'http://172.20.10.5:3000/api'}/auth/login`, {
        username,
        password
      });
      
      const { token, user } = res.data;
      
      // Save to storage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set state
      setToken(token);
      setUser(user);
      
      // Set auth header
      axios.defaults.headers.common['x-auth-token'] = token;
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Remove from storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear auth header
      delete axios.defaults.headers.common['x-auth-token'];
    } catch (err) {
      console.error('Error logging out', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 