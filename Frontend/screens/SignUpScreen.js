import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { BASE_URL } from '../config';

const SignUpScreen = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Field states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states
  const [globalError, setGlobalError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const handleSignUp = async () => {
    // Clear previous error messages
    setGlobalError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let valid = true;

    // Local validations
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      setGlobalError("All fields must be filled out.");
      valid = false;
    }

    if (email && !email.includes('@')) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (password && password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }

    if (!valid) return;

    try {
      // Make the network request to your backend
      const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 1) Store userId
        if (data.userId) {
          await AsyncStorage.setItem('userId', String(data.userId));
        }

        // 2) Store token (so the user is immediately authenticated)
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        } else {
          console.warn('No token received from backend');
        }

        // 3) Navigate to the main screen (e.g., MainDrawer)
        navigation.navigate('MainDrawer');
      } else {
        setGlobalError(data.error || 'An error occurred during signup');
      }
    } catch (error) {
      console.error('Network error:', error);
      setGlobalError('Unable to connect to the server.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} disabled={Platform.OS === 'web'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={{ height: 100 }} />

          <Text style={styles.appName}>SAPPHIRE</Text>

          <Image
            source={require('../assets/SapphireFYPlogo.png')}
            style={styles.logo}
          />

          <Text style={styles.signUpText}>Sign Up</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor="#D9D9D9"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              placeholderTextColor="#D9D9D9"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#D9D9D9"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#D9D9D9"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#D9D9D9"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIconContainer}
              >
                <Ionicons
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={24}
                  color="#2C4F83"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm your password"
                placeholderTextColor="#D9D9D9"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                style={styles.eyeIconContainer}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                  size={24}
                  color="#2C4F83"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {globalError ? (
            <Text style={styles.errorText}>{globalError}</Text>
          ) : null}

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.signInText} onPress={() => navigation.navigate('SignIn')}>
              Sign In
            </Text>
          </Text>

          <View style={{ height: 100 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 234,
    height: 301,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C4F83',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
    fontFamily: 'Faustina',
  },
  signUpText: {
    fontSize: 32,
    color: '#2C4F83',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '90%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#2C4F83',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 25,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#2C4F83',
    backgroundColor: '#D9D9D9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 10,
  },
  signUpButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#2C4F83',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 25,
    textAlign: 'center',
    fontSize: 14,
    color: '#2C4F83',
  },
  signInText: {
    fontWeight: 'bold',
    color: '#2C4F83',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SignUpScreen;
