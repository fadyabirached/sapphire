require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const spamCheckHF = require('./middleware/spamCheckHF');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // Serve images in /uploads

// ================== POSTGRES POOL ================== //
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Without this handler, an error on an idle client (e.g. dropped connection)
// is an unhandled 'error' event on the Pool's EventEmitter, which crashes the process.
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err);
});

// ================== JWT SETUP ================== //
const SECRET_KEY = process.env.JWT_SECRET || 'fallbackSecret';
function generateToken(userId) {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1d' });
}

// ================== AUTH MIDDLEWARE ================== //
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// ================== ADMIN AUTH ================== //
// Admin credentials live only in the server's environment (ADMIN_EMAIL /
// ADMIN_PASSWORD_HASH), never in client code, so they can't be read out of
// the Admin app's JS bundle.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    next();
  });
}

// ================== MULTER SETUP ================== //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

// ================== AUTH ROUTES ================== //

// SIGNUP
app.post('/signup', async (req, res) => {
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
app.post('/signin', async (req, res) => {
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

// ================== PROFILE ROUTES ================== //

// Update profile
app.put('/profile/:userId', async (req, res) => {
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
app.get('/profile/:userId', async (req, res) => {
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
app.put('/profile/:userId/picture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Optionally: if (req.userId !== parseInt(userId)) => res.status(403)...

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

// ================== POSTS ROUTES ================== //
// ---------- Create a post (with spam check) ----------
app.post(
  '/posts',
  authenticateToken,
  upload.single('image'),
  spamCheckHF,                // ← NEW middleware
  async (req, res) => {
    try {
      const userId   = req.userId;
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

// ---------- Get all posts ----------
app.get('/posts', authenticateToken, async (req, res) => {
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
      post_id:         r.post_id,
      postText:        r.postText || '',
      postImage:       r.postImageFilename
                         ? `${req.protocol}://${req.get('host')}/uploads/${r.postImageFilename}`
                         : null,
      likeCount:       r.likeCount || 0,
      dateTime:        r.dateTime,
      userId:          r.userId,
      userName:        r.userName,
      userProfileImage: r.userProfileFilename
                         ? `${req.protocol}://${req.get('host')}/uploads/${r.userProfileFilename}`
                         : null,
      liked: false
    }));
    res.json(posts);
  } catch (err) {
    console.error('Error in GET /posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/unlike a post
app.put('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    // 1) fetch current like count
    const postCheck = await pool.query(
      `SELECT "Likes" FROM "Post" WHERE "Post_ID" = $1`,
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 2) increment or decrement
    let currentLikes = postCheck.rows[0].Likes || 0;
    if (action === 'like') {
      currentLikes++;
    } else if (action === 'unlike') {
      currentLikes = Math.max(0, currentLikes - 1);
    }

    // 3) save back to the DB
    const update = await pool.query(
      `UPDATE "Post" SET "Likes" = $1 WHERE "Post_ID" = $2 RETURNING "Likes"`,
      [currentLikes, postId]
    );

    // 4) return new count
    res.json({ message: 'Like updated', likeCount: update.rows[0].Likes });
  } catch (err) {
    console.error('Error in PUT /posts/:postId/like:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ================== MARKETPLACE ROUTES ================== //

// Get products
app.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM "Product"
      ORDER BY "Product_ID" ASC
    `);

    const data = result.rows.map((row) => ({
      ...row,
      Price: parseFloat(row.Price),
    }));

    res.json(data);
  } catch (err) {
    console.error('Error in GET /products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: get or create active order
async function getOrCreateActiveOrder(userId, client = pool) {
  const orderCheck = await client.query(`
    SELECT o."Order_ID"
    FROM "Order" o
    JOIN "Orders" os ON os."Order_ID" = o."Order_ID"
    WHERE os."ID" = $1 AND o."CheckedOut" = false
    LIMIT 1
  `, [userId]);

  if (orderCheck.rows.length > 0) {
    return orderCheck.rows[0].Order_ID;
  } else {
    const newOrderResult = await client.query(`
      INSERT INTO "Order" ("CheckedOut")
      VALUES (false)
      RETURNING "Order_ID"
    `);
    const newOrderId = newOrderResult.rows[0].Order_ID;

    await client.query(`
      INSERT INTO "Orders" ("ID", "Order_ID")
      VALUES ($1, $2)
    `, [userId, newOrderId]);

    return newOrderId;
  }
}

// Add item to cart
app.post('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'productId and quantity required' });
    }

    const orderId = await getOrCreateActiveOrder(userId);

    // Check if item is already in cart
    const checkContains = await pool.query(`
      SELECT "Quantity"
      FROM "Contains"
      WHERE "Order_ID" = $1 AND "Product_ID" = $2
    `, [orderId, productId]);

    if (checkContains.rows.length > 0) {
      const newQuantity = checkContains.rows[0].Quantity + quantity;
      await pool.query(`
        UPDATE "Contains"
        SET "Quantity" = $1
        WHERE "Order_ID" = $2 AND "Product_ID" = $3
      `, [newQuantity, orderId, productId]);
    } else {
      await pool.query(`
        INSERT INTO "Contains" ("Order_ID", "Product_ID", "Quantity")
        VALUES ($1, $2, $3)
      `, [orderId, productId, quantity]);
    }

    return res.json({ message: 'Item added to cart' });
  } catch (err) {
    console.error('Error in POST /cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cart items
app.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const orderId = await getOrCreateActiveOrder(userId);

    const cartQuery = await pool.query(`
      SELECT c."Product_ID", c."Quantity",
             p."Title", p."Description",
             p."ProductImageURL", p."StockQuantity",
             p."Price"
      FROM "Contains" c
      JOIN "Product" p ON p."Product_ID" = c."Product_ID"
      WHERE c."Order_ID" = $1
    `, [orderId]);

    const cartItems = cartQuery.rows.map(row => ({
      productId: row.Product_ID,
      title: row.Title,
      description: row.Description,
      imageURL: row.ProductImageURL,
      stock: row.StockQuantity,
      quantity: row.Quantity,
      price: parseFloat(row.Price),
    }));

    return res.json({ orderId, cartItems });
  } catch (err) {
    console.error('Error in GET /cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/************************************************
 * POST /checkout (transaction-based)
 ***********************************************/
app.post('/checkout', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.userId;
    const { address } = req.body;
    if (!address || !address.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Address is required' });
    }

    // 1) Find active order
    const orderCheck = await client.query(`
      SELECT o."Order_ID"
      FROM "Order" o
      JOIN "Orders" os ON os."Order_ID" = o."Order_ID"
      WHERE os."ID" = $1 AND o."CheckedOut" = false
      LIMIT 1
    `, [userId]);

    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active cart to checkout' });
    }
    const orderId = orderCheck.rows[0].Order_ID;

    // 2) Verify stock and calculate total
    const itemsQuery = await client.query(`
      SELECT c."Product_ID", c."Quantity", p."Price", p."StockQuantity"
      FROM "Contains" c
      JOIN "Product" p ON p."Product_ID" = c."Product_ID"
      WHERE c."Order_ID" = $1
    `, [orderId]);

    let total = 0;
    for (const item of itemsQuery.rows) {
      if (item.StockQuantity < item.Quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for product #${item.Product_ID}`
        });
      }
      total += item.Price * item.Quantity;
    }

    // 3) Update stock
    for (const item of itemsQuery.rows) {
      await client.query(`
        UPDATE "Product"
        SET "StockQuantity" = "StockQuantity" - $1
        WHERE "Product_ID" = $2
      `, [item.Quantity, item.Product_ID]);
    }

    // 4) Finalize order
    await client.query(`
      UPDATE "Order"
      SET "Address" = $1,
          "CheckedOut" = true,
          "DateTime" = NOW(),
          "Total" = $2
      WHERE "Order_ID" = $3
    `, [address, total, orderId]);

    await client.query('COMMIT');
    return res.json({
      message: 'Checkout successful',
      orderId,
      total: total.toFixed(2),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Checkout failed' });
  } finally {
    client.release();
  }
});

/************************************************
 * GET /purchases => aggregated order history
 ***********************************************/
app.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(`
      SELECT o."Order_ID", o."DateTime", o."Address", o."Total",
             json_agg(json_build_object(
               'title', p."Title",
               'quantity', c."Quantity",
               'price', p."Price"
             )) AS "items"
      FROM "Order" o
      JOIN "Orders" os ON os."Order_ID" = o."Order_ID"
      JOIN "Contains" c ON c."Order_ID" = o."Order_ID"
      JOIN "Product" p ON p."Product_ID" = c."Product_ID"
      WHERE os."ID" = $1
        AND o."CheckedOut" = true
      GROUP BY o."Order_ID"
      ORDER BY o."DateTime" DESC
    `, [userId]);

    const orders = result.rows.map(row => ({
      orderId: row.Order_ID,
      date: new Date(row.DateTime).toLocaleString(),
      address: row.Address,
      total: parseFloat(row.Total || 0).toFixed(2),
      items: row.items || [],
    }));

    return res.json({ orders });
  } catch (err) {
    console.error('Purchase history error:', err);
    return res.status(500).json({ error: 'Failed to get purchase history' });
  }
});

// ================== EMAIL & PASSWORD UPDATES ================== //
// ────────────────────────────────────────────────────────────────

// PUT /profile/:userId/email   — change e‑mail (auth required)
app.put('/profile/:userId/email', authenticateToken, async (req, res) => {
  try {
    const { userId }      = req.params;
    const { newEmail='' } = req.body;

    if (req.userId !== parseInt(userId))
      return res.status(403).json({ error: 'Forbidden' });

    if (!newEmail.trim())
      return res.status(400).json({ error: 'newEmail is required' });

    // Make sure address isn’t already taken
    const clash = await pool.query(
      'SELECT 1 FROM "User" WHERE "Email" = $1 AND "ID" <> $2',
      [newEmail, userId]
    );
    if (clash.rowCount)
      return res.status(409).json({ error: 'E‑mail already in use' });

    await pool.query(
      'UPDATE "User" SET "Email" = $1 WHERE "ID" = $2',
      [newEmail, userId]
    );
    res.json({ message: 'E‑mail updated' });
  } catch (err) {
    console.error('Email change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /profile/:userId/password   — change password (auth required)
app.post('/profile/:userId/password', authenticateToken, async (req, res) => {
  try {
    const { userId }                       = req.params;
    const { oldPassword, newPassword='' }  = req.body;

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

    const hash  = await bcrypt.hash(newPassword, 10);
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

//ADMIN

/*******************************************
 * POST /admin/login
 * Verifies the admin credentials against the
 * server-side ADMIN_EMAIL / ADMIN_PASSWORD_HASH
 * env vars and returns an admin-scoped JWT.
 *******************************************/
app.post('/admin/login', async (req, res) => {
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

/*******************************************
 * GET /stats
 * Returns total user count, total posts,
 * total likes.
 *******************************************/
app.get('/stats', authenticateAdmin, async (req, res) => {
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

/*******************************************
 * GET /getposts (admin)
 * Returns all posts with user info
 *******************************************/
app.get('/getposts', authenticateAdmin, async (req, res) => {
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

    // Build full URLs if needed
    const posts = result.rows.map((row) => {
      let fullPostImage = null;
      if (row.postImageFilename) {
        fullPostImage = `${req.protocol}://${req.get('host')}/uploads/${row.postImageFilename}`;
      }
      let fullUserProfileURL = null;
      if (row.userProfileFilename) {
        fullUserProfileURL = `${req.protocol}://${req.get('host')}/uploads/${row.userProfileFilename}`;
      }
      return {
        post_id: row.post_id,
        postText: row.postText || '',
        postImage: fullPostImage,
        likeCount: row.likeCount || 0,
        dateTime: row.dateTime,
        userId: row.userId,
        userName: row.userName,
        userProfileImage: fullUserProfileURL,
      };
    });

    return res.json(posts);
  } catch (err) {
    console.error('Error in GET /posts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/*******************************************
 * DELETE /posts/:postId (admin)
 * Deletes a post by ID
 *******************************************/
app.delete('/posts/:postId', authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    // 1) Check if post exists
    const checkPost = await pool.query(
      `SELECT "Post_ID" FROM "Post" WHERE "Post_ID" = $1`,
      [postId]
    );
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 2) Delete from "Posts" bridging table
    await pool.query(
      `DELETE FROM "Posts" WHERE "Post_ID" = $1`,
      [postId]
    );

    // 3) Delete the actual Post record
    await pool.query(
      `DELETE FROM "Post" WHERE "Post_ID" = $1`,
      [postId]
    );

    return res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ================== START SERVER ================== //
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
