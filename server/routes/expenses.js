import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/expenses - List expenses with filters and summary
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;
    const db = await getDb();

    let sql = `
      SELECT e.*, u.name as user_name
      FROM expenses e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(e.created_at) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date(e.created_at) <= date(?)';
      params.push(end_date);
    }
    if (category && category !== 'all') {
      sql += ' AND e.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY e.created_at DESC LIMIT 150';

    const expenses = db.query(sql, params);

    // Calculate total summary
    let totalExpenses = 0;
    expenses.forEach(e => { totalExpenses += e.amount; });

    return res.json({
      success: true,
      totalExpenses,
      expenses
    });
  } catch (error) {
    console.error('Error al listar gastos:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar gastos.' });
  }
});

// POST /api/expenses - Register new expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      category = 'Otros',
      description,
      amount,
      payment_method = 'efectivo',
      reference = ''
    } = req.body;

    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, error: 'La descripción del gasto es obligatoria.' });
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ success: false, error: 'El monto debe ser mayor que 0.' });
    }

    const db = await getDb();

    const expenseResult = db.transaction((tx) => {
      // Generate sequential expense number GAS-000001
      const lastExpense = tx.get('SELECT id FROM expenses ORDER BY id DESC LIMIT 1');
      const nextId = (lastExpense ? lastExpense.id : 0) + 1;
      const expenseNumber = `GAS-${String(nextId).padStart(6, '0')}`;

      // Check active cash shift
      const activeShift = tx.get('SELECT id FROM cash_shifts WHERE user_id = ? AND status = "open"', [req.user.id]);
      const cashShiftId = activeShift ? activeShift.id : null;

      // Insert expense
      const insert = tx.run(`
        INSERT INTO expenses (
          expense_number, category, description, amount, payment_method, user_id, cash_shift_id, reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        expenseNumber,
        category.trim(),
        description.trim(),
        expenseAmount,
        payment_method,
        req.user.id,
        cashShiftId,
        reference.trim()
      ]);

      // Deduct from cash drawer expected cash if paid in cash
      if (cashShiftId && payment_method === 'efectivo') {
        tx.run(`
          UPDATE cash_shifts
          SET total_expenses = total_expenses + ?, expected_cash = expected_cash - ?
          WHERE id = ?
        `, [expenseAmount, expenseAmount, cashShiftId]);
      }

      return {
        expenseId: insert.lastInsertRowid,
        expenseNumber,
        amount: expenseAmount
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Gasto registrado exitosamente.',
      ...expenseResult
    });
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al procesar el gasto.' });
  }
});

// DELETE /api/expenses/:id - Delete expense and reverse drawer impact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const expense = db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Gasto no encontrado.' });
    }

    db.transaction((tx) => {
      if (expense.cash_shift_id && expense.payment_method === 'efectivo') {
        tx.run(`
          UPDATE cash_shifts
          SET total_expenses = total_expenses - ?, expected_cash = expected_cash + ?
          WHERE id = ?
        `, [expense.amount, expense.amount, expense.cash_shift_id]);
      }

      tx.run('DELETE FROM expenses WHERE id = ?', [id]);
    });

    return res.json({ success: true, message: 'Gasto eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar el gasto.' });
  }
});

export default router;
