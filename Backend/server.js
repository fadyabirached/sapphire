require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const postsRoutes = require('./routes/posts.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const adminRoutes = require('./routes/admin.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // Serve images in /uploads

app.use('/', authRoutes);
app.use('/profile', profileRoutes);
app.use('/posts', postsRoutes);
app.use('/', marketplaceRoutes);
app.use('/', adminRoutes);
app.use('/', chatbotRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
