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

// Replace with your own bot's avatar or comment it out if you don't have an image
import MEE6 from '../assets/MEE6.png';

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
          avatar: MEE6,
        },
      },
    ]);
  }, []);

  // 2. The function that calls Cohere’s API
  const fetchBotResponse = async (userMessage) => {
    try {
      // We prepend a "system" or "role" style instruction so the chatbot stays on topic
      // This approach ensures the model understands the fitness context each time.
      const systemInstruction = `
You are a helpful chatbot specialized in fitness, gym routines, calisthenics, and nutrition.
The user will ask you questions or chat with you only about these topics. 
If they ask about anything else, politely remind them this conversation is for fitness-related topics only.

User: ${userMessage}
Bot:
      `;

      // Send the combined prompt to Cohere
      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          model: 'command-xlarge',
          prompt: systemInstruction,
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `YOUR_API_KEY`, // Replace with your actual API key
            'Content-Type': 'application/json',
          },
        }
      );

      // Cohere's text output is in "generations[0].text"
      const botReply = response.data.generations[0].text.trim();
      return botReply;
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
              avatar: MEE6,
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
