import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { getDb, forceSave } from './db/index.js';
import { initializeSchema } from './db/schema.js';

import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import salesRoutes from './routes/sales.js';
import debtorsRoutes from './routes/debtors.js';
import purchasesRoutes from './routes/purchases.js';
import expensesRoutes from './routes/expenses.js';
import cashRoutes from './routes/cash.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/debtors', debtorsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend build if it exists
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Catch-all route for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global safe error boundary
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor.' : err.message
  });
});

// Server Initialization
async function startServer() {
  try {
    const db = await getDb();
    await initializeSchema(db);
    console.log('Base de datos inicializada correctamente.');

    app.listen(PORT, HOST, () => {
      console.log(`===============================================`);
      console.log(`🚀 Servidor KiroPOS activo en http://${HOST}:${PORT}`);
      console.log(`📦 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nGuardando base de datos y cerrando servidor...');
  forceSave();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nTerminación recibida, guardando base de datos...');
  forceSave();
  process.exit(0);
});

startServer();
