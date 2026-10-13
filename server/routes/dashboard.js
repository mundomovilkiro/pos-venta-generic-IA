import express from 'express';
import { getDb } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats - Real-time metrics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();

    // 1. Today sales & revenue
    const todaySales = db.get(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' OR (is_credit = 1 AND amount_paid > 0) THEN (CASE WHEN is_credit = 1 THEN amount_paid ELSE total END) ELSE 0 END), 0) as cash_collected
      FROM sales
      WHERE date(created_at) = date('now')
    `);

    // 2. Month sales & revenue
    const monthSales = db.get(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    // 3. Month expenses
    const monthExpenses = db.get(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    // 4. Month purchases
    const monthPurchases = db.get(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_amount
      FROM purchases
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    // 5. Total debtors receivable
    const debtorsStats = db.get(`
      SELECT
        COUNT(CASE WHEN current_debt > 0 THEN 1 END) as debtors_count,
        COALESCE(SUM(current_debt), 0) as total_receivable
      FROM customers
    `);

    // 6. Abonos collected this month
    const monthAbonos = db.get(`
      SELECT COALESCE(SUM(amount), 0) as total_collected
      FROM debtor_payments
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    // 7. Products low on stock
    const lowStockCount = db.get(`
      SELECT COUNT(*) as count
      FROM products
      WHERE is_active = 1 AND stock <= min_stock
    `);

    // 8. Top 5 selling products
    const topProducts = db.query(`
      SELECT
        si.product_name,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')
      GROUP BY si.product_id, si.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 9. Recent 8 transactions
    const recentSales = db.query(`
      SELECT s.id, s.invoice_number, s.total, s.payment_method, s.is_credit, s.debt_status,
             s.created_at, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 8
    `);

    return res.json({
      success: true,
      stats: {
        todaySalesCount: todaySales.count,
        todayRevenue: todaySales.total_revenue,
        todayCashCollected: todaySales.cash_collected,
        monthSalesCount: monthSales.count,
        monthRevenue: monthSales.total_revenue,
        monthExpenses: monthExpenses.total_amount,
        monthPurchases: monthPurchases.total_amount,
        totalReceivableDebt: debtorsStats.total_receivable,
        activeDebtorsCount: debtorsStats.debtors_count,
        monthAbonosCollected: monthAbonos.total_collected,
        lowStockItemsCount: lowStockCount.count
      },
      topProducts,
      recentSales
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar métricas del negocio.' });
  }
});

export default router;
