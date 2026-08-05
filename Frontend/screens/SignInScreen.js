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

const SignInScreen = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Track if user has attempted to sign in
  const [submitted, setSubmitted] = useState(false);

  // Error states
  const [globalError, setGlobalError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSignIn = async () => {
    // Mark that we've attempted to sign in
    setSubmitted(true);

    // Clear previous error messages
    setGlobalError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;

    // Check for empty fields
    if (!email || !password) {
      setGlobalError("Email and password are required.");
      valid = false;
    }

    // Email validation
    if (email && !email.includes('@')) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    // Password validation
    if (password && password.length < 6) {
      setPasswordError("Password must include at least 6 characters.");
      valid = false;
    }

    // If validation fails, stop execution so error messages are displayed
    if (!valid) return;

    try {
      // Make a POST request to /signin
      const response = await fetch(`${BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Store userId in AsyncStorage
        await AsyncStorage.setItem('userId', String(data.userId));

        // 2. Store token in AsyncStorage (this is crucial!)
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        } else {
          console.warn('No token returned from server');
        }
        
        // Navigate to MainDrawer or your home screen
        navigation.navigate('MainDrawer');
      } else {
        setGlobalError(data.error || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      setGlobalError("Unable to connect to the server.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
        disabled={Platform.OS === 'web'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.appName}>SAPPHIRE</Text>

          <Image source={require('../assets/SapphireFYPlogo.png')} style={styles.logo} />

          <Text style={styles.signInText}>Sign In</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#D9D9D9"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {submitted && emailError ? (
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
            {submitted && passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          {submitted && globalError ? (
            <Text style={styles.errorText}>{globalError}</Text>
          ) : null}

          <Text style={styles.footerText}>
            Don’t have an account?{' '}
            <Text
              style={styles.signUpText}
              onPress={() => navigation.navigate('SignUp')}
            >
              Sign Up!
            </Text>
          </Text>
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
  signInText: {
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
  signInButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#2C4F83',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signInButtonText: {
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
  signUpText: {
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

export default SignInScreen;
