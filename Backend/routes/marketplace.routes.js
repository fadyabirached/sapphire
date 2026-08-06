const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get products
router.get('/products', authenticateToken, async (req, res) => {
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
  }

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

// Add item to cart
router.post('/cart', authenticateToken, async (req, res) => {
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
router.get('/cart', authenticateToken, async (req, res) => {
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

// Checkout (transaction-based)
router.post('/checkout', authenticateToken, async (req, res) => {
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
          error: `Insufficient stock for product #${item.Product_ID}`,
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

// GET /purchases => aggregated order history
router.get('/purchases', authenticateToken, async (req, res) => {
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

module.exports = router;
