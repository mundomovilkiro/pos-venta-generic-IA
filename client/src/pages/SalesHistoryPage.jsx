import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Eye, Calendar, Search, Filter, Share2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ThermalReceipt from '../components/ThermalReceipt';
import VirtualInvoiceModal from '../components/VirtualInvoiceModal';
import { generateSaleInvoiceA4PDF } from '../utils/pdfGenerator';

export default function SalesHistoryPage() {
  const { settings } = useAuth();
  const currency = settings.currency_symbol || '$';

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [search, setSearch] = useState('');

  // Modals for selected sale
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVirtualModalOpen, setIsVirtualModalOpen] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await api.getSales({
        start_date: filterDate || undefined,
        payment_method: filterPayment !== 'all' ? filterPayment : undefined
      });
      if (res.success) setSales(res.sales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filterDate, filterPayment]);

  const handleOpenReceipt = async (sale) => {
    try {
      const res = await api.getSale(sale.id);
      if (res.success) {
        setSelectedSale(res.sale);
        setSelectedItems(res.items);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenVirtual = async (sale) => {
    try {
      const res = await api.getSale(sale.id);
      if (res.success) {
        setSelectedSale(res.sale);
        setSelectedItems(res.items);
        setIsVirtualModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickDownloadPDF = async (sale) => {
    try {
      const res = await api.getSale(sale.id);
      if (res.success) {
        generateSaleInvoiceA4PDF(res.sale, res.items, settings);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoice_number.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-600" />
          <span>Historial de Ventas y Facturación</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Consulta de facturas emitidas, reimpresión de tickets térmicos, exportación a PDF y acceso a factura virtual.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número de factura o nombre de cliente..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          />

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
          >
            <option value="all">Todos los Métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="credito">Crédito (Deuda)</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">N° Factura</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Comprobantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Cargando ventas...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No se encontraron ventas registradas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isPaid = s.debt_status === 'paid' || (!s.is_credit && s.payment_method !== 'credito');

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.invoice_number}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {new Date(s.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {s.customer_name || 'Cliente Ocasional'}
                        {s.customer_category_name && (
                          <span className="block text-[10px] text-slate-400 uppercase">
                            ({s.customer_category_name})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 uppercase text-slate-600 font-medium">
                        {s.payment_method}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {currency}{s.total.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isPaid ? 'PAGADO' : 'CRÉDITO'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ticket button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(s)}
                            title="Imprimir Ticket Térmico"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF button */}
                          <button
                            type="button"
                            onClick={() => handleQuickDownloadPDF(s)}
                            title="Descargar PDF A4"
                            className="p-1.5 text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Virtual Invoice button */}
                          <button
                            type="button"
                            onClick={() => handleOpenVirtual(s)}
                            title="Ver Factura Virtual y Compartir"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Virtual</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* THERMAL RECEIPT MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title={`Ticket Térmico: ${selectedSale?.invoice_number || ''}`}
        maxWidth="max-w-md"
      >
        <ThermalReceipt
          sale={selectedSale}
          items={selectedItems}
          settings={settings}
          onOpenVirtual={() => {
            setIsReceiptModalOpen(false);
            setIsVirtualModalOpen(true);
          }}
        />
      </Modal>

      {/* VIRTUAL INVOICE MODAL */}
      <VirtualInvoiceModal
        isOpen={isVirtualModalOpen}
        onClose={() => setIsVirtualModalOpen(false)}
        sale={selectedSale}
        items={selectedItems}
        settings={settings}
        onPrintThermal={() => {
          setIsVirtualModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
      />
    </div>
  );
}
