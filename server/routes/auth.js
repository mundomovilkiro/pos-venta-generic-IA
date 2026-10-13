import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { generateToken, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Debe ingresar usuario y contraseña.' });
    }

    const db = await getDb();
    const user = db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// GET /api/auth/me - Check current session
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = db.get('SELECT id, username, name, role, created_at FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return res.status(500).json({ success: false, error: 'Error interno al consultar usuario.' });
  }
});

// GET /api/auth/users - List users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const users = db.query('SELECT id, username, name, role, created_at FROM users ORDER BY id ASC');
    return res.json({ success: true, users });
  } catch (error) {
    console.error('Error en /api/auth/users:', error);
    return res.status(500).json({ success: false, error: 'Error al listar usuarios.' });
  }
});

// POST /api/auth/users - Create new cashier or admin (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
    }

    const validRole = role === 'admin' ? 'admin' : 'cajero';
    const db = await getDb();

    const existing = db.get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'El nombre de usuario ya está en uso.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = db.run(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      [username.trim(), hash, name.trim(), validRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ success: false, error: 'Error al crear usuario.' });
  }
});

export default router;
