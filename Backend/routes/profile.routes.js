const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Update profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profileURL, bio, rank, username } = req.body;

    // Check user
    const userQuery = await pool.query(`SELECT * FROM "User" WHERE "ID" = $1`, [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const current = userQuery.rows[0];

    const updatedProfileURL = profileURL !== undefined ? profileURL : current.ProfileURL;
    const updatedBio = bio !== undefined ? bio : current.Bio;
    const updatedRank = rank !== undefined ? rank : current.Rank;
    const updatedUsername = username !== undefined ? username : current.Username;

    const updateQuery = `
      UPDATE "User"
      SET "ProfileURL" = $1, "Bio" = $2, "Rank" = $3, "Username" = $4
      WHERE "ID" = $5
      RETURNING "ID", "Username", "Email", "ProfileURL", "Bio", "Rank"
    `;
    const result = await pool.query(updateQuery, [
      updatedProfileURL,
      updatedBio,
      updatedRank,
      updatedUsername,
      userId,
    ]);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `
      SELECT "ID", "Username", "Email", "ProfileURL", "Bio", "Rank"
      FROM "User"
      WHERE "ID" = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = result.rows[0];

    // Build full path if there's an image filename
    let fullProfileURL = null;
    if (user.ProfileURL) {
      fullProfileURL = `${req.protocol}://${req.get('host')}/uploads/${user.ProfileURL}`;
    }

    return res.status(200).json({
      ID: user.ID,
      Username: user.Username,
      Email: user.Email,
      Bio: user.Bio,
      Rank: user.Rank,
      ProfileURL: fullProfileURL,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture
router.put('/:userId/picture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Make sure user exists
    const userCheck = await pool.query(`SELECT "ID" FROM "User" WHERE "ID" = $1`, [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const filename = req.file.filename;
    const updateQuery = `
      UPDATE "User"
      SET "ProfileURL" = $1
      WHERE "ID" = $2
      RETURNING "ID", "ProfileURL"
    `;
    await pool.query(updateQuery, [filename, userId]);

    const fullURL = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    return res.json({
      message: 'Profile picture updated',
      profileURL: fullURL,
    });
  } catch (err) {
    console.error('Profile picture update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /profile/:userId/email — change e-mail (auth required)
router.put('/:userId/email', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newEmail = '' } = req.body;

    if (req.userId !== parseInt(userId))
      return res.status(403).json({ error: 'Forbidden' });

    if (!newEmail.trim())
      return res.status(400).json({ error: 'newEmail is required' });

    // Make sure address isn't already taken
    const clash = await pool.query(
      'SELECT 1 FROM "User" WHERE "Email" = $1 AND "ID" <> $2',
      [newEmail, userId]
    );
    if (clash.rowCount)
      return res.status(409).json({ error: 'E-mail already in use' });

    await pool.query(
      'UPDATE "User" SET "Email" = $1 WHERE "ID" = $2',
      [newEmail, userId]
    );
    res.json({ message: 'E-mail updated' });
  } catch (err) {
    console.error('Email change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /profile/:userId/password — change password (auth required)
router.post('/:userId/password', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword = '' } = req.body;

    if (req.userId !== parseInt(userId))
      return res.status(403).json({ error: 'Forbidden' });

    // Grab current hash
    const { rows } = await pool.query(
      'SELECT "Password" FROM "User" WHERE "ID" = $1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(oldPassword || '', rows[0].Password);
    if (!match) return res.status(401).json({ error: 'Old password incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE "User" SET "Password" = $1 WHERE "ID" = $2',
      [hash, userId]
    );
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
