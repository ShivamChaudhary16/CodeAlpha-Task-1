const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'store.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users Table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Products Table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
          original_price REAL,
          rating REAL DEFAULT 4.5,
          reviews_count INTEGER DEFAULT 0,
          stock INTEGER DEFAULT 10,
          image TEXT NOT NULL,
          description TEXT NOT NULL,
          features TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. Orders Table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          shipping_address TEXT NOT NULL,
          shipping_city TEXT NOT NULL,
          shipping_zip TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          subtotal REAL NOT NULL,
          shipping_fee REAL NOT NULL,
          tax REAL NOT NULL,
          total REAL NOT NULL,
          status TEXT DEFAULT 'Processing',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // 4. Order Items Table
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          product_price REAL NOT NULL,
          quantity INTEGER NOT NULL,
          product_image TEXT,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);

      // Seed initial sample user & products if empty
      db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (err) return reject(err);
        if (row.count === 0) {
          console.log('Seeding initial products...');
          const seedProducts = [
            {
              name: 'Aura Studio Wireless Headphones',
              category: 'Audio',
              price: 179.99,
              original_price: 219.99,
              rating: 4.9,
              reviews_count: 248,
              stock: 18,
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
              description: 'Engineered for pristine sound fidelity with active noise cancellation, custom 40mm titanium drivers, and up to 45 hours of ultra-long battery life.',
              features: JSON.stringify(['Active Noise Cancellation (ANC)', '45-Hour Battery with Fast Charge', 'Multipoint Bluetooth 5.3', 'Ultra-soft memory foam earcups', 'Built-in beamforming microphones'])
            },
            {
              name: 'Nordic Chrono Minimalist Watch',
              category: 'Accessories',
              price: 129.50,
              original_price: 159.00,
              rating: 4.8,
              reviews_count: 184,
              stock: 25,
              image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
              description: 'A timeless timepiece crafted from brushed 316L surgical stainless steel, featuring sapphire crystal glass and an authentic Italian full-grain leather strap.',
              features: JSON.stringify(['Sapphire crystal scratch-resistant glass', 'Japanese Quartz movement', '5 ATM Water Resistance (50m)', 'Interchangeable quick-release strap', 'Brushed 316L stainless steel case'])
            },
            {
              name: 'Apex Pro Mechanical Keyboard',
              category: 'Electronics',
              price: 149.00,
              original_price: 179.00,
              rating: 4.9,
              reviews_count: 312,
              stock: 14,
              image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
              description: 'Compact 75% mechanical keyboard with hot-swappable tactile switches, gasket-mounted sound dampening, and CNC aluminum unibody frame.',
              features: JSON.stringify(['Hot-swappable 5-pin PCB sockets', 'Gasket mount with poron foam', 'CNC machined aluminum housing', 'Double-shot PBT keycaps', 'USB-C / 2.4GHz / Bluetooth tri-mode'])
            },
            {
              name: 'Precision Glide Ergonomic Mouse',
              category: 'Electronics',
              price: 64.99,
              original_price: 79.99,
              rating: 4.7,
              reviews_count: 156,
              stock: 22,
              image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&auto=format&fit=crop&q=80',
              description: 'Ergonomically contoured wireless mouse built to eliminate wrist strain during extended work sessions, featuring an ultra-smooth hyper-scroll wheel.',
              features: JSON.stringify(['4000 DPI Darkfield tracking sensor', 'Quiet click switches', 'Dual connectivity: Bluetooth & 2.4G', '70 days battery on single charge', 'Customizable side gestures'])
            },
            {
              name: 'Slimline Full-Grain Leather Wallet',
              category: 'Accessories',
              price: 44.00,
              original_price: 55.00,
              rating: 4.8,
              reviews_count: 98,
              stock: 30,
              image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&auto=format&fit=crop&q=80',
              description: 'Front-pocket bifold wallet designed to hold up to 10 cards and flat cash without bulk, embedded with certified RFID blocking protection.',
              features: JSON.stringify(['100% full-grain vegetable-tanned leather', 'Integrated RFID shielding', 'Quick-draw exterior card slot', 'Ultra-slim 8mm profile', 'Reinforced hand-stitched seams'])
            },
            {
              name: 'Artisan Ceramic Pour-Over Dripper Set',
              category: 'Home & Living',
              price: 48.50,
              original_price: 60.00,
              rating: 4.9,
              reviews_count: 112,
              stock: 19,
              image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=80',
              description: 'Handmade ceramic pour-over dripper with thermal retention ridges, complete with a heat-resistant borosilicate glass server and bamboo base.',
              features: JSON.stringify(['High-fire ceramic heat retention', '600ml borosilicate glass decanter', 'Natural sustainable bamboo coaster', 'Spiral internal flow ribs', 'Dishwasher safe ceramic'])
            },
            {
              name: 'Studiocraft Hi-Fi Bookshelf Speakers',
              category: 'Audio',
              price: 199.00,
              original_price: 249.00,
              rating: 4.9,
              reviews_count: 87,
              stock: 11,
              image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&auto=format&fit=crop&q=80',
              description: 'Active desktop monitor pair delivering room-filling 80W RMS audio with silk dome tweeters and deep, distortion-free woven carbon fiber woofers.',
              features: JSON.stringify(['80W RMS total continuous power', '1-inch silk dome tweeters', '4-inch woven composite bass drivers', 'Optical, RCA, & Bluetooth 5.1 inputs', 'Acoustic-grade MDF enclosure'])
            },
            {
              name: 'Aerolite Matte Aluminum Laptop Stand',
              category: 'Electronics',
              price: 39.99,
              original_price: 49.99,
              rating: 4.6,
              reviews_count: 140,
              stock: 28,
              image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&auto=format&fit=crop&q=80',
              description: 'Elevates your laptop screen to eye-level ergonomic height to promote healthier posture while optimizing airflow to prevent device overheating.',
              features: JSON.stringify(['Solid aircraft-grade aluminum alloy', 'Open ventilation cooling slot', 'Anti-slip silicone protective pads', 'Supports all 10-17 inch laptops', 'Integrated rear cable organizer'])
            },
            {
              name: 'Nomad Waxed Canvas Commuter Pack',
              category: 'Fashion',
              price: 89.00,
              original_price: 110.00,
              rating: 4.8,
              reviews_count: 165,
              stock: 16,
              image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80',
              description: 'Water-resistant 18oz waxed canvas daypack with dedicated padded 16-inch laptop compartment, solid brass hardware, and luggage pass-through.',
              features: JSON.stringify(['Weatherproof waxed heavy cotton canvas', 'Padded 16-inch laptop pocket', 'Genuine crazy horse leather trims', '22-liter versatile capacity', 'Hidden anti-theft passport pocket'])
            },
            {
              name: 'Lumina Touch Ambient Desk Lamp',
              category: 'Home & Living',
              price: 62.00,
              original_price: 75.00,
              rating: 4.7,
              reviews_count: 94,
              stock: 20,
              image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80',
              description: 'Sleek architectural LED task light with stepless capacitive touch dimming, 5 color temperature settings, and built-in 10W wireless charging base.',
              features: JSON.stringify(['Flicker-free eye-care LED panel', '5 Color temperatures (2700K - 6500K)', 'Fast 10W wireless charging pad', 'Memory dimmer function', 'Flexible dual-pivot alloy arm'])
            },
            {
              name: 'ThermalGuard Insulated Steel Tumbler',
              category: 'Home & Living',
              price: 28.00,
              original_price: 34.00,
              rating: 4.9,
              reviews_count: 230,
              stock: 45,
              image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=700&auto=format&fit=crop&q=80',
              description: 'Double-wall vacuum insulated 20oz tumbler keeps hot beverages warm for 8 hours and iced drinks cold for 24 hours. Sweat-proof powder finish.',
              features: JSON.stringify(['18/8 food-grade stainless steel', 'Double-wall vacuum insulation', 'Leakproof magnetic slider lid', 'Fits standard car cup holders', 'BPA-free & dishwasher safe'])
            },
            {
              name: 'Horizon Vintage Polarized Sunglasses',
              category: 'Fashion',
              price: 56.00,
              original_price: 70.00,
              rating: 4.7,
              reviews_count: 118,
              stock: 24,
              image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=80',
              description: 'Classic handcrafted acetate frames paired with UV400 polarized crystal lenses for optical clarity, reduced glare, and timeless aesthetic.',
              features: JSON.stringify(['100% UV400 polarized protection', 'Premium hand-polished acetate frame', 'Stainless steel 5-barrel hinges', 'Includes hard leather case & cloth', 'Scratch-resistant lens coating'])
            }
          ];

          const stmt = db.prepare(`
            INSERT INTO products (name, category, price, original_price, rating, reviews_count, stock, image, description, features)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          seedProducts.forEach((p) => {
            stmt.run(p.name, p.category, p.price, p.original_price, p.rating, p.reviews_count, p.stock, p.image, p.description, p.features);
          });

          stmt.finalize();
          console.log(`Successfully seeded ${seedProducts.length} products.`);
        }

        // Seed a demo user if empty
        db.get('SELECT COUNT(*) as count FROM users', async (userErr, userRow) => {
          if (userErr) return reject(userErr);
          if (userRow.count === 0) {
            console.log('Seeding demo user...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            db.run(
              'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
              ['Shivam Demo', 'demo@store.com', hashedPassword],
              (insertErr) => {
                if (insertErr) return reject(insertErr);
                console.log('Demo user created: demo@store.com / password123');
                resolve();
              }
            );
          } else {
            resolve();
          }
        });
      });
    });
  });
}

module.exports = {
  db,
  initDatabase
};
