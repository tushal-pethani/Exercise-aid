import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import profileImage from '../utils/profileImage';

// Import screens
import ClientHomeScreen from '../components/client/ClientHomeScreen';
import PhysioHomeScreen from '../components/physio/PhysioHomeScreen';
import ProfileScreen from '../components/profile/ProfileScreen';
import ConnectionsScreen from '../components/connections/ConnectionsScreen';
import SettingsScreen from '../components/settings/SettingsScreen';
import CreateCustomTask from '../components/client/CreateCustomTask';
import AssignedExercises from '../components/client/AssignedExercises';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Client Stack Navigator (including home and task screens)
const ClientStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen 
      name="ClientHome" 
      component={ClientHomeScreen} 
    />
    <Stack.Screen 
      name="CreateCustomTask" 
      component={CreateCustomTask} 
    />
    <Stack.Screen 
      name="AssignedExercises" 
      component={AssignedExercises} 
    />
  </Stack.Navigator>
);

// Custom drawer content
const CustomDrawerContent = (props) => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props}>
        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={profileImage} 
            style={styles.profileImage} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Text style={styles.role}>
              {user?.role === 'client' ? 'Client' : 'Physiotherapist'}
            </Text>
          </View>
        </View>
        
        {/* Drawer Items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'AuthStack' }],
          });
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: COLORS.secondary,
        drawerActiveTintColor: COLORS.white,
        drawerInactiveTintColor: COLORS.text,
        drawerLabelStyle: {
          marginLeft: 10,
          fontSize: SIZES.medium,
        },
        drawerStyle: {
          paddingTop: SIZES.padding * 2, // Add padding to the drawer
        },
      }}
    >
      {isClient ? (
        // Client Routes
        <>
          <Drawer.Screen 
            name="Home" 
            component={ClientStackNavigator} 
            options={{
              title: 'Home',
              drawerIcon: ({color}) => (
                <Text style={{fontSize: 24, color}}>🏠</Text>
              ),
            }}
          />
        </>
      ) : (
        // Physio Routes
        <>
          <Drawer.Screen 
            name="PhysioHome" 
            component={PhysioHomeScreen} 
            options={{
              title: 'Dashboard',
              drawerIcon: ({color}) => (
                <Text style={{fontSize: 24, color}}>📊</Text>
              ),
            }}
          />
        </>
      )}
      
      {/* Common Routes */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>👤</Text>
          ),
        }}
      />
      
      <Drawer.Screen 
        name="Connections" 
        component={ConnectionsScreen}
        options={{
          drawerIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>👥</Text>
          ),
        }}
      />
      
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>⚙️</Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileHeader: {
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderColor: "#60A63A",
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  role: {
    fontSize: SIZES.small,
    marginTop:10,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 40,
    paddingLeft: 30,
    fontWeight: 'bold',
  },
  logoutText: {
    fontSize: SIZES.medium,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: 5,
  },
});

export default DrawerNavigator; 