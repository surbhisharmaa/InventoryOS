-- ===========================================================================
-- Inventory Management System - Full Database Schema
-- ===========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- ENUM TYPES
-- ===========================================================================

CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE transaction_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
CREATE TYPE order_status AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'RECEIVED', 'CANCELLED');
CREATE TYPE customer_order_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- ===========================================================================
-- USERS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'staff',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ===========================================================================
-- SUPPLIERS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email        VARCHAR(255),
    phone        VARCHAR(50),
    address      TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ===========================================================================
-- PRODUCTS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS products (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku           VARCHAR(100) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    category      VARCHAR(100) NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
    cost_price    NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical indexes as specified
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku        ON products(sku) WHERE is_deleted = FALSE;
CREATE INDEX        IF NOT EXISTS idx_products_id         ON products(id);
CREATE INDEX        IF NOT EXISTS idx_products_category   ON products(category) WHERE is_deleted = FALSE;
CREATE INDEX        IF NOT EXISTS idx_products_supplier   ON products(supplier_id);
CREATE INDEX        IF NOT EXISTS idx_products_low_stock  ON products(quantity, reorder_point) WHERE is_deleted = FALSE;

-- ===========================================================================
-- STOCK TRANSACTIONS TABLE (Audit Log)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS stock_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_type transaction_type NOT NULL,
    quantity_changed INTEGER NOT NULL,
    quantity_before  INTEGER NOT NULL,
    quantity_after   INTEGER NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_tx_product    ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_user       ON stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_type       ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_tx_created_at ON stock_transactions(created_at DESC);

-- ===========================================================================
-- PURCHASE ORDERS TABLE (Auto-generated reorder logs)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id    UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    status        order_status NOT NULL DEFAULT 'PENDING',
    triggered_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_product    ON purchase_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_po_status     ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at DESC);

-- ===========================================================================
-- UPDATED_AT AUTO-UPDATE TRIGGER
-- ===========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- SEED DATA
-- ===========================================================================

-- Default Admin user
-- Password: Admin@123456
-- Hash generated with: passlib.hash.bcrypt.using(rounds=12).hash("Admin@123456")
INSERT INTO users (email, full_name, hashed_password, role)
VALUES (
    'admin@inventory.com',
    'System Administrator',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Sample Suppliers
INSERT INTO suppliers (id, name, contact_name, email, phone) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TechParts Global',     'Alice Chen',    'alice@techparts.com',    '+1-555-0101'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Office Essentials Co', 'Bob Martinez',  'bob@officeessentials.com','+1-555-0202'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Industrial Supplies',  'Carol Johnson', 'carol@indsupplies.com',  '+1-555-0303')
ON CONFLICT DO NOTHING;

-- Sample Products
INSERT INTO products (sku, name, description, category, quantity, reorder_point, cost_price, selling_price, supplier_id) VALUES
    ('LAPTOP-001',  'Business Laptop 15"',      'Core i7, 16GB RAM, 512GB SSD',     'Electronics',   25, 10, 750.00, 1199.99, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('MOUSE-001',   'Wireless Ergonomic Mouse', 'Bluetooth 5.0, 3-year battery',    'Electronics',   8,  15, 18.00,  39.99,  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('CHAIR-001',   'Executive Office Chair',   'Lumbar support, adjustable height','Furniture',     12, 5,  180.00, 349.99, 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('PAPER-001',   'A4 Copy Paper (500 sheets)','80gsm, bright white',             'Stationery',    3,  20, 4.50,   8.99,   'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('DRILL-001',   'Cordless Power Drill',      '18V, 2 batteries included',       'Tools',         0,  5,  65.00,  129.99, 'c3d4e5f6-a7b8-9012-cdef-123456789012'),
    ('MONITOR-001', '27" 4K Monitor',            '144Hz, IPS panel, HDR400',        'Electronics',   18, 8,  320.00, 549.99, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('DESK-001',    'Standing Desk 140cm',       'Electric height-adjustable',       'Furniture',     6,  3,  290.00, 599.99, 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('HARD-001',    '4TB External HDD',          'USB-C, ruggedized casing',        'Electronics',   40, 10, 55.00,  109.99, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (sku) DO NOTHING;

-- ===========================================================================
-- CUSTOMERS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS customers (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name  VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    phone      VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- ORDERS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS orders (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status       customer_order_status NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes        VARCHAR(500),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- ORDER ITEMS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS order_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal   NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ===========================================================================
-- SAMPLE CUSTOMERS
-- ===========================================================================

INSERT INTO customers (full_name, email, phone) VALUES
    ('Alice Thompson',  'alice.thompson@brighttech.com',   '+1-555-2101'),
    ('Bob Martinez',    'bob.martinez@cloudventures.io',   '+1-555-2202'),
    ('Carol Johnson',   'carol.j@greenleaf.org',           '+1-555-2303'),
    ('David Chen',      'd.chen@nexusdynamic.com',         '+1-555-2404'),
    ('Emma Williams',   'emma.w@prismsolutions.net',       '+1-555-2505'),
    ('Frank Brown',     'frank.brown@alphalogistics.com',  '+1-555-2606'),
    ('Grace Kim',       'grace.kim@stellardesign.co',      '+1-555-2707'),
    ('Henry Davis',     'henry.d@apexconsulting.biz',      '+1-555-2808')
ON CONFLICT (email) DO NOTHING;
