-- ============================================================
-- KHAANA — Complete Database Schema
-- University DBMS Project
-- ============================================================
-- This file contains:
--   • 11 Tables (3NF normalized)
--   • 3 Triggers (rating update, order timestamp, closed check)
--   • 1 Stored Procedure (place_order)
--   • 6 Indexes (query performance)
--   • 3 Views (admin reporting)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Users — stores all platform users (customer, restaurant_owner, admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(15) UNIQUE,
  role VARCHAR(20) CHECK (role IN ('customer', 'restaurant_owner', 'admin')) DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. OTP Verifications — email-based OTP using Nodemailer (NO Firebase)
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(150) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Addresses — user delivery addresses with lat/lng for map support
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50),
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6)
);

-- 4. Restaurants — restaurant profiles linked to owner accounts
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100),
  pincode VARCHAR(10),
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Categories — menu item categories (only table with SERIAL PK)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- 6. Menu Items — food items belonging to a restaurant and category
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Cart — temporary storage for items before order placement
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  UNIQUE(user_id, menu_item_id)
);

-- 8. Orders — placed orders with status tracking
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  address_id UUID REFERENCES addresses(id),
  status VARCHAR(30) CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')) DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) CHECK (payment_status IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Order Items — individual items within an order (snapshot of menu at time of order)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL
);

-- 10. Reviews — one review per user per restaurant, linked to an order
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  order_id UUID REFERENCES orders(id) UNIQUE,
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- 11. Payments — Razorpay payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) UNIQUE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('created','success','failed')) DEFAULT 'created',
  paid_at TIMESTAMP
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- TRIGGER 1: Auto-update restaurant avg_rating and total_reviews
-- when a review is inserted, updated, or deleted.
-- DBMS Concept: Trigger + Aggregate Functions
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_restaurant_id UUID;
BEGIN
  -- Handle DELETE (OLD row), INSERT/UPDATE (NEW row)
  IF TG_OP = 'DELETE' THEN
    target_restaurant_id := OLD.restaurant_id;
  ELSE
    target_restaurant_id := NEW.restaurant_id;
  END IF;

  UPDATE restaurants
  SET avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE restaurant_id = target_restaurant_id),
      total_reviews = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = target_restaurant_id)
  WHERE id = target_restaurant_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_restaurant_rating();

-- TRIGGER 2: Auto-set updated_at timestamp on orders table
-- DBMS Concept: BEFORE UPDATE trigger for audit tracking
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- TRIGGER 3: Prevent ordering from a closed restaurant
-- DBMS Concept: BEFORE INSERT trigger for business rule enforcement
CREATE OR REPLACE FUNCTION check_restaurant_open()
RETURNS TRIGGER AS $$
DECLARE
  restaurant_open BOOLEAN;
BEGIN
  SELECT r.is_open INTO restaurant_open
  FROM restaurants r
  WHERE r.id = NEW.restaurant_id;

  IF NOT restaurant_open THEN
    RAISE EXCEPTION 'Restaurant is currently closed. Cannot place order.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_restaurant_open
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION check_restaurant_open();

-- ============================================================
-- STORED PROCEDURE
-- ============================================================

-- place_order(): Atomically converts cart items into an order
-- DBMS Concept: Stored Procedure / PL/pgSQL Function with Transaction
-- This function:
--   1. Calculates total from cart items
--   2. Creates a new order record
--   3. Copies cart items into order_items (snapshot of prices)
--   4. Clears the user's cart
-- All within a single atomic operation
CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_restaurant_id UUID,
  p_address_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_total DECIMAL(10,2);
BEGIN
  -- Step 1: Calculate total from current cart
  SELECT SUM(c.quantity * m.price) INTO v_total
  FROM cart c
  JOIN menu_items m ON c.menu_item_id = m.id
  WHERE c.user_id = p_user_id
    AND m.restaurant_id = p_restaurant_id;

  IF v_total IS NULL OR v_total = 0 THEN
    RAISE EXCEPTION 'Cart is empty or no items from this restaurant';
  END IF;

  -- Step 2: Create the order record
  INSERT INTO orders (user_id, restaurant_id, address_id, total_price)
  VALUES (p_user_id, p_restaurant_id, p_address_id, v_total)
  RETURNING id INTO v_order_id;

  -- Step 3: Copy cart items into order_items (price snapshot)
  INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
  SELECT v_order_id, c.menu_item_id, c.quantity, m.price
  FROM cart c
  JOIN menu_items m ON c.menu_item_id = m.id
  WHERE c.user_id = p_user_id
    AND m.restaurant_id = p_restaurant_id;

  -- Step 4: Clear the user's cart (only items from this restaurant)
  DELETE FROM cart
  WHERE user_id = p_user_id
    AND menu_item_id IN (
      SELECT id FROM menu_items WHERE restaurant_id = p_restaurant_id
    );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEXES — for query performance optimization
-- ============================================================

-- DBMS Concept: B-tree indexes on frequently queried columns
CREATE INDEX idx_orders_user        ON orders(user_id);
CREATE INDEX idx_orders_restaurant  ON orders(restaurant_id);
CREATE INDEX idx_menu_restaurant    ON menu_items(restaurant_id);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_restaurants_city   ON restaurants(city);
CREATE INDEX idx_otp_email          ON otp_verifications(email);

-- ============================================================
-- VIEWS — for admin reporting and analytics
-- ============================================================

-- VIEW 1: Active Orders — shows all non-completed orders
-- DBMS Concept: View + JOIN for denormalized read access
CREATE VIEW active_orders_view AS
SELECT o.id, u.name AS customer, r.name AS restaurant,
       o.status, o.total_price, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.status NOT IN ('delivered', 'cancelled');

-- VIEW 2: Popular Items — most ordered items across platform
-- DBMS Concept: View + Aggregate + GROUP BY
CREATE VIEW popular_items_view AS
SELECT m.name AS item, r.name AS restaurant,
       SUM(oi.quantity) AS total_ordered
FROM order_items oi
JOIN menu_items m ON oi.menu_item_id = m.id
JOIN restaurants r ON m.restaurant_id = r.id
GROUP BY m.name, r.name
ORDER BY total_ordered DESC;

-- VIEW 3: Restaurant Revenue — total revenue per restaurant
-- DBMS Concept: View + Aggregate + WHERE filter on payment status
CREATE VIEW restaurant_revenue_view AS
SELECT r.name AS restaurant,
       COUNT(o.id) AS total_orders,
       SUM(o.total_price) AS total_revenue
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.payment_status = 'paid'
GROUP BY r.name
ORDER BY total_revenue DESC;

-- ============================================================
-- SEED: Default categories
-- ============================================================
INSERT INTO categories (name) VALUES
  ('Starters'),
  ('Main Course'),
  ('Breads'),
  ('Rice & Biryani'),
  ('Desserts'),
  ('Beverages'),
  ('Snacks'),
  ('Thali'),
  ('Chinese'),
  ('South Indian')
ON CONFLICT (name) DO NOTHING;
