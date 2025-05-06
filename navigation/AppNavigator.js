import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from '../components/SplashScreen';
import LoginScreen from '../components/auth/LoginScreen';
import RegisterScreen from '../components/auth/RegisterScreen';
import DeviceScanScreen from '../components/DeviceScanScreen';
import ExerciseStartScreen from '../components/ExerciseStartScreen';
import ExerciseScreen from '../components/ExerciseScreen';
import VisualizationScreen from '../components/VisualizationScreen';
import SendRequestScreen from '../components/requests/SendRequestScreen';
import SearchPhysioScreen from '../components/requests/SearchPhysioScreen';
import SearchClientScreen from '../components/physio/SearchClientScreen';
import RequestsScreen from '../components/requests/RequestsScreen';
import PhysioRequestsScreen from '../components/physio/PhysioRequestsScreen';
import DrawerNavigator from './DrawerNavigator';
import CreateExercise from '../components/physio/CreateExercise';
import ManageClients from '../components/physio/ManageClients';
import ClientProfileScreen from '../components/physio/ClientProfileScreen';
import AssignExerciseScreen from '../components/physio/AssignExerciseScreen';
import ChatScreen from '../components/chat/ChatScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const Stack = createStackNavigator();

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
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background }
    }}
  >
    <Stack.Screen 
      name="DeviceScan" 
      component={DeviceScanScreen}
    />
    <Stack.Screen 
      name="ExerciseStart" 
      component={ExerciseStartScreen}
    />
    <Stack.Screen 
      name="Exercise" 
      component={ExerciseScreen}
    />
    <Stack.Screen 
      name="Visualization" 
      component={VisualizationScreen}
    />
  </Stack.Navigator>
);

// Main Stack (including Drawer and other screens)
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
    <Stack.Screen name="ExerciseStack" component={ExerciseStack} />
    <Stack.Screen 
      name="SendRequest" 
      component={SendRequestScreen}
      options={{ 
        headerShown: true,
        title: 'Find Connections',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.text,
      }}
    />
    <Stack.Screen 
      name="SearchPhysio" 
      component={SearchPhysioScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="SearchClient" 
      component={SearchClientScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="Requests" 
      component={RequestsScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="PhysioRequests" 
      component={PhysioRequestsScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="CreateExercise" 
      component={CreateExercise}
      options={{ 
        headerShown: true,
        title: 'Create Exercise',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.text,
      }}
    />
    <Stack.Screen 
      name="ManageClients" 
      component={ManageClients}
      options={{ 
        headerShown: true,
        title: 'Manage Clients',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.text,
      }}
    />
    <Stack.Screen 
      name="ClientProfile" 
      component={ClientProfileScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="AssignExercise" 
      component={AssignExerciseScreen}
      options={{ 
        headerShown: false,
      }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ 
        headerShown: false,
      }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Auto-hide splash after auth loading
    if (!authLoading && isSplashVisible) {
      const timer = setTimeout(() => {
        setIsSplashVisible(false);
      }, 1500); // Slightly longer to ensure smooth transition
      
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
    <SafeAreaProvider initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 }
    }}>
    <NavigationContainer>
        {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
    </SafeAreaProvider>
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