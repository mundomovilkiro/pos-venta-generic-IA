import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/customers - List customers with category filter and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    const db = await getDb();

    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      sql += ' AND (name LIKE ? OR document_id LIKE ? OR phone LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && ['mayorista', 'frecuente', 'simple'].includes(category)) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY name ASC';

    const customers = db.query(sql, params);
    return res.json({ success: true, customers });
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar clientes.' });
  }
});

// GET /api/customers/:id - Single customer with debt details and recent sales
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const customer = db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const sales = db.query(`
      SELECT id, invoice_number, total, payment_method, is_credit, debt_status, debt_balance, created_at
      FROM sales
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [id]);

    const abonos = db.query(`
      SELECT id, receipt_number, amount, payment_method, remaining_debt, notes, created_at
      FROM debtor_payments
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [id]);

    return res.json({ success: true, customer, sales, abonos });
  } catch (error) {
    console.error('Error al consultar cliente:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener detalle del cliente.' });
  }
});

// POST /api/customers - Create customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      document_id = '',
      name,
      phone = '',
      email = '',
      address = '',
      category = 'simple',
      credit_limit = 0
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre del cliente es obligatorio.' });
    }

    const validCategory = ['mayorista', 'frecuente', 'simple'].includes(category) ? category : 'simple';
    const limit = parseFloat(credit_limit) >= 0 ? parseFloat(credit_limit) : 0;

    const db = await getDb();

    // Check document uniqueness if given
    if (document_id && document_id.trim() !== '') {
      const existing = db.get('SELECT id FROM customers WHERE document_id = ?', [document_id.trim()]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Ya existe un cliente con ese documento de identidad.' });
      }
    }

    const result = db.run(`
      INSERT INTO customers (
        document_id, name, phone, email, address, category, credit_limit, current_debt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      document_id.trim(),
      name.trim(),
      phone.trim(),
      email.trim(),
      address.trim(),
      validCategory,
      limit
    ]);

    return res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente.',
      customerId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar cliente.' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      document_id = '',
      name,
      phone = '',
      email = '',
      address = '',
      category,
      credit_limit
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre del cliente es obligatorio.' });
    }

    const db = await getDb();
    const existing = db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const validCategory = category && ['mayorista', 'frecuente', 'simple'].includes(category)
      ? category
      : existing.category;

    const limit = credit_limit !== undefined && parseFloat(credit_limit) >= 0
      ? parseFloat(credit_limit)
      : existing.credit_limit;

    if (document_id && document_id.trim() !== '' && document_id.trim() !== existing.document_id) {
      const docExists = db.get('SELECT id FROM customers WHERE document_id = ? AND id != ?', [document_id.trim(), id]);
      if (docExists) {
        return res.status(400).json({ success: false, error: 'Ya existe un cliente con ese documento de identidad.' });
      }
    }

    db.run(`
      UPDATE customers
      SET document_id = ?, name = ?, phone = ?, email = ?, address = ?,
          category = ?, credit_limit = ?
      WHERE id = ?
    `, [
      document_id.trim(),
      name.trim(),
      phone.trim(),
      email.trim(),
      address.trim(),
      validCategory,
      limit,
      id
    ]);

    return res.json({ success: true, message: 'Cliente actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar cliente.' });
  }
});

// DELETE /api/customers/:id - Delete customer if no outstanding debt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const customer = db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    if (customer.current_debt > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar el cliente porque posee una deuda activa de $${customer.current_debt.toFixed(2)}.`
      });
    }

    db.run('DELETE FROM customers WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar cliente.' });
  }
});

export default router;
