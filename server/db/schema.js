import bcrypt from 'bcryptjs';

export async function initializeSchema(db) {
  // Enforce foreign key constraints
  db.exec('PRAGMA foreign_keys = ON;');

  // Schema creation
  const schemaSql = `
    -- Users (Admin, Cashier)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cajero' CHECK (role IN ('admin', 'cajero')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    -- Products with differentiated pricing and stock alerts
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      unit TEXT DEFAULT 'unidad',
      cost_price REAL NOT NULL DEFAULT 0,
      price_regular REAL NOT NULL DEFAULT 0,
      price_frequent REAL NOT NULL DEFAULT 0,
      price_wholesale REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 5,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customers with categories ('mayorista', 'frecuente', 'simple') and credit balance
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      category TEXT NOT NULL DEFAULT 'simple' CHECK (category IN ('mayorista', 'frecuente', 'simple')),
      credit_limit REAL NOT NULL DEFAULT 0,
      current_debt REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cash Drawer Shifts (Arqueo y control de caja)
    CREATE TABLE IF NOT EXISTS cash_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      initial_cash REAL NOT NULL DEFAULT 0,
      sales_cash REAL NOT NULL DEFAULT 0,
      sales_card REAL NOT NULL DEFAULT 0,
      sales_transfer REAL NOT NULL DEFAULT 0,
      sales_credit REAL NOT NULL DEFAULT 0,
      abonos_cash REAL NOT NULL DEFAULT 0,
      total_expenses REAL NOT NULL DEFAULT 0,
      expected_cash REAL NOT NULL DEFAULT 0,
      actual_cash REAL,
      difference REAL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      notes TEXT
    );

    -- Sales / Invoices
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      cash_shift_id INTEGER REFERENCES cash_shifts(id),
      customer_category TEXT NOT NULL DEFAULT 'simple',
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'mixto')),
      amount_paid REAL NOT NULL DEFAULT 0,
      change_given REAL NOT NULL DEFAULT 0,
      is_credit INTEGER NOT NULL DEFAULT 0,
      debt_status TEXT NOT NULL DEFAULT 'no_debt' CHECK (debt_status IN ('no_debt', 'pending', 'partial', 'paid')),
      due_date DATE,
      debt_balance REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sale Line Items
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_barcode TEXT,
      unit_cost REAL NOT NULL,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL
    );

    -- Purchases from Suppliers
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_number TEXT UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_document TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'efectivo',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchase Line Items
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      quantity REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    -- Debtor Payments / Abonos de Clientes Deudores
    CREATE TABLE IF NOT EXISTS debtor_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      cash_shift_id INTEGER REFERENCES cash_shifts(id),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'efectivo',
      previous_debt REAL NOT NULL,
      remaining_debt REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Operational Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'efectivo',
      user_id INTEGER NOT NULL REFERENCES users(id),
      cash_shift_id INTEGER REFERENCES cash_shifts(id),
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory Kardex (Audit Log of movements)
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL CHECK (movement_type IN ('VENTA', 'COMPRA', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA')),
      quantity REAL NOT NULL,
      previous_stock REAL NOT NULL,
      new_stock REAL NOT NULL,
      reference_id TEXT,
      reason TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System Configuration Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Strategic Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_debt_status ON sales(debt_status);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_debtor_payments_customer_id ON debtor_payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_debtor_payments_sale_id ON debtor_payments(sale_id);
    CREATE INDEX IF NOT EXISTS idx_debtor_payments_created_at ON debtor_payments(created_at);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
    CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
    CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
  `;

  db.exec(schemaSql);

  // Seed default admin user if none exists
  const existingUsers = db.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.run(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin', hash, 'Administrador del Sistema', 'admin']
    );

    const cashierHash = bcrypt.hashSync('cajero123', salt);
    db.run(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      ['cajero', cashierHash, 'Cajero Principal', 'cajero']
    );
  }

  // Seed default system settings if none exist
  const defaultSettings = [
    ['store_name', 'Supermercado y Variedades KiroPOS'],
    ['store_document', 'J-12345678-9'],
    ['phone', '+1 (555) 019-2834'],
    ['email', 'contacto@kiropos.com'],
    ['address', 'Av. Principal #45, Zona Comercial'],
    ['tax_rate', '16'], // 16% IVA
    ['currency_symbol', '$'],
    ['paper_size', '80mm'], // '58mm' or '80mm'
    ['receipt_footer', '¡Gracias por su compra! Vuelva pronto.'],
    ['virtual_invoice_url_base', '']
  ];

  for (const [key, val] of defaultSettings) {
    const existing = db.get('SELECT key FROM settings WHERE key = ?', [key]);
    if (!existing) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, val]);
    }
  }

  // Seed default categories and initial sample catalog if categories are empty
  const catCount = db.query('SELECT COUNT(*) as count FROM categories');
  if (catCount[0].count === 0) {
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', ['Abarrotes & Alimentos', 'Víveres y productos de despensa']);
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', ['Bebidas & Licores', 'Refrescos, jugos, aguas y licores']);
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', ['Lácteos & Embutidos', 'Quesos, leche, jamón y derivados']);
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', ['Limpieza & Hogar', 'Artículos de aseo personal y limpieza del hogar']);
    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', ['Ferretería & Variedades', 'Herramientas, pilas y accesorios']);

    // Seed sample customers with different categories
    db.run(`
      INSERT INTO customers (document_id, name, phone, email, address, category, credit_limit, current_debt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['V-28193847', 'Juan Pérez (Cliente Mayorista)', '+1 555-123-4567', 'juan.mayorista@gmail.com', 'Calle Comercio 12', 'mayorista', 1000.00, 0]);

    db.run(`
      INSERT INTO customers (document_id, name, phone, email, address, category, credit_limit, current_debt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['V-19283746', 'María González (Cliente Frecuente)', '+1 555-234-5678', 'maria.gonzalez@gmail.com', 'Residencias Los Pinos Apto 4B', 'frecuente', 500.00, 150.00]);

    db.run(`
      INSERT INTO customers (document_id, name, phone, email, address, category, credit_limit, current_debt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['V-31092834', 'Carlos Mendoza (Cliente Simple / Deudor)', '+1 555-345-6789', 'carlos.mendoza@gmail.com', 'Sector La Florida #88', 'simple', 300.00, 85.50]);

    db.run(`
      INSERT INTO customers (document_id, name, phone, email, address, category, credit_limit, current_debt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['V-00000000', 'Cliente Ocasional / Mostrador', '', '', 'Tienda', 'simple', 0, 0]);

    // Seed sample products with categorized prices
    const sampleProducts = [
      {
        barcode: '75010001',
        name: 'Arroz Extra Grano Largo 1kg',
        description: 'Arroz blanco seleccionado grado 1',
        category_id: 1,
        unit: 'unidad',
        cost_price: 0.90,
        price_regular: 1.50,
        price_frequent: 1.35,
        price_wholesale: 1.20,
        stock: 120,
        min_stock: 20
      },
      {
        barcode: '75010002',
        name: 'Aceite Vegetal Puro 1L',
        description: 'Aceite de girasol refinado 1000ml',
        category_id: 1,
        unit: 'unidad',
        cost_price: 2.10,
        price_regular: 3.20,
        price_frequent: 2.95,
        price_wholesale: 2.70,
        stock: 65,
        min_stock: 15
      },
      {
        barcode: '75010003',
        name: 'Refresco Cola Premium 2L',
        description: 'Bebida gaseosa sabor cola clásica',
        category_id: 2,
        unit: 'unidad',
        cost_price: 1.40,
        price_regular: 2.50,
        price_frequent: 2.25,
        price_wholesale: 2.00,
        stock: 80,
        min_stock: 15
      },
      {
        barcode: '75010004',
        name: 'Queso Gouda Artesanal 500g',
        description: 'Queso madurado pasteurizado',
        category_id: 3,
        unit: 'unidad',
        cost_price: 3.20,
        price_regular: 5.00,
        price_frequent: 4.60,
        price_wholesale: 4.20,
        stock: 40,
        min_stock: 10
      },
      {
        barcode: '75010005',
        name: 'Detergente Líquido Multiuso 1L',
        description: 'Detergente concentrado aroma lavanda',
        category_id: 4,
        unit: 'unidad',
        cost_price: 1.80,
        price_regular: 3.00,
        price_frequent: 2.75,
        price_wholesale: 2.45,
        stock: 8, // Near min_stock for testing alerts
        min_stock: 10
      },
      {
        barcode: '75010006',
        name: 'Café Tostado y Molido 250g',
        description: 'Café gourmet 100% arábica de altura',
        category_id: 1,
        unit: 'unidad',
        cost_price: 2.00,
        price_regular: 3.80,
        price_frequent: 3.40,
        price_wholesale: 3.00,
        stock: 50,
        min_stock: 12
      }
    ];

    for (const p of sampleProducts) {
      db.run(`
        INSERT INTO products (barcode, name, description, category_id, unit, cost_price, price_regular, price_frequent, price_wholesale, stock, min_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.barcode, p.name, p.description, p.category_id, p.unit, p.cost_price, p.price_regular, p.price_frequent, p.price_wholesale, p.stock, p.min_stock]);
    }

    // Seed existing historical sample credit sale for Carlos Mendoza (Customer 3)
    db.run(`
      INSERT INTO sales (invoice_number, customer_id, user_id, customer_category, subtotal, tax_amount, discount_amount, total, payment_method, amount_paid, change_given, is_credit, debt_status, due_date, debt_balance, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 days'))
    `, ['FAC-000001', 3, 1, 'simple', 85.50, 0, 0, 85.50, 'credito', 0, 0, 1, 'pending', '2026-10-25', 85.50, 'Compra al crédito autorizada']);

    // Seed existing historical sample credit sale for María González (Customer 2)
    db.run(`
      INSERT INTO sales (invoice_number, customer_id, user_id, customer_category, subtotal, tax_amount, discount_amount, total, payment_method, amount_paid, change_given, is_credit, debt_status, due_date, debt_balance, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-10 days'))
    `, ['FAC-000002', 2, 1, 'frecuente', 200.00, 0, 0, 200.00, 'credito', 50.00, 0, 1, 'partial', '2026-10-20', 150.00, 'Compra al crédito con abono inicial']);

    // Seed sample abono payment for María González
    db.run(`
      INSERT INTO debtor_payments (receipt_number, sale_id, customer_id, user_id, amount, payment_method, previous_debt, remaining_debt, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 days'))
    `, ['ABO-000001', 2, 2, 1, 50.00, 'efectivo', 200.00, 150.00, 'Abono inicial en efectivo']);
  }
}
