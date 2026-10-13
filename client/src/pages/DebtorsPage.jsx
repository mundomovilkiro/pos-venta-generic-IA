import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Search,
  PlusCircle,
  Printer,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import AbonoReceiptModal from '../components/AbonoReceiptModal';

export default function DebtorsPage() {
  const { settings, activeShift } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [debtors, setDebtors] = useState([]);
  const [stats, setStats] = useState({
    total_debt_receivable: 0,
    debtors_count: 0,
    overdue_count: 0,
    abonos_this_month: 0
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Abono Payment Modal
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [abonoForm, setAbonoForm] = useState({
    amount: '',
    payment_method: 'efectivo',
    sale_id: '',
    notes: ''
  });
  const [abonoSubmitting, setAbonoSubmitting] = useState(false);
  const [abonoError, setAbonoError] = useState('');

  // Completed Abono Receipt Modal
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Statement / Estado de Cuenta Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadDebtors = async () => {
    setLoading(true);
    try {
      const res = await api.getDebtors();
      if (res.success) {
        setDebtors(res.debtors || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error cargando cartera de deudores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebtors();
  }, []);

  // Open Abono Modal
  const handleOpenAbono = async (debtor) => {
    setSelectedDebtor(debtor);
    setAbonoForm({
      amount: '',
      payment_method: 'efectivo',
      sale_id: '',
      notes: ''
    });
    setAbonoError('');
    setIsAbonoModalOpen(true);

    // Also fetch pending sales to populate dropdown if needed
    try {
      const detailRes = await api.getDebtorDetails(debtor.id);
      if (detailRes.success) {
        setStatementData(detailRes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Abono
  const handleSubmitAbono = async (e) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    const amt = parseFloat(abonoForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setAbonoError('El monto del abono debe ser mayor a 0.');
      return;
    }

    if (amt > selectedDebtor.current_debt) {
      setAbonoError(`El monto no puede superar la deuda total (${currency}${selectedDebtor.current_debt.toFixed(2)}).`);
      return;
    }

    setAbonoError('');
    setAbonoSubmitting(true);

    try {
      const payload = {
        customer_id: selectedDebtor.id,
        sale_id: abonoForm.sale_id ? parseInt(abonoForm.sale_id, 10) : null,
        amount: amt,
        payment_method: abonoForm.payment_method,
        notes: abonoForm.notes
      };

      const res = await api.registerAbono(payload);
      if (res.success) {
        setIsAbonoModalOpen(false);
        setCompletedReceipt(res.receipt);
        setIsReceiptModalOpen(true);
        loadDebtors();
      }
    } catch (err) {
      setAbonoError(err.message || 'Error al procesar el abono.');
    } finally {
      setAbonoSubmitting(false);
    }
  };

  // Open Detailed Statement Modal
  const handleOpenStatement = async (debtor) => {
    setSelectedDebtor(debtor);
    setStatementLoading(true);
    setIsStatementModalOpen(true);
    try {
      const res = await api.getDebtorDetails(debtor.id);
      if (res.success) {
        setStatementData(res);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setStatementLoading(false);
    }
  };

  const filteredDebtors = debtors.filter((d) => {
    const s = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(s) ||
      (d.document_id && d.document_id.toLowerCase().includes(s)) ||
      (d.phone && d.phone.includes(s))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-600" />
          <span>Control de Deudores y Cuentas por Cobrar</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Seguimiento de compras al crédito (fiadas), saldos pendientes y registro inmediato de abonos con comprobante.
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deuda Pendiente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total por Cobrar
            </span>
            <div className="text-2xl font-mono font-black text-rose-600 tracking-tight">
              {currency}{stats.total_debt_receivable.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Saldo global en calle</span>
          </div>
        </div>

        {/* Clientes Deudores Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Clientes Deudores
            </span>
            <div className="text-2xl font-mono font-black text-slate-900 tracking-tight">
              {stats.debtors_count}
            </div>
            <span className="text-[10px] text-slate-500">Con saldo pendiente</span>
          </div>
        </div>

        {/* Deudas Vencidas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ventas Vencidas
            </span>
            <div className="text-2xl font-mono font-black text-indigo-700 tracking-tight">
              {stats.overdue_count}
            </div>
            <span className="text-[10px] text-slate-500">Créditos fuera de plazo</span>
          </div>
        </div>

        {/* Abonos Cobrados en el Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Abonos del Mes
            </span>
            <div className="text-2xl font-mono font-black text-emerald-600 tracking-tight">
              {currency}{stats.abonos_this_month.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Recaudado este mes</span>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar deudor por nombre, documento o teléfono..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>
      </div>

      {/* DEBTORS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Cliente Deudor</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Límite de Crédito</th>
                <th className="py-3 px-3 text-center">Ventas Fiadas</th>
                <th className="py-3 px-3 text-right">Saldo Deuda Actual</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Cargando deudores...
                  </td>
                </tr>
              ) : filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-60" />
                    <p className="font-bold text-slate-700">No hay clientes deudores pendientes</p>
                    <p className="text-xs text-slate-400 mt-0.5">Todas las cuentas al crédito están saldadas.</p>
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {d.document_id && <span>Doc: {d.document_id}</span>}
                        {d.phone && <span>Tel: {d.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${
                          d.category === 'mayorista'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                            : d.category === 'frecuente'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-slate-100 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {d.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600 font-mono font-medium">
                      {d.credit_limit > 0 ? `${currency}${d.credit_limit.toFixed(2)}` : 'Sin límite'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px]">
                        {d.pending_sales_count || 1} pend.
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-mono font-black text-rose-600">
                        {currency}{d.current_debt.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Botón Registrar Abono */}
                        <button
                          type="button"
                          onClick={() => handleOpenAbono(d)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all duration-150 active:scale-95"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Abonar</span>
                        </button>

                        {/* Botón Estado de Cuenta */}
                        <button
                          type="button"
                          onClick={() => handleOpenStatement(d)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-all duration-150 active:scale-95 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Detalle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ABONO PAYMENT MODAL */}
      <Modal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        title={`Registrar Abono: ${selectedDebtor?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitAbono} className="space-y-4 text-xs">
          {abonoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold">
              {abonoError}
            </div>
          )}

          {/* Current Debt Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Cliente:</span>
              <span className="font-bold text-slate-900">{selectedDebtor?.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Deuda Total Pendiente:</span>
              <span className="font-black text-sm text-red-600">
                {currency}{selectedDebtor?.current_debt?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Abono Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Monto del Abono ({currency}) *</label>
              <button
                type="button"
                onClick={() => setAbonoForm({ ...abonoForm, amount: selectedDebtor?.current_debt?.toFixed(2) || '0' })}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700"
              >
                Pagar Deuda Total
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-slate-400">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={abonoForm.amount}
                onChange={(e) => setAbonoForm({ ...abonoForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Método de Pago</label>
            <select
              value={abonoForm.payment_method}
              onChange={(e) => setAbonoForm({ ...abonoForm, payment_method: e.target.value })}
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
            >
              <option value="efectivo">Efectivo (Entra en caja de turno)</option>
              <option value="transferencia">Transferencia Bancaria / Pago Móvil</option>
              <option value="tarjeta">Tarjeta de Débito / Crédito</option>
            </select>
          </div>

          {/* Optional specific sale selection */}
          {statementData?.pendingSales && statementData.pendingSales.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Aplicar a Factura Específica (Opcional)</label>
              <select
                value={abonoForm.sale_id}
                onChange={(e) => setAbonoForm({ ...abonoForm, sale_id: e.target.value })}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-700"
              >
                <option value="">Abonar a la cuenta general (Facturas más antiguas primero)</option>
                {statementData.pendingSales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.invoice_number} - Saldo: ${s.debt_balance.toFixed(2)} ({s.created_at?.slice(0, 10)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas / Referencia</label>
            <input
              type="text"
              value={abonoForm.notes}
              onChange={(e) => setAbonoForm({ ...abonoForm, notes: e.target.value })}
              placeholder="Ej. Pago parcial acordado, ref transferencia..."
              className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          {/* Remaining Debt Live Preview */}
          {parseFloat(abonoForm.amount) > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-bold">
              <span className="text-emerald-900">Nuevo Saldo Restante:</span>
              <span className="text-slate-900 text-sm">
                {currency}
                {Math.max(
                  0,
                  (selectedDebtor?.current_debt || 0) - (parseFloat(abonoForm.amount) || 0)
                ).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAbonoModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={abonoSubmitting}
              className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {abonoSubmitting ? 'Procesando Abono...' : 'Confirmar y Generar Recibo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* COMPLETED ABONO RECEIPT MODAL */}
      <AbonoReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={completedReceipt}
        settings={settings}
      />

      {/* DETAILED STATEMENT MODAL */}
      <Modal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        title={`Estado de Cuenta: ${selectedDebtor?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-xs">
          {/* Debtor Header summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 block">Deuda Total Activa:</span>
              <span className="text-lg font-black text-red-600">
                {currency}{statementData?.customer?.current_debt?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Límite de Crédito:</span>
              <span className="font-bold text-slate-800">
                {statementData?.customer?.credit_limit > 0
                  ? `${currency}${statementData.customer.credit_limit.toFixed(2)}`
                  : 'Sin límite'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Categoría:</span>
              <span className="font-bold uppercase text-primary-700">
                {statementData?.customer?.category}
              </span>
            </div>
          </div>

          {/* Pending Invoices */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Ventas al Crédito Pendientes</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Factura</th>
                    <th className="py-2.5 px-3">Fecha Venta</th>
                    <th className="py-2.5 px-3">Vencimiento</th>
                    <th className="py-2.5 px-3 text-right">Total Orig.</th>
                    <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementData?.pendingSales?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-slate-400">
                        No hay facturas pendientes.
                      </td>
                    </tr>
                  ) : (
                    statementData?.pendingSales?.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.invoice_number}</td>
                        <td className="py-2.5 px-3 text-slate-600">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          {s.due_date ? (
                            <span className={s.is_overdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                              {s.due_date} {s.is_overdue && '(Vencida)'}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{currency}{s.total.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-red-600">{currency}{s.debt_balance.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              s.debt_status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.debt_status === 'partial' ? 'Parcial' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Abonos History */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Historial de Abonos Recibidos</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">N° Recibo</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Monto Abonado</th>
                    <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                    <th className="py-2.5 px-3">Cajero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementData?.abonos?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-slate-400">
                        No se han registrado abonos todavía.
                      </td>
                    </tr>
                  ) : (
                    statementData?.abonos?.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{a.receipt_number}</td>
                        <td className="py-2.5 px-3 text-slate-600">{new Date(a.created_at).toLocaleString()}</td>
                        <td className="py-2.5 px-3 uppercase text-slate-700">{a.payment_method}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-600">{currency}{a.amount.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{currency}{a.remaining_debt.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-500">{a.cashier_name || 'Caja'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsStatementModalOpen(false)}
              className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
