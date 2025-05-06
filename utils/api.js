import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL
const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

// Get auth token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token from storage:', error);
    return null;
  }
};

// Create axios instance with auth headers
const createAuthRequest = async () => {
  const token = await getToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
  });
};

// Exercise API Functions

/**
 * Get all exercises for the current user
 * @returns {Promise<Array>} Array of exercise objects
 */
export const fetchUserExercises = async () => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.get('/exercises');
    return response.data;
  } catch (error) {
    console.error('Error fetching user exercises:', error);
    throw error;
  }
};

/**
 * Get recent exercises (latest 5) for the current user
 * @returns {Promise<Array>} Array of recent exercise objects
 */
export const fetchRecentExercises = async () => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.get('/exercises/recent');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent exercises:', error);
    // If 404 error (endpoint not found or no data), return empty array
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error;
  }
};

/**
 * Get exercises for a specific user by username (physio only)
 * @param {string} username Username to fetch exercises for
 * @returns {Promise<Array>} Array of exercise objects
 */
export const fetchUserExercisesByUsername = async (username) => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.get(`/exercises/user/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises by username:', error);
    throw error;
  }
};

/**
 * Save exercise data to the server
 * @param {Object} exerciseData Exercise data to save
 * @returns {Promise<Object>} Saved exercise object
 */
export const saveExercise = async (exerciseData) => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.post('/exercises', exerciseData);
    return response.data;
  } catch (error) {
    console.error('Error saving exercise:', error);
    throw error;
  }
};

/**
 * Delete an exercise by ID
 * @param {string} exerciseId ID of exercise to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteExercise = async (exerciseId) => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.delete(`/exercises/${exerciseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
};

/**
 * Get exercise statistics for the current user
 * @returns {Promise<Object>} Exercise statistics
 */
export const fetchExerciseStatistics = async () => {
  try {
    const authRequest = await createAuthRequest();
    const response = await authRequest.get('/exercises/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise statistics:', error);
    throw error;
  }
};

export default {
  fetchUserExercises,
  fetchRecentExercises,
  fetchUserExercisesByUsername,
  saveExercise,
  deleteExercise,
  fetchExerciseStatistics
}; 