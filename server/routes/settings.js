import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings - Retrieve all settings
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar configuración.' });
  }
});

// PUT /api/settings - Update settings (Admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newSettings = req.body;
    if (typeof newSettings !== 'object' || newSettings === null) {
      return res.status(400).json({ success: false, error: 'Datos de configuración inválidos.' });
    }

    const db = await getDb();

    db.transaction((tx) => {
      for (const [key, value] of Object.entries(newSettings)) {
        const strVal = String(value);
        const existing = tx.get('SELECT key FROM settings WHERE key = ?', [key]);
        if (existing) {
          tx.run('UPDATE settings SET value = ? WHERE key = ?', [strVal, key]);
        } else {
          tx.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, strVal]);
        }
      }
    });

    return res.json({ success: true, message: 'Configuración guardada exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return res.status(500).json({ success: false, error: 'Error al guardar la configuración.' });
  }
});

export default router;
