const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { SECRET_KEY } = require('../config/jwt');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// POST /admin/login
// Verifies the admin credentials against the server-side ADMIN_EMAIL /
// ADMIN_PASSWORD_HASH env vars and returns an admin-scoped JWT.
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      console.error('Admin login is not configured: set ADMIN_EMAIL and ADMIN_PASSWORD_HASH.');
      return res.status(500).json({ error: 'Admin login is not configured.' });
    }

    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '12h' });
    return res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats — total user count, total posts, total likes.
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const userCountQuery = await pool.query('SELECT COUNT(*) AS total_users FROM "User"');
    const postCountQuery = await pool.query('SELECT COUNT(*) AS total_posts FROM "Post"');
    const totalLikesQuery = await pool.query('SELECT SUM("Likes") AS total_likes FROM "Post"');

    const totalUsers = parseInt(userCountQuery.rows[0].total_users, 10);
    const totalPosts = parseInt(postCountQuery.rows[0].total_posts, 10);
    const totalLikes = parseInt(totalLikesQuery.rows[0].total_likes || 0, 10);

    return res.json({ totalUsers, totalPosts, totalLikes });
  } catch (error) {
    console.error('Error in GET /stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /getposts — all posts with user info, for moderation.
router.get('/getposts', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT
        p."Post_ID" AS "post_id",
        p."Text" AS "postText",
        p."ImageURL" AS "postImageFilename",
        p."Likes" AS "likeCount",
        p."DateTime" AS "dateTime",
        u."ID" AS "userId",
        u."Username" AS "userName",
        u."ProfileURL" AS "userProfileFilename"
      FROM "Post" p
      JOIN "Posts" ps ON ps."Post_ID" = p."Post_ID"
      JOIN "User" u ON u."ID" = ps."ID"
      ORDER BY p."DateTime" DESC
    `;
    const result = await pool.query(query);

    const posts = result.rows.map((row) => ({
      post_id: row.post_id,
      postText: row.postText || '',
      postImage: row.postImageFilename
        ? `${req.protocol}://${req.get('host')}/uploads/${row.postImageFilename}`
        : null,
      likeCount: row.likeCount || 0,
      dateTime: row.dateTime,
      userId: row.userId,
      userName: row.userName,
      userProfileImage: row.userProfileFilename
        ? `${req.protocol}://${req.get('host')}/uploads/${row.userProfileFilename}`
        : null,
    }));

    return res.json(posts);
  } catch (err) {
    console.error('Error in GET /getposts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /posts/:postId — remove a post (admin moderation).
router.delete('/posts/:postId', authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    const checkPost = await pool.query(
      `SELECT "Post_ID" FROM "Post" WHERE "Post_ID" = $1`,
      [postId]
    );
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await pool.query(`DELETE FROM "Posts" WHERE "Post_ID" = $1`, [postId]);
    await pool.query(`DELETE FROM "Post" WHERE "Post_ID" = $1`, [postId]);

    return res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
