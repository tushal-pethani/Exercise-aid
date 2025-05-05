import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
// We'll add back the import once the linking is fixed
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SplashScreen from '../components/SplashScreen';
import LoginScreen from '../components/auth/LoginScreen';
import RegisterScreen from '../components/auth/RegisterScreen';
import DeviceScanScreen from '../components/DeviceScanScreen';
import ExerciseStartScreen from '../components/ExerciseStartScreen';
import ExerciseScreen from '../components/ExerciseScreen';
import VisualizationScreen from '../components/VisualizationScreen';
import RequestsList from '../components/requests/RequestsList';
import SendRequestScreen from '../components/requests/SendRequestScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Exercise Stack
const ExerciseStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DeviceScan" 
      options={{ 
        title: 'Connect Device',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.black,
      }}
    >
      {props => <DeviceScanScreen {...props} onDeviceConnect={(device) => {
        props.navigation.navigate('ExerciseStart', { device });
      }} />}
    </Stack.Screen>
    <Stack.Screen 
      name="ExerciseStart" 
      component={ExerciseStartScreen}
      options={{ 
        title: 'Prepare Exercise',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.black,
      }}
    />
    <Stack.Screen 
      name="Exercise" 
      component={ExerciseScreen}
      options={{ 
        title: 'Exercise',
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="Visualization" 
      component={VisualizationScreen}
      options={{ 
        title: '3D Visualization',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.black,
      }}
    />
  </Stack.Navigator>
);

// Requests Stack
const RequestsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="RequestsList" 
      component={RequestsList}
      options={{ 
        title: 'Connection Requests',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.black,
      }}
    />
    <Stack.Screen 
      name="SendRequest" 
      component={SendRequestScreen}
      options={{ 
        title: 'Find Connections',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.black,
      }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: COLORS.secondary,
      tabBarInactiveTintColor: COLORS.inactive,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: '#E0E0E0',
        paddingTop: 5,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="ExerciseTab"
      component={ExerciseStack}
      options={{
        tabBarLabel: 'Exercise',
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 20 }}>💪</Text>
        ),
      }}
    />
    <Tab.Screen
      name="RequestsTab"
      component={RequestsStack}
      options={{
        tabBarLabel: 'Connections',
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 20 }}>👥</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // If splash screen should auto-hide (e.g., after auth loading)
    if (!authLoading && isSplashVisible) {
      const timer = setTimeout(() => {
        setIsSplashVisible(false);
      }, 1000); // Give a small buffer after auth loads
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isSplashVisible]);

  if (isSplashVisible) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator; 