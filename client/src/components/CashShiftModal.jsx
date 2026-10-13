import React, { useState } from 'react';
import { DollarSign, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CashShiftModal({ isOpen, onClose, onShiftUpdated }) {
  const { activeShift, refreshShift, settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [initialCash, setInitialCash] = useState('50.00');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOpenMode = !activeShift;

  const expectedCash = activeShift
    ? activeShift.initial_cash + activeShift.sales_cash + activeShift.abonos_cash - activeShift.total_expenses
    : 0;

  const counted = parseFloat(actualCash) || 0;
  const difference = counted - expectedCash;

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.openShift({
        initial_cash: parseFloat(initialCash) || 0,
        notes
      });
      if (res.success) {
        await refreshShift();
        if (onShiftUpdated) onShiftUpdated();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (actualCash === '') {
      setError('Por favor ingrese el monto de dinero contado en caja.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.closeShift({
        actual_cash: counted,
        notes
      });
      if (res.success) {
        await refreshShift();
        if (onShiftUpdated) onShiftUpdated();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isOpenMode ? 'Apertura de Turno de Caja' : 'Cierre y Arqueo de Caja'}
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="p-3 mb-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {isOpenMode ? (
        <form onSubmit={handleOpenShift} className="space-y-4">
          <p className="text-xs text-slate-600">
            Abra el turno indicando el fondo inicial o saldo base en efectivo disponible en gaveta.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fondo Inicial en Efectivo ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas / Observaciones</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej. Billetes de baja denominación para cambio..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Abriendo turno...' : 'Confirmar Apertura de Caja'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCloseShift} className="space-y-4">
          {/* Shift Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Fondo Inicial de Caja:</span>
              <span className="font-semibold text-slate-800">{currency}{activeShift.initial_cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>(+) Ventas en Efectivo:</span>
              <span className="font-semibold">{currency}{activeShift.sales_cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>(+) Abonos Cobrados en Efectivo:</span>
              <span className="font-semibold">{currency}{activeShift.abonos_cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>(-) Gastos / Salidas en Efectivo:</span>
              <span className="font-semibold">{currency}{activeShift.total_expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
              <span>Total Esperado en Caja:</span>
              <span className="text-primary-700">{currency}{expectedCash.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Efectivo Físico Contado en Caja ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Difference Indicator */}
          {actualCash !== '' && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                Math.abs(difference) < 0.01
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                  : difference > 0
                  ? 'bg-sky-50 border-sky-200 text-sky-800 font-semibold'
                  : 'bg-red-50 border-red-200 text-red-800 font-semibold'
              }`}
            >
              <span>
                {Math.abs(difference) < 0.01
                  ? 'Caja cuadrada exactamente (Sin diferencia)'
                  : difference > 0
                  ? 'Sobrante en caja:'
                  : 'Faltante en caja:'}
              </span>
              <span className="font-bold text-sm">
                {difference > 0 ? `+${currency}${difference.toFixed(2)}` : `${currency}${difference.toFixed(2)}`}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas de Cierre</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Observaciones sobre el arqueo o turno..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Cerrando caja...' : 'Cerrar Turno de Caja'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
