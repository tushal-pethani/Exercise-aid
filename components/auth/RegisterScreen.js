import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../../utils/theme';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState('');
  const { register, loading } = useAuth();

  const handleRegister = async () => {
    // Validate input
    if (!username || !email || !password || !confirmPassword || !age || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (isNaN(age) || parseInt(age) <= 0) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    // Attempt registration
    const userData = {
      username: username.trim(),
      email: email.trim(),
      password,
      age: parseInt(age),
      role: role.trim().toLowerCase()
    };

    console.log('Sending registration data:', JSON.stringify(userData));

    const result = await register(userData);
    if (!result.success) {
      Alert.alert('Registration Failed', result.error);
    }
  };

  const RoleOption = ({ title, value, icon, description }) => (
    <TouchableOpacity
      style={[
        styles.roleOption,
        role === value && styles.roleOptionSelected
      ]}
      onPress={() => setRole(value)}
    >
      <View style={styles.roleHeader}>
        <Text style={styles.roleIcon}>{icon}</Text>
        <Text style={[
          styles.roleTitle,
          role === value && styles.roleTitleSelected
        ]}>
          {title}
        </Text>
      </View>
      <Text style={styles.roleDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ImageBackground 
        source={require('../../assets/images/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>

            <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
                placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
                placeholderTextColor={COLORS.textSecondary}
          />
            </View>

            <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
                keyboardType="email-address"
            autoCapitalize="none"
                placeholderTextColor={COLORS.textSecondary}
          />
            </View>

            <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
                placeholderTextColor={COLORS.textSecondary}
          />
            </View>

            <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
                placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
                placeholderTextColor={COLORS.textSecondary}
          />
            </View>

            <View style={styles.inputContainer}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>I am a...</Text>
              <View style={styles.roleOptionsContainer}>
                <RoleOption
                  title="Client"
                  value="client"
                  icon="🏃"
                  description="I'm looking for exercise guidance and tracking"
                />
                <RoleOption
                  title="Physiotherapist"
                  value="physio"
                  icon="👨‍⚕️"
                  description="I want to monitor and guide clients"
                />
              </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.buttonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 2,
    ...SHADOWS.large,
  },
  formTitle: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.padding * 1.5,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    fontSize: SIZES.medium,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    fontSize: SIZES.medium,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionsContainer: {
    flexDirection: 'column',
    gap: SIZES.paddingSmall,
  },
  roleOption: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  roleOptionSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(50, 173, 94, 0.1)',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIcon: {
    fontSize: SIZES.large,
    marginRight: 8,
  },
  roleTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roleTitleSelected: {
    color: COLORS.secondary,
  },
  roleDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SIZES.padding,
    ...SHADOWS.small,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
  },
  footerText: {
    color: COLORS.text,
    marginRight: 5,
  },
  link: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 