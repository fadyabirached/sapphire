import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  SafeAreaView,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

// Replace with your own bot's avatar or comment it out if you don't have an image
import MEE6 from '../assets/MEE6.png';

// On native, `require(...)` resolves to a numeric asset ID; on web it resolves
// to a { uri, width, height } object instead. react-native-gifted-chat's
// avatar renderer only handles string/number, so on web it silently renders
// nothing unless we unwrap the uri ourselves.
const BOT_AVATAR = typeof MEE6 === 'object' && MEE6?.uri ? MEE6.uri : MEE6;

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);

  // 1. Initialize with a fitness-themed greeting from the bot
  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: "Hey there! I'm your Fitness Bot. Ask me anything about workouts, gym routines, calisthenics, or nutrition, and I'll do my best to help!",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Fitness Bot',
          avatar: BOT_AVATAR,
        },
      },
    ]);
  }, []);

  // 2. Ask the backend's /chatbot endpoint, which proxies to Cohere. The
  // Cohere API key stays server-side and never ships inside the app bundle.
  const fetchBotResponse = async (userMessage) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL}/chatbot`,
        { message: userMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.reply;
    } catch (error) {
      console.error(
        'Error fetching bot response:',
        error.response ? error.response.data : error.message
      );
      return 'Oops! Something went wrong.';
    }
  };

  // 3. Called when the user sends a message
  const onSend = useCallback(
    async (newMessages = []) => {
      // Update local state to show user's message
      setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));

      // Get the user's text
      const userMessage = newMessages[0]?.text;
      if (!userMessage) return;

      // Call Cohere to get the bot's reply
      const botResponse = await fetchBotResponse(userMessage);

      // Append the bot's reply to the chat
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: Math.random().toString(),
            text: botResponse,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Fitness Bot',
              avatar: BOT_AVATAR,
            },
          },
        ])
      );
    },
    [messages]
  );

  // 4. (Optional) Customize the InputToolbar, Send button, and Bubble
  const renderInputToolbar = (props) => (
    <InputToolbar {...props} containerStyle={styles.inputToolbar} />
  );

  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendButtonContainer}>
        <Text style={styles.sendButtonText}>Send</Text>
      </View>
    </Send>
  );

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: styles.bubbleLeft,
        right: styles.bubbleRight,
      }}
      textStyle={{
        left: styles.textLeft,
        right: styles.textRight,
      }}
    />
  );

  // 5. Render the GiftedChat interface
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -700 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={(msgs) => onSend(msgs)}
          user={{ _id: 1 }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatbotScreen;

// Basic styling
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#d9d9d9',
    paddingHorizontal: 10,
    paddingBottom: 0,
  },
  sendButtonContainer: {
    marginRight: 1,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#2C4F83',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bubbleLeft: {
    backgroundColor: '#D9D9D9', // left bubble color
  },
  bubbleRight: {
    backgroundColor: '#2C4F83', // right bubble color
  },
  textLeft: {
    color: '#000', // left text color
  },
  textRight: {
    color: '#fff', // right text color
  },
});
