const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../config/jwt');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check if email/username is taken
    const checkUser = await pool.query(
      `SELECT "ID" FROM "User" WHERE "Email" = $1 OR "Username" = $2`,
      [email, username]
    );
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username is already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO "User" ("FirstName", "LastName", "Username", "Email", "Password")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "ID"
    `;
    const result = await pool.query(insertQuery, [
      firstName,
      lastName,
      username,
      email,
      hashedPassword,
    ]);
    const newUser = result.rows[0];

    // Generate token for immediate login
    const token = generateToken(newUser.ID);
    return res.status(201).json({
      message: 'User created successfully',
      userId: newUser.ID,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// SIGNIN
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userQuery = await pool.query(`SELECT * FROM "User" WHERE "Email" = $1`, [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = userQuery.rows[0];
    // Compare hashed password
    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.ID);
    return res.status(200).json({
      message: 'Login successful',
      userId: user.ID,
      token,
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
