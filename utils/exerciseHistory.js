import AsyncStorage from '@react-native-async-storage/async-storage';

// Exercise history entry structure
export interface ExerciseHistoryEntry {
  id?: string; // Made optional as it will be generated if not provided
  date?: string; // Made optional as it will be generated if not provided
  exerciseType: string;
  bodyPart: string;
  sets: number;
  reps: number;
  totalReps: number;
  perfectReps: number;
  goodReps: number;
  badReps: number;
  timeTaken: number;
  accuracy: number;
  targetAngle: number;
  userId?: string; // Added for user identification
  timestamp?: string; // Added to track when the exercise was completed
}

const HISTORY_STORAGE_KEY = 'exercise_history';

/**
 * Save a new exercise session to history
 * @param {ExerciseHistoryEntry} exerciseData
 * @returns {Promise<boolean>} Success status
 */
export const saveExerciseToHistory = async (exerciseData) => {
  try {
    // Generate a unique ID for this exercise session if not provided
    const entryWithId = {
      ...exerciseData,
      id: exerciseData.id || Date.now().toString(),
      date: exerciseData.date || new Date().toISOString(),
    };
    
    // Get existing history
    const existingHistory = await getExerciseHistory();
    
    // Add new entry to the beginning of the array
    const updatedHistory = [entryWithId, ...existingHistory];
    
    // Save updated history
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return true;
  } catch (error) {
    console.error('Error saving exercise to history:', error);
    return false;
  }
};

/**
 * Get all exercise history entries
 * @returns {Promise<ExerciseHistoryEntry[]>} Array of exercise history entries
 */
export const getExerciseHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting exercise history:', error);
    return [];
  }
};

/**
 * Clear all exercise history
 * @returns {Promise<boolean>} Success status
 */
export const clearExerciseHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing exercise history:', error);
    return false;
  }
};

/**
 * Delete a specific exercise history entry
 * @param {string} id The ID of the entry to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteExerciseHistoryEntry = async (id) => {
  try {
    const history = await getExerciseHistory();
    const updatedHistory = history.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('Error deleting exercise history entry:', error);
    return false;
  }
};

/**
 * Calculate exercise statistics (averages, totals, etc.)
 * @returns {Promise<object>} Exercise statistics
 */
export const getExerciseStatistics = async () => {
  try {
    const history = await getExerciseHistory();
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageAccuracy: 0,
        bodyPartDistribution: {},
        exerciseTypeDistribution: {},
      };
    }
    
    // Calculate statistics
    const totalSessions = history.length;
    const totalTime = history.reduce((sum, entry) => sum + entry.timeTaken, 0);
    const totalAccuracy = history.reduce((sum, entry) => sum + entry.accuracy, 0);
    const averageAccuracy = totalAccuracy / totalSessions;
    
    // Calculate body part distribution
    const bodyPartDistribution = history.reduce((acc, entry) => {
      acc[entry.bodyPart] = (acc[entry.bodyPart] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate exercise type distribution
    const exerciseTypeDistribution = history.reduce((acc, entry) => {
      acc[entry.exerciseType] = (acc[entry.exerciseType] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalSessions,
      totalTime,
      averageAccuracy,
      bodyPartDistribution,
      exerciseTypeDistribution,
    };
  } catch (error) {
    console.error('Error calculating exercise statistics:', error);
    return {
      totalSessions: 0,
      totalTime: 0,
      averageAccuracy: 0,
      bodyPartDistribution: {},
      exerciseTypeDistribution: {},
    };
  }
}; 