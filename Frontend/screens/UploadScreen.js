import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Keyboard,
  ScrollView,
  Pressable, // Import Pressable instead
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { appendImageToFormData } from '../utils/uploadFile';

const UploadScreen = () => {
  // User data state (fetched from backend)
  const [userName, setUserName] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);

  // State for post content
  const [postText, setPostText] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);

  // =========================
  // Fetch user profile on mount
  // =========================
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');
        if (!token || !userId) {
          return;
        }

        // fetch the user's profile
        const response = await fetch(`${BASE_URL}/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!isMounted) return;

        if (response.ok) {
          // set user name + profile image from DB
          setUserName(data.Username || '');
          setUserProfileImage(data.ProfileURL || null);
        } else {
          console.log('Error fetching profile:', data.error);
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // IMAGE PICKER LOGIC
  // =========================
  const handleImageSelection = () => {
    // Alert.alert has no web implementation (react-native-web's Alert is a
    // no-op), so the action-sheet menu never appears there. Go straight to
    // the gallery picker on web instead of silently doing nothing.
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }
    Alert.alert('Upload Image', 'Choose an option', [
      { text: 'Take a Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handlePickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  // Delete selected image
  const handleDeleteImage = () => {
    setUploadedImage(null);
  };

  // =========================
  // SUBMIT POST FUNCTION
  // =========================
  const handleSubmitPost = async () => {
    if (!postText.trim() && !uploadedImage) {
      Alert.alert('Error', 'You must write something or upload an image!');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Not Authenticated', 'Please log in first!');
        return;
      }

      // Build form data for the post
      const formData = new FormData();
      formData.append('text', postText);
      if (uploadedImage) {
        await appendImageToFormData(formData, 'image', uploadedImage, 'upload.jpg');
      }

      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here: fetch needs to generate it itself
          // (multipart/form-data; boundary=...) from the FormData body. A
          // manual value with no boundary makes the server's multipart
          // parser crash with "Boundary not found".
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Post Submitted!', 'Your post has been created successfully.');
        console.log('Created post:', data.post);
        // Reset fields
        setPostText('');
        setUploadedImage(null);
      } else {
        Alert.alert('Error', data.error || 'Unable to create post');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert('Error', 'Something went wrong while creating post');
    }
  };

  // =========================
  // RENDER UI
  // =========================
  return (
    // Use Pressable to dismiss keyboard
    <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Guidelines Card */}
        <Card style={styles.guidelinesCard}>
          <Card.Content>
            <View style={styles.guidelinesHeader}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#2C4F83"
              />
              <Text style={styles.guidelinesTitle}>Posting Guidelines</Text>
            </View>
            <Text style={styles.guidelinesText}>
              - Main topic for posts is fitness.{"\n"}
              - Gym, calisthenics, nutrition, etc...{"\n"}
              - Be respectful to others.{"\n"}
              - Avoid sharing personal info or spam.{"\n"}
              - Excessive off-topic content may be removed.{"\n"}
              - ATTENTION: BEWARE ANTI-SPAM SYSTEM! :]
            </Text>
          </Card.Content>
        </Card>

        {/* Main Post Card */}
        <Card style={styles.cardContainer}>
          <Card.Content>
            {/* Header: Display Actual User Info */}
            <TouchableOpacity>
              <View style={styles.header}>
                {userProfileImage ? (
                  <Image source={{ uri: userProfileImage }} style={styles.profileImage} />
                ) : (
                  <Ionicons name="person-circle" size={50} color="#D9D9D9" />
                )}
                <Text style={styles.userName}>{userName || 'User'}</Text>
              </View>
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="What's your fitness update?"
              multiline
              value={postText}
              onChangeText={setPostText}
            />

            {/* Image Preview */}
            {uploadedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: uploadedImage }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.deleteIcon} onPress={handleDeleteImage}>
                  <Ionicons name="close-circle" size={24} color="#FF0000" />
                </TouchableOpacity>
              </View>
            )}

            {/* Buttons */}
            <TouchableOpacity style={styles.uploadButton} onPress={handleImageSelection}>
              <Ionicons name="image-outline" size={24} color="#2C4F83" />
              <Text style={styles.uploadButtonText}>Add Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitPost}>
              <Ionicons name="send-outline" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Post</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </Pressable>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  guidelinesCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    elevation: 2,
    padding: 15,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  guidelinesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C4F83',
    marginLeft: 10,
  },
  guidelinesText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 30,
  },
  cardContainer: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C4F83',
  },
  textInput: {
    height: 100,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    // resizeMode: 'cover', is now a prop, not a style for web compatibility
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 45,
    padding: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#2C4F83',
    marginLeft: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C4F83',
    borderRadius: 45,
    padding: 15,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 10,
  },
});