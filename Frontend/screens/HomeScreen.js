import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const HomeScreen = () => {
  const [posts, setPosts] = useState([]); // posts from DB
  const [refreshing, setRefreshing] = useState(false);

  // Fullscreen image
  const [selectedImage, setSelectedImage] = useState(null);
  const [scale, setScale] = useState(1);

  // For displaying user profile info
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null); // { Username, ProfileURL, Bio, Rank }

  const lastTapRef = useRef(null); // For double-tap detection
  const isMountedRef = useRef(true);

  // ---------------------------
  // Load posts on mount
  // ---------------------------
  useEffect(() => {
    isMountedRef.current = true;
    fetchPosts();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---------------------------
  // Fetch posts from /posts
  // ---------------------------
  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        return;
      }

      const response = await fetch(`${BASE_URL}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (response.ok) {
        // data is an array of objects:
        // { post_id, userId, postText, postImage, likeCount, userName, userProfileImage, liked }
        setPosts(data);
      } else {
        console.log('Failed to fetch posts:', data.error);
      }
    } catch (err) {
      console.log('Error fetching posts:', err);
    }
  };

  // ---------------------------
  // Refresh handler
  // ---------------------------
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // ---------------------------
  // Toggle like + persist in DB
  // ---------------------------
  const toggleLike = async (postId, currentlyLiked) => {
    // 1) local UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.post_id === postId) {
          const newLiked = !currentlyLiked;
          const newLikeCount = newLiked
            ? post.likeCount + 1
            : Math.max(0, post.likeCount - 1);
          return { ...post, liked: newLiked, likeCount: newLikeCount };
        }
        return post;
      })
    );

    // 2) server update
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        return;
      }
      const action = currentlyLiked ? 'unlike' : 'like';
      const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok) {
        // revert UI if server call fails
        console.log('Like/unlike error:', data.error);
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.post_id === postId) {
              // revert
              const oldLikeCount = currentlyLiked
                ? post.likeCount + 1
                : post.likeCount - 1;
              return {
                ...post,
                liked: currentlyLiked,
                likeCount: oldLikeCount,
              };
            }
            return post;
          })
        );
      } else {
        console.log(`Server updated likes: new count = ${data.likeCount}`);
      }
    } catch (error) {
      console.log('Error toggling like:', error);
      // revert local UI on error
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.post_id === postId) {
            const oldLikeCount = currentlyLiked
              ? post.likeCount + 1
              : post.likeCount - 1;
            return {
              ...post,
              liked: currentlyLiked,
              likeCount: oldLikeCount,
            };
          }
          return post;
        })
      );
    }
  };

  // ---------------------------
  // Double tap => like
  // ---------------------------
  const handleDoubleTap = (postId, isCurrentlyLiked) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      toggleLike(postId, isCurrentlyLiked);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    lastTapRef.current = now;
  };

  // ---------------------------
  // Fullscreen image viewer
  // ---------------------------
  const openImageViewer = (imageUri) => {
    setSelectedImage(imageUri);
    setScale(1);
  };
  const closeImageViewer = () => {
    setSelectedImage(null);
  };
  const handlePinch = ({ nativeEvent }) => {
    setScale(nativeEvent.scale > 1 ? nativeEvent.scale : 1);
  };

  // ---------------------------
  // Fetch & display user profile
  // ---------------------------
  const handleUserProfilePress = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${BASE_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (response.ok) {
        // data might look like:
        // { ID, Username, Email, Bio, Rank, ProfileURL: "http://host/uploads/filename" }
        setProfileData(data);
        setProfileModalVisible(true);
      } else {
        console.log('Error fetching profile:', response.status, data.error);
      }
    } catch (error) {
      console.log('Network error in handleUserProfilePress:', error);
    }
  };

  // ---------------------------
  // Render a single post item
  // ---------------------------
  const renderPost = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => handleDoubleTap(item.post_id, item.liked)}
      style={styles.postContainer}
    >
      {/* Post Header */}
      <View style={styles.postHeader}>
        {/* Tapping on the user avatar or name => show profile */}
        <TouchableOpacity
          onPress={() => {
            console.log('Avatar pressed. userId =', item.userId);
            // Regardless of whether userId is defined, let's call the function
            // so we can see logs if it's missing or fails
            handleUserProfilePress(item.userId);
          }}
          style={styles.headerLeft}
        >
          <Image
            source={{ uri: item.userProfileImage || undefined }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>
            {item.userName ? item.userName : 'User'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Post Text */}
      {item.postText ? (
        <Text style={styles.postText}>{item.postText}</Text>
      ) : null}

      {/* Post Image */}
      {item.postImage && (
        <TouchableOpacity onPress={() => openImageViewer(item.postImage)}>
          <Image source={{ uri: item.postImage }} style={styles.postImage} />
        </TouchableOpacity>
      )}

      {/* Like Button */}
      <View style={styles.likeContainer}>
        <TouchableOpacity
          onPress={() => toggleLike(item.post_id, item.liked)}
          style={styles.likeButton}
        >
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? '#FF0000' : '#333'}
          />
          <Text style={styles.likeCount}>{item.likeCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ---------------------------
  // Main render
  // ---------------------------
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(post) => String(post.post_id)}
        renderItem={renderPost}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={closeImageViewer}
        >
          <View style={styles.modalContainer}>
            <PinchGestureHandler onGestureEvent={handlePinch}>
              <Image
                source={{ uri: selectedImage }}
                style={[styles.fullScreenImage, { transform: [{ scale }] }]}
              />
            </PinchGestureHandler>
            <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Profile Modal (User Info) */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.profileModalBackdrop}>
          <View style={styles.profileModalContainer}>
            {profileData ? (
              <>
                {/* Show the user’s profile pic, or a fallback */}
                <Image
                  source={{ uri: profileData.ProfileURL || undefined }}
                  style={styles.profileModalImage}
                />

                <Text style={styles.profileModalUsername}>
                  {profileData.Username}
                </Text>

                {/* We can optionally display rank & bio if they exist */}
                {profileData.Rank && (
                  <Text style={styles.profileModalRank}>
                    Rank: {profileData.Rank}
                  </Text>
                )}
                {profileData.Bio && (
                  <Text style={styles.profileModalBio}>
                    {profileData.Bio}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.profileModalCloseButton}
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Text style={styles.profileModalCloseButtonText}>
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text>No profile data. (Check logs to see why.)</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C4F83',
  },
  postText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    bottom: 30,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },

  // Profile Modal
  profileModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  profileModalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#ccc',
  },
  profileModalUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C4F83',
    marginBottom: 6,
  },
  profileModalRank: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  profileModalBio: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileModalCloseButton: {
    backgroundColor: '#2C4F83',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  profileModalCloseButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
});
