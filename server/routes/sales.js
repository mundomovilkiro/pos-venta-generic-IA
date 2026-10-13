import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sales - List sales with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, customer_id, payment_method, is_credit } = req.query;
    const db = await getDb();

    let sql = `
      SELECT s.*, c.name as customer_name, c.category as customer_category_name, u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(s.created_at) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date(s.created_at) <= date(?)';
      params.push(end_date);
    }
    if (customer_id) {
      sql += ' AND s.customer_id = ?';
      params.push(parseInt(customer_id, 10));
    }
    if (payment_method) {
      sql += ' AND s.payment_method = ?';
      params.push(payment_method);
    }
    if (is_credit !== undefined && is_credit !== '') {
      sql += ' AND s.is_credit = ?';
      params.push(parseInt(is_credit, 10));
    }

    sql += ' ORDER BY s.created_at DESC LIMIT 200';

    const sales = db.query(sql, params);
    return res.json({ success: true, sales });
  } catch (error) {
    console.error('Error al listar ventas:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar ventas.' });
  }
});

// GET /api/sales/:id - Full sale details for thermal print, PDF, or virtual invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const sale = db.get(`
      SELECT s.*, c.name as customer_name, c.document_id as customer_document,
             c.phone as customer_phone, c.address as customer_address,
             u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Venta no encontrada.' });
    }

    const items = db.query(`
      SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC
    `, [id]);

    const abonos = db.query(`
      SELECT p.*, u.name as cashier_name
      FROM debtor_payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.sale_id = ?
      ORDER BY p.created_at ASC
    `, [id]);

    return res.json({ success: true, sale, items, abonos });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar la venta.' });
  }
});

// GET /api/sales/invoice/:invoiceNumber - Public endpoint for Virtual Invoice link & QR scanning
router.get('/invoice/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const db = await getDb();

    const sale = db.get(`
      SELECT s.*, c.name as customer_name, c.document_id as customer_document,
             c.phone as customer_phone, c.address as customer_address,
             u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.invoice_number = ?
    `, [invoiceNumber]);

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada o código inválido.' });
    }

    const items = db.query(`
      SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC
    `, [sale.id]);

    const settingsRows = db.query('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    return res.json({ success: true, sale, items, settings });
  } catch (error) {
    console.error('Error al consultar factura virtual:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar comprobante virtual.' });
  }
});

// POST /api/sales - Register a new sale with ACID transaction, inventory deduction and credit handling
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customer_id = null,
      items,
      payment_method = 'efectivo',
      amount_paid = 0,
      tax_rate = 0,
      discount_amount = 0,
      is_credit = false,
      due_date = null,
      notes = ''
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'El carrito de venta no puede estar vacío.' });
    }

    const validPaymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'credito', 'mixto'];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, error: 'Método de pago no válido.' });
    }

    const db = await getDb();

    // Check customer category and credit limits if customer is selected
    let customer = null;
    let customerCategory = 'simple';
    if (customer_id) {
      customer = db.get('SELECT * FROM customers WHERE id = ?', [customer_id]);
      if (!customer) {
        return res.status(400).json({ success: false, error: 'El cliente seleccionado no existe.' });
      }
      customerCategory = customer.category;
    }

    if (is_credit && !customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Para realizar una venta al crédito (deuda/fiado) es obligatorio seleccionar un cliente.'
      });
    }

    // Execute atomic sale transaction
    const saleResult = db.transaction((tx) => {
      // 1. Calculate subtotals and check stock
      let subtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prodId = parseInt(item.product_id, 10);
        const qty = parseFloat(item.quantity);
        if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
          throw new Error('Cantidad o producto inválido en el carrito.');
        }

        const product = tx.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [prodId]);
        if (!product) {
          throw new Error(`El producto con ID ${prodId} no está disponible.`);
        }

        if (product.stock < qty) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${qty}`);
        }

        // Apply price based on item override or customer tier
        let unitPrice = parseFloat(item.unit_price);
        if (isNaN(unitPrice) || unitPrice < 0) {
          if (customerCategory === 'mayorista' && product.price_wholesale > 0) {
            unitPrice = product.price_wholesale;
          } else if (customerCategory === 'frecuente' && product.price_frequent > 0) {
            unitPrice = product.price_frequent;
          } else {
            unitPrice = product.price_regular;
          }
        }

        const itemDiscount = parseFloat(item.discount) || 0;
        const itemSubtotal = (unitPrice * qty) - itemDiscount;
        subtotal += itemSubtotal;

        verifiedItems.push({
          product,
          qty,
          unitPrice,
          unitCost: product.cost_price,
          itemDiscount,
          itemSubtotal
        });
      }

      const discTotal = parseFloat(discount_amount) || 0;
      const baseForTax = Math.max(0, subtotal - discTotal);
      const taxRateNum = parseFloat(tax_rate) || 0;
      const taxAmount = (baseForTax * taxRateNum) / 100;
      const grandTotal = Math.max(0, baseForTax + taxAmount);

      // 2. Validate credit limit if credit sale
      const paidNum = parseFloat(amount_paid) || 0;
      let debtBalance = 0;
      let debtStatus = 'no_debt';

      if (is_credit) {
        debtBalance = Math.max(0, grandTotal - paidNum);
        debtStatus = debtBalance <= 0 ? 'paid' : (paidNum > 0 ? 'partial' : 'pending');

        if (customer.credit_limit > 0) {
          const projectedDebt = customer.current_debt + debtBalance;
          if (projectedDebt > customer.credit_limit) {
            throw new Error(`La venta supera el límite de crédito del cliente. Límite: $${customer.credit_limit.toFixed(2)}, Deuda proyectada: $${projectedDebt.toFixed(2)}`);
          }
        }
      }

      // Calculate change
      let changeGiven = 0;
      if (!is_credit && payment_method === 'efectivo' && paidNum > grandTotal) {
        changeGiven = paidNum - grandTotal;
      }

      // 3. Generate sequential invoice number (FAC-000001)
      const lastSale = tx.get('SELECT id FROM sales ORDER BY id DESC LIMIT 1');
      const nextId = (lastSale ? lastSale.id : 0) + 1;
      const invoiceNumber = `FAC-${String(nextId).padStart(6, '0')}`;

      // Check active cash shift
      const activeShift = tx.get('SELECT id FROM cash_shifts WHERE user_id = ? AND status = "open"', [req.user.id]);
      const cashShiftId = activeShift ? activeShift.id : null;

      // 4. Insert into sales table
      const saleInsert = tx.run(`
        INSERT INTO sales (
          invoice_number, customer_id, user_id, cash_shift_id, customer_category,
          subtotal, tax_amount, discount_amount, total, payment_method,
          amount_paid, change_given, is_credit, debt_status, due_date, debt_balance,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceNumber,
        customer_id ? parseInt(customer_id, 10) : null,
        req.user.id,
        cashShiftId,
        customerCategory,
        subtotal,
        taxAmount,
        discTotal,
        grandTotal,
        payment_method,
        paidNum,
        changeGiven,
        is_credit ? 1 : 0,
        debtStatus,
        due_date || null,
        debtBalance,
        notes.trim()
      ]);

      const saleId = saleInsert.lastInsertRowid;

      // 5. Insert sale items, deduct stock and record Kardex
      for (const item of verifiedItems) {
        tx.run(`
          INSERT INTO sale_items (
            sale_id, product_id, product_name, product_barcode, unit_cost, unit_price, quantity, discount, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId,
          item.product.id,
          item.product.name,
          item.product.barcode,
          item.unitCost,
          item.unitPrice,
          item.qty,
          item.itemDiscount,
          item.itemSubtotal
        ]);

        const prevStock = item.product.stock;
        const newStock = prevStock - item.qty;

        tx.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, item.product.id]);

        tx.run(`
          INSERT INTO inventory_movements (
            product_id, movement_type, quantity, previous_stock, new_stock, reference_id, reason, user_id
          ) VALUES (?, 'VENTA', ?, ?, ?, ?, 'Venta realizada', ?)
        `, [
          item.product.id,
          item.qty,
          prevStock,
          newStock,
          invoiceNumber,
          req.user.id
        ]);
      }

      // 6. Update customer debt if credit
      if (is_credit && debtBalance > 0 && customer_id) {
        tx.run('UPDATE customers SET current_debt = current_debt + ? WHERE id = ?', [debtBalance, customer_id]);
      }

      // 7. Update cash shift totals if active shift exists
      if (cashShiftId) {
        if (payment_method === 'efectivo') {
          const cashInflow = is_credit ? paidNum : (grandTotal);
          tx.run('UPDATE cash_shifts SET sales_cash = sales_cash + ?, expected_cash = expected_cash + ? WHERE id = ?', [cashInflow, cashInflow, cashShiftId]);
        } else if (payment_method === 'tarjeta') {
          tx.run('UPDATE cash_shifts SET sales_card = sales_card + ? WHERE id = ?', [grandTotal, cashShiftId]);
        } else if (payment_method === 'transferencia') {
          tx.run('UPDATE cash_shifts SET sales_transfer = sales_transfer + ? WHERE id = ?', [grandTotal, cashShiftId]);
        } else if (payment_method === 'credito') {
          tx.run('UPDATE cash_shifts SET sales_credit = sales_credit + ? WHERE id = ?', [grandTotal, cashShiftId]);
          if (paidNum > 0) {
            tx.run('UPDATE cash_shifts SET sales_cash = sales_cash + ?, expected_cash = expected_cash + ? WHERE id = ?', [paidNum, paidNum, cashShiftId]);
          }
        }
      }

      return {
        saleId,
        invoiceNumber,
        total: grandTotal,
        debtBalance,
        changeGiven
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Venta registrada con éxito.',
      ...saleResult
    });
  } catch (error) {
    console.error('Error al procesar venta:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al procesar la venta.' });
  }
});

export default router;
