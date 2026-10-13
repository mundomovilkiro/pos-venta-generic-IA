import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/debtors - Get all debtor customers and overview stats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();

    // Query debtors with pending debt > 0
    const debtors = db.query(`
      SELECT c.*,
             (SELECT COUNT(*) FROM sales WHERE customer_id = c.id AND debt_status IN ('pending', 'partial')) as pending_sales_count,
             (SELECT MIN(due_date) FROM sales WHERE customer_id = c.id AND debt_status IN ('pending', 'partial') AND due_date IS NOT NULL) as earliest_due_date
      FROM customers c
      WHERE c.current_debt > 0
      ORDER BY c.current_debt DESC
    `);

    // Calculate summary statistics
    const statsResult = db.get(`
      SELECT
        COALESCE(SUM(current_debt), 0) as total_debt_receivable,
        COUNT(CASE WHEN current_debt > 0 THEN 1 END) as debtors_count
      FROM customers
    `);

    // Check overdue sales count
    const overdueResult = db.get(`
      SELECT COUNT(*) as overdue_count
      FROM sales
      WHERE debt_status IN ('pending', 'partial')
        AND due_date IS NOT NULL
        AND date(due_date) < date('now')
    `);

    // Total abonos collected in current month
    const monthlyAbonosResult = db.get(`
      SELECT COALESCE(SUM(amount), 0) as abonos_this_month
      FROM debtor_payments
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    return res.json({
      success: true,
      stats: {
        total_debt_receivable: statsResult.total_debt_receivable,
        debtors_count: statsResult.debtors_count,
        overdue_count: overdueResult.overdue_count,
        abonos_this_month: monthlyAbonosResult.abonos_this_month
      },
      debtors
    });
  } catch (error) {
    console.error('Error al consultar deudores:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar cartera de deudores.' });
  }
});

// GET /api/debtors/:customerId - Get debtor detailed account state
router.get('/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const db = await getDb();

    const customer = db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    // Pending credit sales
    const pendingSales = db.query(`
      SELECT s.*,
             CASE
               WHEN s.due_date IS NOT NULL AND date(s.due_date) < date('now') THEN 1
               ELSE 0
             END as is_overdue
      FROM sales s
      WHERE s.customer_id = ? AND s.debt_status IN ('pending', 'partial')
      ORDER BY s.created_at ASC
    `, [customerId]);

    // Payment/abonos history
    const abonos = db.query(`
      SELECT p.*, u.name as cashier_name, s.invoice_number
      FROM debtor_payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN sales s ON p.sale_id = s.id
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `, [customerId]);

    return res.json({
      success: true,
      customer,
      pendingSales,
      abonos
    });
  } catch (error) {
    console.error('Error al consultar estado de cuenta del deudor:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar estado de cuenta.' });
  }
});

// POST /api/debtors/abono - Register payment/abono with atomic transaction & receipt generation
router.post('/abono', authenticateToken, async (req, res) => {
  try {
    const {
      customer_id,
      sale_id = null,
      amount,
      payment_method = 'efectivo',
      notes = ''
    } = req.body;

    const abonoAmount = parseFloat(amount);
    if (isNaN(abonoAmount) || abonoAmount <= 0) {
      return res.status(400).json({ success: false, error: 'El monto del abono debe ser mayor a 0.' });
    }

    const validMethods = ['efectivo', 'tarjeta', 'transferencia'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, error: 'Método de pago no válido.' });
    }

    const db = await getDb();
    const customer = db.get('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    if (customer.current_debt <= 0) {
      return res.status(400).json({ success: false, error: 'El cliente no tiene deudas pendientes activas.' });
    }

    if (abonoAmount > customer.current_debt) {
      return res.status(400).json({
        success: false,
        error: `El monto del abono ($${abonoAmount.toFixed(2)}) supera la deuda total del cliente ($${customer.current_debt.toFixed(2)}).`
      });
    }

    // Execute atomic abono transaction
    const transactionResult = db.transaction((tx) => {
      const prevDebt = customer.current_debt;
      const remainingDebt = Math.max(0, prevDebt - abonoAmount);

      // Generate receipt number ABO-000001
      const lastPayment = tx.get('SELECT id FROM debtor_payments ORDER BY id DESC LIMIT 1');
      const nextId = (lastPayment ? lastPayment.id : 0) + 1;
      const receiptNumber = `ABO-${String(nextId).padStart(6, '0')}`;

      // Check active cash shift
      const activeShift = tx.get('SELECT id FROM cash_shifts WHERE user_id = ? AND status = "open"', [req.user.id]);
      const cashShiftId = activeShift ? activeShift.id : null;

      // Distribute abono:
      // If sale_id is provided, apply to that specific sale
      let remainingToDistribute = abonoAmount;

      if (sale_id) {
        const sale = tx.get('SELECT * FROM sales WHERE id = ? AND customer_id = ?', [sale_id, customer_id]);
        if (!sale) {
          throw new Error('Venta no encontrada para este cliente.');
        }

        const newSaleDebt = Math.max(0, sale.debt_balance - abonoAmount);
        const newSaleStatus = newSaleDebt <= 0 ? 'paid' : 'partial';

        tx.run(`
          UPDATE sales
          SET debt_balance = ?, debt_status = ?
          WHERE id = ?
        `, [newSaleDebt, newSaleStatus, sale.id]);
      } else {
        // Distribute automatically across oldest unpaid sales
        const pendingSales = tx.query(`
          SELECT id, debt_balance
          FROM sales
          WHERE customer_id = ? AND debt_status IN ('pending', 'partial')
          ORDER BY created_at ASC
        `, [customer_id]);

        for (const s of pendingSales) {
          if (remainingToDistribute <= 0) break;

          if (remainingToDistribute >= s.debt_balance) {
            remainingToDistribute -= s.debt_balance;
            tx.run('UPDATE sales SET debt_balance = 0, debt_status = "paid" WHERE id = ?', [s.id]);
          } else {
            const newBal = s.debt_balance - remainingToDistribute;
            remainingToDistribute = 0;
            tx.run('UPDATE sales SET debt_balance = ?, debt_status = "partial" WHERE id = ?', [newBal, s.id]);
          }
        }
      }

      // Update customer total debt
      tx.run('UPDATE customers SET current_debt = ? WHERE id = ?', [remainingDebt, customer_id]);

      // Insert abono receipt
      const insertPayment = tx.run(`
        INSERT INTO debtor_payments (
          receipt_number, sale_id, customer_id, user_id, cash_shift_id,
          amount, payment_method, previous_debt, remaining_debt, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        receiptNumber,
        sale_id ? parseInt(sale_id, 10) : null,
        customer_id,
        req.user.id,
        cashShiftId,
        abonoAmount,
        payment_method,
        prevDebt,
        remainingDebt,
        notes.trim()
      ]);

      const paymentId = insertPayment.lastInsertRowid;

      // Update cash drawer if cash
      if (cashShiftId && payment_method === 'efectivo') {
        tx.run(`
          UPDATE cash_shifts
          SET abonos_cash = abonos_cash + ?, expected_cash = expected_cash + ?
          WHERE id = ?
        `, [abonoAmount, abonoAmount, cashShiftId]);
      }

      return {
        paymentId,
        receiptNumber,
        customerName: customer.name,
        amount: abonoAmount,
        previousDebt: prevDebt,
        remainingDebt,
        paymentMethod: payment_method,
        createdAt: new Date().toISOString()
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Abono registrado exitosamente.',
      receipt: transactionResult
    });
  } catch (error) {
    console.error('Error al registrar abono:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al procesar el abono.' });
  }
});

// GET /api/debtors/receipt/:receiptNumber - Get single receipt for printing
router.get('/receipt/:receiptNumber', authenticateToken, async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const db = await getDb();

    const payment = db.get(`
      SELECT p.*, c.name as customer_name, c.document_id as customer_document,
             c.phone as customer_phone, u.name as cashier_name, s.invoice_number
      FROM debtor_payments p
      JOIN customers c ON p.customer_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN sales s ON p.sale_id = s.id
      WHERE p.receipt_number = ?
    `, [receiptNumber]);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Recibo de abono no encontrado.' });
    }

    const settingsRows = db.query('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    return res.json({ success: true, payment, settings });
  } catch (error) {
    console.error('Error al obtener recibo de abono:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar el recibo.' });
  }
});

export default router;
