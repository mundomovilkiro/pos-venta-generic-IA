import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  Package,
  Calendar,
  CheckCircle,
  Truck
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
          setTopProducts(res.topProducts || []);
          setRecentSales(res.recentSales || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400 text-xs">
        Cargando indicadores de negocio...
      </div>
    );
  }

  const s = stats || {};
  // Net cash balance estimate = revenue + abonos - expenses
  const netEstimated = (s.monthRevenue || 0) + (s.monthAbonosCollected || 0) - (s.monthExpenses || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <span>Dashboard & Rendimiento Comercial</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Resumen financiero integral de ventas, compras a proveedores, gastos y cuentas por cobrar.
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas Hoy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ventas de Hoy
            </span>
            <div className="text-xl font-black text-slate-900">
              {currency}{(s.todayRevenue || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">{s.todaySalesCount || 0} tickets emitidos hoy</span>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ventas del Mes
            </span>
            <div className="text-xl font-black text-primary-700">
              {currency}{(s.monthRevenue || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">{s.monthSalesCount || 0} operaciones mensuales</span>
          </div>
        </div>

        {/* Gastos del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gastos del Mes
            </span>
            <div className="text-xl font-black text-red-600">
              {currency}{(s.monthExpenses || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Salidas operativas</span>
          </div>
        </div>

        {/* Compras a Proveedores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Compras del Mes
            </span>
            <div className="text-xl font-black text-sky-700">
              {currency}{(s.monthPurchases || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Inversión en mercadería</span>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: Deuda Receivable & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cuentas por cobrar deudores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cuentas por Cobrar
            </span>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {currency}{(s.totalReceivableDebt || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {s.activeDebtorsCount || 0} clientes deudores activos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Abonos del mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Abonos Recaudados
            </span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {currency}{(s.monthAbonosCollected || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Cobranza de deudas este mes
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Alertas de inventario */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Alertas de Stock
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {s.lowStockItemsCount || 0} productos
            </div>
            <span className="text-[10px] text-amber-600 font-bold">
              Igual o por debajo del mínimo
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CHARTS & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Best Selling Products (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-600" />
            <span>Productos Más Vendidos este Mes</span>
          </h3>

          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Aún no hay ventas registradas este mes.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => {
                const maxSold = topProducts[0].total_sold || 1;
                const percentage = Math.round((p.total_sold / maxSold) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">
                        {idx + 1}. {p.product_name}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {p.total_sold} unids. ({currency}{p.total_amount?.toFixed(2)})
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions List (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            <span>Últimas Ventas Emitidas</span>
          </h3>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {recentSales.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No hay ventas recientes.
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{sale.invoice_number}</div>
                    <div className="text-[10px] text-slate-500">
                      {sale.customer_name || 'Mostrador'} • {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-slate-900">
                      {currency}{sale.total.toFixed(2)}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                        sale.is_credit
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sale.is_credit ? 'Crédito' : sale.payment_method}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
