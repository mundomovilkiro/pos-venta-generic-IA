import React, { useState, useEffect } from 'react';
import { TrendingDown, Plus, Trash2, Calendar, Filter, DollarSign } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function ExpensesPage() {
  const { settings, activeShift } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Servicios',
    description: '',
    amount: '',
    payment_method: 'efectivo',
    reference: ''
  });

  const categories = [
    'Alquiler',
    'Servicios (Luz, Agua, Internet)',
    'Nómina y Salarios',
    'Suministros y Empaque',
    'Transporte y Flete',
    'Mantenimiento y Reparación',
    'Otros Gastos Operativos'
  ];

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses({
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      if (res.success) {
        setExpenses(res.expenses);
        setTotalExpenses(res.totalExpenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('El monto del gasto debe ser mayor que 0.');
      return;
    }

    try {
      await api.createExpense({
        ...formData,
        amount: amt
      });
      setIsModalOpen(false);
      setFormData({
        category: 'Servicios (Luz, Agua, Internet)',
        description: '',
        amount: '',
        payment_method: 'efectivo',
        reference: ''
      });
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteExpense = async (id, desc) => {
    if (window.confirm(`¿Desea eliminar el gasto "${desc}"?`)) {
      try {
        await api.deleteExpense(id);
        loadExpenses();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <span>Control de Gastos y Egresos Operativos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de egresos por alquiler, servicios, nómina y sincronización con el arqueo de caja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* Summary & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Gastos Registrados
            </span>
            <div className="text-xl font-black text-red-600">
              {currency}{totalExpenses.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Category filter dropdown */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filtrar por Categoría:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 flex-1 max-w-xs"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">N° Gasto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Descripción</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Cargando gastos...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No hay gastos registrados en esta categoría.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{e.expense_number}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {e.description}
                      {e.reference && (
                        <span className="block text-[10px] text-slate-400">Ref: {e.reference}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 uppercase text-slate-600">{e.payment_method}</td>
                    <td className="py-3 px-3 text-right font-black text-red-600">
                      -{currency}{e.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(e.id, e.description)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Gasto Operativo"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Categoría del Gasto *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción del Gasto *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej. Pago de factura de luz eléctrica mes en curso"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monto ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Forma de Pago</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
              >
                <option value="efectivo">Efectivo (Sale de caja)</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta de Débito</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">N° Comprobante / Factura Externa (Opcional)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ej. Factura N° 98124"
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
