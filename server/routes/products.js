import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products - Get all active products with category name
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category_id, low_stock } = req.query;
    const db = await getDb();

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      sql += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category_id && category_id !== 'all') {
      sql += ` AND p.category_id = ?`;
      params.push(parseInt(category_id, 10));
    }

    if (low_stock === 'true') {
      sql += ` AND p.stock <= p.min_stock`;
    }

    sql += ` ORDER BY p.name ASC`;

    const products = db.query(sql, params);
    return res.json({ success: true, products });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar productos.' });
  }
});

// GET /api/products/alerts - Low stock alerts count and list
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const lowStockProducts = db.query(`
      SELECT p.id, p.name, p.barcode, p.stock, p.min_stock, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.stock <= p.min_stock
      ORDER BY p.stock ASC
    `);

    return res.json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar alertas.' });
  }
});

// GET /api/products/:id - Single product with movements
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const product = db.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    const movements = db.query(`
      SELECT m.*, u.name as user_name
      FROM inventory_movements m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.product_id = ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [id]);

    return res.json({ success: true, product, movements });
  } catch (error) {
    console.error('Error al consultar producto:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener producto.' });
  }
});

// POST /api/products - Create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      barcode,
      name,
      description = '',
      category_id = null,
      unit = 'unidad',
      cost_price = 0,
      price_regular,
      price_frequent = null,
      price_wholesale = null,
      stock = 0,
      min_stock = 5
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre del producto es obligatorio.' });
    }

    const pRegular = parseFloat(price_regular);
    if (isNaN(pRegular) || pRegular < 0) {
      return res.status(400).json({ success: false, error: 'El precio regular debe ser un número válido mayor o igual a 0.' });
    }

    const pCost = parseFloat(cost_price) || 0;
    const pFreq = price_frequent !== null && price_frequent !== '' ? parseFloat(price_frequent) : pRegular;
    const pWholesale = price_wholesale !== null && price_wholesale !== '' ? parseFloat(price_wholesale) : pRegular;
    const initStock = parseFloat(stock) || 0;
    const minStk = parseFloat(min_stock) || 5;

    const db = await getDb();

    // Check barcode uniqueness if provided
    let finalBarcode = barcode ? barcode.trim() : null;
    if (finalBarcode) {
      const existing = db.get('SELECT id FROM products WHERE barcode = ?', [finalBarcode]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'El código de barras ya pertenece a otro producto.' });
      }
    } else {
      // Auto-generate a readable barcode if none provided
      finalBarcode = 'SKU-' + Date.now().toString().slice(-6);
    }

    const result = db.transaction((tx) => {
      const insertRes = tx.run(`
        INSERT INTO products (
          barcode, name, description, category_id, unit,
          cost_price, price_regular, price_frequent, price_wholesale,
          stock, min_stock, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        finalBarcode,
        name.trim(),
        description.trim(),
        category_id ? parseInt(category_id, 10) : null,
        unit.trim(),
        pCost,
        pRegular,
        pFreq,
        pWholesale,
        initStock,
        minStk
      ]);

      const productId = insertRes.lastInsertRowid;

      // If initial stock > 0, log movement in Kardex
      if (initStock > 0) {
        tx.run(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, previous_stock, new_stock, reference_id, reason, user_id
          ) VALUES (?, 'AJUSTE_ENTRADA', ?, 0, ?, 'INICIAL', 'Inventario inicial registrado', ?)
        `, [productId, initStock, initStock, req.user.id]);
      }

      return productId;
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      productId: result
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar el producto.' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      barcode,
      name,
      description = '',
      category_id = null,
      unit = 'unidad',
      cost_price,
      price_regular,
      price_frequent,
      price_wholesale,
      min_stock
    } = req.body;

    const db = await getDb();
    const existing = db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre del producto no puede estar vacío.' });
    }

    const pRegular = parseFloat(price_regular);
    if (isNaN(pRegular) || pRegular < 0) {
      return res.status(400).json({ success: false, error: 'Precio regular no válido.' });
    }

    const pCost = cost_price !== undefined ? parseFloat(cost_price) : existing.cost_price;
    const pFreq = price_frequent !== undefined && price_frequent !== '' ? parseFloat(price_frequent) : pRegular;
    const pWholesale = price_wholesale !== undefined && price_wholesale !== '' ? parseFloat(price_wholesale) : pRegular;
    const minStk = min_stock !== undefined ? parseFloat(min_stock) : existing.min_stock;

    let finalBarcode = barcode ? barcode.trim() : existing.barcode;
    if (finalBarcode && finalBarcode !== existing.barcode) {
      const barcodeExists = db.get('SELECT id FROM products WHERE barcode = ? AND id != ?', [finalBarcode, id]);
      if (barcodeExists) {
        return res.status(400).json({ success: false, error: 'El código de barras ya pertenece a otro producto.' });
      }
    }

    db.run(`
      UPDATE products
      SET barcode = ?, name = ?, description = ?, category_id = ?, unit = ?,
          cost_price = ?, price_regular = ?, price_frequent = ?, price_wholesale = ?,
          min_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      finalBarcode,
      name.trim(),
      description.trim(),
      category_id ? parseInt(category_id, 10) : null,
      unit.trim(),
      pCost,
      pRegular,
      pFreq,
      pWholesale,
      minStk,
      id
    ]);

    return res.json({ success: true, message: 'Producto actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar producto.' });
  }
});

// POST /api/products/:id/adjust - Manual stock adjustment with Kardex log
router.post('/:id/adjust', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment_type, quantity, reason } = req.body;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser un número positivo mayor que cero.' });
    }

    if (!['ENTRADA', 'SALIDA'].includes(adjustment_type)) {
      return res.status(400).json({ success: false, error: 'Tipo de ajuste debe ser ENTRADA o SALIDA.' });
    }

    const db = await getDb();
    const product = db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    const prevStock = product.stock;
    let newStock = prevStock;

    if (adjustment_type === 'ENTRADA') {
      newStock += qty;
    } else {
      if (prevStock < qty) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente. Stock actual: ${prevStock}, cantidad a descontar: ${qty}`
        });
      }
      newStock -= qty;
    }

    db.transaction((tx) => {
      tx.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);
      tx.run(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity, previous_stock, new_stock, reference_id, reason, user_id
        ) VALUES (?, ?, ?, ?, ?, 'MANUAL', ?, ?)
      `, [
        id,
        adjustment_type === 'ENTRADA' ? 'AJUSTE_ENTRADA' : 'AJUSTE_SALIDA',
        qty,
        prevStock,
        newStock,
        reason ? reason.trim() : 'Ajuste manual de inventario',
        req.user.id
      ]);
    });

    return res.json({
      success: true,
      message: 'Ajuste de inventario aplicado exitosamente.',
      previous_stock: prevStock,
      new_stock: newStock
    });
  } catch (error) {
    console.error('Error al ajustar inventario:', error);
    return res.status(500).json({ success: false, error: 'Error al ajustar inventario.' });
  }
});

// DELETE /api/products/:id - Soft delete (deactivate)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Producto desactivado exitosamente.' });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar producto.' });
  }
});

// GET /api/products/categories/all - List categories
router.get('/categories/all', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const categories = db.query('SELECT * FROM categories ORDER BY name ASC');
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar categorías.' });
  }
});

// POST /api/products/categories/all - Create category
router.post('/categories/all', authenticateToken, async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre de la categoría es requerido.' });
    }

    const db = await getDb();
    const existing = db.get('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'La categoría ya existe.' });
    }

    const result = db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name.trim(), description.trim()]);
    return res.status(201).json({ success: true, categoryId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({ success: false, error: 'Error al crear categoría.' });
  }
});

export default router;
