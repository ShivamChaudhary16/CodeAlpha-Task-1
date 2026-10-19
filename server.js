const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ecommerce-key-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth Helper Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()], async (err, existing) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), hashedPassword],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ error: 'Failed to create user' });

          const token = jwt.sign(
            { id: this.lastID, email: email.toLowerCase().trim(), name: name.trim() },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: this.lastID, name: name.trim(), email: email.toLowerCase().trim() }
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });
});

// -------------------------------------------------------------
// PRODUCT ROUTES
// -------------------------------------------------------------

// GET /api/categories
app.get('/api/categories', (req, res) => {
  db.all(
    'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ categories: rows });
    }
  );
});

// GET /api/products
app.get('/api/products', (req, res) => {
  const { category, search, sort, maxPrice } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search && search.trim() !== '') {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (sort === 'price-low') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'price-high') {
    sql += ' ORDER BY price DESC';
  } else if (sort === 'rating') {
    sql += ' ORDER BY rating DESC';
  } else if (sort === 'name') {
    sql += ' ORDER BY name ASC';
  } else {
    sql += ' ORDER BY id ASC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const formatted = rows.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));
    res.json({ products: formatted });
  });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.features = product.features ? JSON.parse(product.features) : [];

    // Also get related products in same category
    db.all(
      'SELECT id, name, category, price, original_price, rating, image FROM products WHERE category = ? AND id != ? LIMIT 4',
      [product.category, product.id],
      (relErr, related) => {
        res.json({
          product,
          related: related || []
        });
      }
    );
  });
});

// -------------------------------------------------------------
// ORDER PROCESSING ROUTES
// -------------------------------------------------------------

// POST /api/orders (Checkout)
app.post('/api/orders', authenticateToken, (req, res) => {
  const { customerName, customerEmail, shippingAddress, shippingCity, shippingZip, paymentMethod, items } = req.body;

  if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingZip || !items || !items.length) {
    return res.status(400).json({ error: 'All fields and at least one item are required' });
  }

  const productIds = items.map((i) => i.productId);
  const placeholders = productIds.map(() => '?').join(',');

  db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, products) => {
    if (err) return res.status(500).json({ error: 'Database error checking products' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === parseInt(item.productId));
      if (!product) {
        return res.status(400).json({ error: `Product ID ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}`
        });
      }
      const qty = parseInt(item.quantity) || 1;
      subtotal += product.price * qty;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        image: product.image
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const shippingFee = subtotal >= 100 || subtotal === 0 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + shippingFee + tax).toFixed(2));
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = req.user ? req.user.id : null;

    db.run(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, shipping_city, shipping_zip, payment_method, subtotal, shipping_fee, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        customerName.trim(),
        customerEmail.toLowerCase().trim(),
        shippingAddress.trim(),
        shippingCity.trim(),
        shippingZip.trim(),
        paymentMethod || 'Credit Card',
        subtotal,
        shippingFee,
        tax,
        total,
        'Confirmed'
      ],
      function (orderErr) {
        if (orderErr) {
          console.error('Order creation error:', orderErr);
          return res.status(500).json({ error: 'Failed to process order' });
        }

        const orderId = this.lastID;
        const itemStmt = db.prepare(`
          INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, product_image)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const stockStmt = db.prepare(`
          UPDATE products SET stock = stock - ? WHERE id = ?
        `);

        orderItems.forEach((item) => {
          itemStmt.run(orderId, item.productId, item.name, item.price, item.quantity, item.image);
          stockStmt.run(item.quantity, item.productId);
        });

        itemStmt.finalize();
        stockStmt.finalize();

        res.status(201).json({
          message: 'Order placed successfully!',
          orderNumber,
          orderId,
          order: {
            orderNumber,
            customerName,
            customerEmail,
            shippingAddress: `${shippingAddress}, ${shippingCity} ${shippingZip}`,
            paymentMethod,
            subtotal,
            shippingFee,
            tax,
            total,
            status: 'Confirmed',
            items: orderItems,
            createdAt: new Date().toISOString()
          }
        });
      }
    );
  });
});

// GET /api/orders/:orderNumber
app.get('/api/orders/:orderNumber', (req, res) => {
  db.get('SELECT * FROM orders WHERE order_number = ?', [req.params.orderNumber], (err, order) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (itemErr, items) => {
      if (itemErr) return res.status(500).json({ error: 'Database error fetching order items' });
      res.json({
        order: {
          ...order,
          items: items || []
        }
      });
    });
  });
});

// GET /api/orders (Logged in user's orders)
app.get('/api/orders', authenticateToken, requireAuth, (req, res) => {
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    db.all(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds, (itemErr, items) => {
      if (itemErr) return res.status(500).json({ error: 'Database error' });

      const ordersWithItems = orders.map((order) => ({
        ...order,
        items: items.filter((item) => item.order_id === order.id)
      }));

      res.json({ orders: ordersWithItems });
    });
  });
});

// Start Server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`E-Commerce Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
