import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const ProfileScreen = () => {
  // State fields from DB
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [rank, setRank] = useState('');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [rankModalVisible, setRankModalVisible] = useState(false);

  // Temporary new values for editing
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');

  const navigation = useNavigation();

  // Rank color mapping
  const rankColors = {
    Beginner: '#4CAF50',
    Intermediate: '#FF9800',
    Advanced: '#F44336',
    Elite: '#9C27B0',
  };

  const isMountedRef = React.useRef(true);

  // 1) Load profile on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadUserProfile();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      // No token needed if your GET /profile/:userId is public
      // (But if it's protected, you should add Authorization header too)
      const response = await fetch(`${BASE_URL}/profile/${userId}`);
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (response.ok) {
        setUsername(data.Username || '');
        setBio(data.Bio || '');
        setRank(data.Rank || '');
        setProfileImage(data.ProfileURL || null);
      } else {
        console.log('Failed to load profile:', data.error);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  // 2) Update text fields via JSON
  // If you want to update only username/bio/rank in the same route:
  const updateProfileField = async (fields = {}) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const response = await fetch(`${BASE_URL}/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        if ('Username' in data.user) setUsername(data.user.Username);
        if ('Bio' in data.user) setBio(data.user.Bio);
        if ('Rank' in data.user) setRank(data.user.Rank);
        if ('ProfileURL' in data.user) setProfileImage(data.user.ProfileURL);
      } else {
        console.log('Profile update error:', data.error);
      }
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  };

  // 3) Upload actual profile picture (multipart)
  const uploadProfilePicture = async (localUri) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Not Authenticated', 'Please log in first.');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: localUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await fetch(`${BASE_URL}/profile/${userId}/picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        console.log('Profile picture updated:', data.profileURL);
        setProfileImage(data.profileURL);
      } else {
        console.log('Error updating profile pic:', data.error);
      }
    } catch (error) {
      console.log('Error uploading profile pic:', error);
    }
  };

  // =========== IMAGE PICKER LOGIC ===========
  const handleImageSelection = async () => {
    Alert.alert('Select Profile Picture', 'Choose an option', [
      { text: 'Take a Photo', onPress: handleTakePhoto },
      { text: 'Choose from Gallery', onPress: handlePickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos...');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);  // local preview
      uploadProfilePicture(uri); // actual file upload
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera...');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      uploadProfilePicture(uri);
    }
  };

  // Remove existing profile image
  const resetProfileImage = async () => {
    setProfileImage(null);
    // optional call if you want to set "ProfileURL"=null in DB
    updateProfileField({ profileURL: null });
  };

  // =========== Edit Username (Nickname) ===========
  const [modalVisibleNickname, setModalVisibleNickname] = useState(false);

  const openEditNicknameModal = () => {
    setNewUsername(username);
    setModalVisibleNickname(true);
  };

  const saveUsername = () => {
    if (newUsername.length > 12) {
      Alert.alert('Username too long', 'Max 12 characters.');
      return;
    }
    setUsername(newUsername);
    setModalVisibleNickname(false);
    // partial update for username
    updateProfileField({ username: newUsername });
  };

  // =========== Edit/Add Bio ===========
  const openEditBioModal = () => {
    setNewBio(bio);
    setBioModalVisible(true);
  };

  const saveBio = () => {
    setBio(newBio);
    setBioModalVisible(false);
    updateProfileField({ bio: newBio });
  };

  // =========== Rank Selection ===========
  const handleSelectRank = (selectedRank) => {
    setRank(selectedRank);
    setRankModalVisible(false);
    updateProfileField({ rank: selectedRank });
  };

  // =========== LOGOUT ===========
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Clear local storage or only userId + authToken
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('authToken');
          navigation.replace('SignIn');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Profile Image + Edit */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={handleImageSelection}>
          <View style={styles.profileEditContainer}>
            <Text style={styles.profileText}>Tap to Edit Profile Picture</Text>
            <Ionicons name="create-outline" size={16} color="#2C4F83" style={styles.editIcon} />
          </View>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={290} color="#D9D9D9" />
          )}
        </TouchableOpacity>
        {profileImage && (
          <TouchableOpacity style={styles.resetButton} onPress={resetProfileImage}>
            <Ionicons name="close-circle" size={30} color="#FF0000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Username + Rank */}
      <View style={styles.nicknameContainer}>
        <Text style={styles.nickname}>{username}</Text>
        {rank ? (
          <View style={[styles.rankTag, { backgroundColor: rankColors[rank] }]}>
            <Text style={styles.rankTagText}>{rank}</Text>
          </View>
        ) : null}
      </View>

      {/* Bio */}
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {/* Edit Username */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2C4F83' }]} onPress={openEditNicknameModal}>
          <Octicons name="pencil" size={28} color="#FFFFFF" style={styles.actionIconTop} />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Edit Username</Text>
        </TouchableOpacity>

        {/* Edit/Add Bio */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2C4F83' }]} onPress={openEditBioModal}>
          <Ionicons name="document-text-outline" size={28} color="#FFFFFF" style={styles.actionIconTop} />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>{bio ? 'Edit Bio' : 'Add Bio'}</Text>
        </TouchableOpacity>

        {/* Select Rank */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2C4F83' }]} onPress={() => setRankModalVisible(true)}>
          <Ionicons name="trophy-outline" size={28} color="#FFFFFF" style={styles.actionIconTop} />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>{rank ? 'Edit Rank' : 'Add Rank'}</Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2C4F83' }]} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={28} color="#FFFFFF" style={styles.actionIconTop} />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Settings</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#A52A2A' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#FFFFFF" style={styles.actionIconTop} />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Username Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisibleNickname} onRequestClose={() => setModalVisibleNickname(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter new username"
              placeholderTextColor="black"
              value={newUsername}
              onChangeText={setNewUsername}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveUsername}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisibleNickname(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bio Modal */}
      <Modal animationType="slide" transparent={true} visible={bioModalVisible} onRequestClose={() => setBioModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{bio ? 'Edit Bio' : 'Add Bio'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your bio"
              placeholderTextColor="black"
              value={newBio}
              onChangeText={setNewBio}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveBio}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setBioModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rank Modal */}
      <Modal animationType="slide" transparent={true} visible={rankModalVisible} onRequestClose={() => setRankModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>What's your current fitness level?</Text>
            <View style={styles.rankChoices}>
              {Object.keys(rankColors).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.rankChoice, { backgroundColor: rankColors[item] }]}
                  onPress={() => handleSelectRank(item)}
                >
                  <Text style={styles.rankChoiceText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setRankModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;

/* ============ STYLES ============ */
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    marginTop: 1,
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginTop: 15,
    resizeMode: 'cover',
  },
  profileEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    position: 'absolute',
    top: 95,
    right: 25,
    borderRadius: 15,
    padding: 5,
  },
  profileText: {
    marginTop: 55,
    fontSize: 14,
    color: '#2C4F83',
  },
  editIcon: {
    marginLeft: 5,
    marginTop: 55,
  },
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  nickname: {
    fontSize: 40,
    color: '#2C4F83',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  rankTag: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
  },
  rankTagText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bio: {
    fontSize: 16,
    color: '#2C4F83',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 15,
  },
  actionButton: {
    width: '45%',
    aspectRatio: 1.4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 2,
  },
  actionIconTop: {
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C4F83',
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: 'black',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#2C4F83',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#A52A2A',
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 15,
  },
  rankChoice: {
    width: '40%',
    margin: 5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rankChoiceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
