import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/purchases - List purchases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = await getDb();

    let sql = `
      SELECT p.*, u.name as user_name,
             (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as total_items_count
      FROM purchases p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(p.created_at) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date(p.created_at) <= date(?)';
      params.push(end_date);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT 100';

    const purchases = db.query(sql, params);
    return res.json({ success: true, purchases });
  } catch (error) {
    console.error('Error al consultar compras:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar compras.' });
  }
});

// GET /api/purchases/:id - Single purchase details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const purchase = db.get(`
      SELECT p.*, u.name as user_name
      FROM purchases p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Compra no encontrada.' });
    }

    const items = db.query(`
      SELECT * FROM purchase_items WHERE purchase_id = ?
    `, [id]);

    return res.json({ success: true, purchase, items });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar la compra.' });
  }
});

// POST /api/purchases - Register new purchase with stock increase and Kardex logging
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      supplier_name,
      supplier_document = '',
      payment_method = 'efectivo',
      items,
      notes = ''
    } = req.body;

    if (!supplier_name || supplier_name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre del proveedor es obligatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Debe agregar al menos un producto a la compra.' });
    }

    const db = await getDb();

    const purchaseResult = db.transaction((tx) => {
      let totalPurchase = 0;
      const validItems = [];

      for (const item of items) {
        const prodId = parseInt(item.product_id, 10);
        const qty = parseFloat(item.quantity);
        const cost = parseFloat(item.unit_cost);

        if (isNaN(prodId) || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
          throw new Error('Datos de producto, cantidad o costo inválidos en la compra.');
        }

        const product = tx.get('SELECT * FROM products WHERE id = ?', [prodId]);
        if (!product) {
          throw new Error(`Producto con ID ${prodId} no existe.`);
        }

        const itemSubtotal = cost * qty;
        totalPurchase += itemSubtotal;

        validItems.push({
          product,
          qty,
          cost,
          itemSubtotal
        });
      }

      // Generate sequential purchase number COM-000001
      const lastPurchase = tx.get('SELECT id FROM purchases ORDER BY id DESC LIMIT 1');
      const nextId = (lastPurchase ? lastPurchase.id : 0) + 1;
      const purchaseNumber = `COM-${String(nextId).padStart(6, '0')}`;

      // Insert purchase
      const insertPurchase = tx.run(`
        INSERT INTO purchases (
          purchase_number, supplier_name, supplier_document, user_id, total, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        purchaseNumber,
        supplier_name.trim(),
        supplier_document.trim(),
        req.user.id,
        totalPurchase,
        payment_method,
        notes.trim()
      ]);

      const purchaseId = insertPurchase.lastInsertRowid;

      // Insert items, increase stock, and log to Kardex
      for (const it of validItems) {
        tx.run(`
          INSERT INTO purchase_items (
            purchase_id, product_id, product_name, unit_cost, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          purchaseId,
          it.product.id,
          it.product.name,
          it.cost,
          it.qty,
          it.itemSubtotal
        ]);

        const prevStock = it.product.stock;
        const newStock = prevStock + it.qty;

        // Update product stock and optionally update cost price
        tx.run(`
          UPDATE products
          SET stock = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newStock, it.cost, it.product.id]);

        // Kardex audit log
        tx.run(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, previous_stock, new_stock, reference_id, reason, user_id
          ) VALUES (?, 'COMPRA', ?, ?, ?, ?, 'Compra a proveedor', ?)
        `, [
          it.product.id,
          it.qty,
          prevStock,
          newStock,
          purchaseNumber,
          req.user.id
        ]);
      }

      return {
        purchaseId,
        purchaseNumber,
        total: totalPurchase
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Compra registrada e inventario actualizado exitosamente.',
      ...purchaseResult
    });
  } catch (error) {
    console.error('Error al registrar compra:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al procesar la compra.' });
  }
});

export default router;
