# Task 1: Simple E-commerce Store
**CodeAlpha Web Development Internship Submission**

A modern, responsive e-commerce web application featuring a rich product catalog, shopping cart, dedicated product details page, checkout and order processing, user authentication, and SQLite database persistence.

---

## 🎨 Theme & Color Palette

Designed strictly adhering to the specified design system:
- **Background**: Pristine White (`#FFFFFF`)
- **Text / Primary**: Deep Charcoal (`#222222`)
- **Secondary / Borders**: Soft Gray (`#E5E7EB`)
- **CTA Accent**: Slate Blue (`#4F46E5`) & Warm Sand (`#D4AF37`)

---

## 🚀 Features

### 1. Product Listings & Catalog
- **Grid Layout**: Responsive product cards with ratings, review counts, discount badges, and stock level pills.
- **Category Filter Tabs**: Instant filtering by categories (`Audio`, `Electronics`, `Accessories`, `Home & Living`, `Fashion`).
- **Live Search**: Instant keyword search matching product names, categories, and descriptions.
- **Sorting Toolbar**: Sort by Price (Low to High, High to Low), Customer Rating, or Alphabetically.
- **Quick View Modal**: Preview product highlights and add directly to cart without leaving the catalog.

### 2. Dedicated Product Details Page (`product.html?id=...`)
- High-resolution visual gallery with category breadcrumb navigation.
- Real-time stock availability indicators.
- Key highlights & technical specifications checklist.
- Interactive quantity stepper (`+` / `−`).
- Primary **Add to Cart** (Slate Blue `#4F46E5`) and **Buy Now** (Warm Sand `#D4AF37`) CTAs.
- Customer reassurance perks (Free shipping over $100, 2-year warranty, 30-day returns).
- **"You May Also Like"** related product recommendations from the same category.

### 3. Shopping Cart Drawer
- Smooth sliding side-drawer accessible from any page.
- Item quantity stepper with dynamic subtotal calculations.
- **Free Shipping Progress Tracker**: Visual progress bar to unlock free shipping on orders over $100.
- Live order math: Subtotal, Estimated Tax (8%), Shipping Fee calculation, and Final Total.
- Header cart badge displaying live item count with pop micro-animation.

### 4. Order Processing & Checkout (`checkout.html`)
- Structured checkout form capturing customer contact & shipping address.
- Multiple payment methods: Credit/Debit Card (with card inputs), PayPal Express, and Cash on Delivery.
- **Promo Discount Code**: Apply `CODEALPHA` or `WELCOME10` for an instant 10% discount.
- Live Order Summary sidebar breakdown.
- **Instant Order Confirmation Screen**: Generates unique tracking order number (e.g., `ORD-MVEUNTMU-7816`), itemized receipt, and estimated delivery dates.

### 5. User Registration & Login Authentication
- JWT-based authentication with `bcryptjs` password hashing.
- Clean Auth Modal supporting both **Sign In** and **Create Account**.
- **1-Click Demo Account Autofill** (`demo@store.com` / `password123`).
- Dynamic header state: displays user initials, name, and dropdown menu with "My Orders" and "Sign Out".

### 6. Order History Portal (`orders.html`)
- Displays past purchases for logged-in accounts.
- Itemized breakdown of past orders with product thumbnails, unit prices, date placed, and status badge (`Confirmed`).

### 7. Database & Backend API
- **Backend**: Express.js (Node.js) server.
- **Database**: SQLite3 (`store.db`) with 4 relational tables:
  - `users`: User profiles with hashed passwords.
  - `products`: Pre-seeded with 12 items across multiple categories.
  - `orders`: Order records, shipping destinations, totals, and statuses.
  - `order_items`: Line items linked by foreign key to `orders`.

---

## 📁 Project Structure

```
Task1- CodeAlpha/
├── package.json          # Project metadata & start script
├── server.js             # Express server & REST API endpoints
├── database.js           # SQLite schema initialization & product seeding
├── store.db              # SQLite database file
├── public/               # Frontend static assets
│   ├── index.html        # Main store catalog & hero
│   ├── product.html      # Dedicated product details page
│   ├── checkout.html     # Order processing & confirmation
│   ├── orders.html       # Customer order history
│   ├── css/
│   │   └── style.css     # Master stylesheet matching color palette
│   └── js/
│       ├── api.js        # REST API fetch helper
│       ├── auth.js       # JWT & session management
│       ├── cart.js       # Shopping cart operations & drawer UI
│       ├── main.js       # Homepage catalog & search/filter controller
│       ├── product.js    # Product details controller
│       ├── checkout.js   # Checkout form & order placement logic
│       └── orders.js     # User orders history controller
└── README.md
```

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start at:
```
http://localhost:3000
```

### 3. Demo Credentials
- **Email**: `demo@store.com`
- **Password**: `password123`
- Or click the **Auto-fill** button inside the Sign In modal.

### 4. Promo Codes for Checkout
- `CODEALPHA` (10% discount)
- `WELCOME10` (10% discount)
- `SAVE20` (20% discount)
