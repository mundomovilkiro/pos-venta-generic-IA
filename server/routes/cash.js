import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cash/current - Get active open cash shift for the current user
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();

    const activeShift = db.get(`
      SELECT s.*, u.name as user_name
      FROM cash_shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ? AND s.status = 'open'
    `, [req.user.id]);

    return res.json({
      success: true,
      hasActiveShift: !!activeShift,
      shift: activeShift || null
    });
  } catch (error) {
    console.error('Error al consultar turno de caja actual:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar estado de caja.' });
  }
});

// POST /api/cash/open - Open a cash shift with starting cash float
router.post('/open', authenticateToken, async (req, res) => {
  try {
    const { initial_cash = 0, notes = '' } = req.body;
    const initialFloat = parseFloat(initial_cash) >= 0 ? parseFloat(initial_cash) : 0;

    const db = await getDb();

    // Check if user already has an open shift
    const existing = db.get('SELECT id FROM cash_shifts WHERE user_id = ? AND status = "open"', [req.user.id]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ya tiene un turno de caja abierto actualmente.' });
    }

    const result = db.run(`
      INSERT INTO cash_shifts (
        user_id, initial_cash, sales_cash, sales_card, sales_transfer,
        sales_credit, abonos_cash, total_expenses, expected_cash, status, notes
      ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, ?, 'open', ?)
    `, [req.user.id, initialFloat, initialFloat, notes.trim()]);

    const shift = db.get('SELECT * FROM cash_shifts WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: 'Turno de caja abierto exitosamente.',
      shift
    });
  } catch (error) {
    console.error('Error al abrir turno de caja:', error);
    return res.status(500).json({ success: false, error: 'Error al abrir turno de caja.' });
  }
});

// POST /api/cash/close - Close shift with reconciliation (Arqueo de caja)
router.post('/close', authenticateToken, async (req, res) => {
  try {
    const { actual_cash, notes = '' } = req.body;

    const countedCash = parseFloat(actual_cash);
    if (isNaN(countedCash) || countedCash < 0) {
      return res.status(400).json({ success: false, error: 'Debe ingresar el monto en efectivo contado en caja.' });
    }

    const db = await getDb();

    const activeShift = db.get('SELECT * FROM cash_shifts WHERE user_id = ? AND status = "open"', [req.user.id]);
    if (!activeShift) {
      return res.status(400).json({ success: false, error: 'No hay un turno de caja abierto para cerrar.' });
    }

    // Expected cash = initial_cash + sales_cash + abonos_cash - total_expenses
    const expected = activeShift.initial_cash + activeShift.sales_cash + activeShift.abonos_cash - activeShift.total_expenses;
    const difference = countedCash - expected;

    db.run(`
      UPDATE cash_shifts
      SET closed_at = CURRENT_TIMESTAMP,
          expected_cash = ?,
          actual_cash = ?,
          difference = ?,
          status = 'closed',
          notes = CASE WHEN ? != '' THEN ? ELSE notes END
      WHERE id = ?
    `, [
      expected,
      countedCash,
      difference,
      notes.trim(),
      notes.trim(),
      activeShift.id
    ]);

    const closedShift = db.get(`
      SELECT s.*, u.name as user_name
      FROM cash_shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [activeShift.id]);

    return res.json({
      success: true,
      message: 'Turno de caja cerrado exitosamente.',
      shift: closedShift
    });
  } catch (error) {
    console.error('Error al cerrar turno de caja:', error);
    return res.status(500).json({ success: false, error: 'Error al cerrar turno de caja.' });
  }
});

// GET /api/cash/history - History of closed shifts
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const shifts = db.query(`
      SELECT s.*, u.name as user_name
      FROM cash_shifts s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.opened_at DESC
      LIMIT 50
    `);

    return res.json({ success: true, shifts });
  } catch (error) {
    console.error('Error al obtener historial de caja:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar historial de turnos.' });
  }
});

export default router;
