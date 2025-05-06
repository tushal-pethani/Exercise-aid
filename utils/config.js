// Configuration settings for the app

// Base API URL - Using the same URL found in api.js
export const API_URL = process.env.API_URL || 'http://172.20.10.5:3000/api';

// Other configuration settings can be added here
export const APP_VERSION = '1.0.0';
export const DEFAULT_TIMEOUT = 10000; // 10 seconds

export default {
  API_URL,
  APP_VERSION,
  DEFAULT_TIMEOUT
}; 