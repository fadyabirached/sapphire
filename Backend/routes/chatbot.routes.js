const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const COHERE_URL = 'https://api.cohere.ai/v1/generate';

const SYSTEM_INSTRUCTION = `You are a helpful chatbot specialized in fitness, gym routines, calisthenics, and nutrition.
The user will ask you questions or chat with you only about these topics.
If they ask about anything else, politely remind them this conversation is for fitness-related topics only.`;

// POST /chatbot — proxies fitness-bot questions to Cohere so the API key
// never ships inside the mobile app bundle.
router.post('/chatbot', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!COHERE_API_KEY) {
    console.error('Chatbot is not configured: set COHERE_API_KEY.');
    return res.status(500).json({ error: 'Chatbot is not configured.' });
  }

  try {
    const response = await axios.post(
      COHERE_URL,
      {
        model: 'command-xlarge',
        prompt: `${SYSTEM_INSTRUCTION}\n\nUser: ${message}\nBot:`,
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.generations[0].text.trim();
    return res.json({ reply });
  } catch (error) {
    console.error('Cohere chatbot error:', error.response?.data || error.message);
    return res.status(502).json({ error: 'Chatbot is temporarily unavailable.' });
  }
});

module.exports = router;
