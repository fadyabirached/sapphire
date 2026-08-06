const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const spamCheckHF = require('../middleware/spamCheckHF');

const router = express.Router();

// Create a post (with AI spam/NSFW check on the uploaded image)
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  spamCheckHF,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { text } = req.body;

      const imageFilename = req.file ? req.file.filename : null;

      const postResult = await pool.query(
        `INSERT INTO "Post" ("Text", "ImageURL")
         VALUES ($1, $2)
         RETURNING "Post_ID", "Text", "ImageURL", "Likes", "DateTime"`,
        [text || '', imageFilename]
      );
      const newPost = postResult.rows[0];

      // Link user to post
      await pool.query(
        `INSERT INTO "Posts" ("ID", "Post_ID") VALUES ($1, $2)`,
        [userId, newPost.Post_ID]
      );

      res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
      console.error('Error in POST /posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all posts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT p."Post_ID"  AS "post_id",
             p."Text"     AS "postText",
             p."ImageURL" AS "postImageFilename",
             p."Likes"    AS "likeCount",
             p."DateTime" AS "dateTime",
             u."ID"       AS "userId",
             u."Username" AS "userName",
             u."ProfileURL" AS "userProfileFilename"
        FROM "Post"  p
        JOIN "Posts" ps ON ps."Post_ID" = p."Post_ID"
        JOIN "User"  u  ON u."ID"       = ps."ID"
       ORDER BY p."DateTime" DESC`;
    const result = await pool.query(query);

    const posts = result.rows.map(r => ({
      post_id: r.post_id,
      postText: r.postText || '',
      postImage: r.postImageFilename
        ? `${req.protocol}://${req.get('host')}/uploads/${r.postImageFilename}`
        : null,
      likeCount: r.likeCount || 0,
      dateTime: r.dateTime,
      userId: r.userId,
      userName: r.userName,
      userProfileImage: r.userProfileFilename
        ? `${req.protocol}://${req.get('host')}/uploads/${r.userProfileFilename}`
        : null,
      liked: false,
    }));
    res.json(posts);
  } catch (err) {
    console.error('Error in GET /posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/unlike a post
router.put('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const postCheck = await pool.query(
      `SELECT "Likes" FROM "Post" WHERE "Post_ID" = $1`,
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    let currentLikes = postCheck.rows[0].Likes || 0;
    if (action === 'like') {
      currentLikes++;
    } else if (action === 'unlike') {
      currentLikes = Math.max(0, currentLikes - 1);
    }

    const update = await pool.query(
      `UPDATE "Post" SET "Likes" = $1 WHERE "Post_ID" = $2 RETURNING "Likes"`,
      [currentLikes, postId]
    );

    res.json({ message: 'Like updated', likeCount: update.rows[0].Likes });
  } catch (err) {
    console.error('Error in PUT /posts/:postId/like:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
