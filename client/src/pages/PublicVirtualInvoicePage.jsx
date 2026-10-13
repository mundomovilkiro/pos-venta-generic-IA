import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, Download, Printer, Share2, Store } from 'lucide-react';
import api from '../api/client';
import { generateSaleInvoiceA4PDF } from '../utils/pdfGenerator';

export default function PublicVirtualInvoicePage({ invoiceNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.getVirtualInvoice(invoiceNumber);
        if (res.success) {
          setData(res);
        } else {
          setError(res.error || 'Comprobante no encontrado.');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar el comprobante virtual.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-slate-500 font-semibold text-xs">Cargando factura virtual...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800">Comprobante no disponible</h2>
          <p className="text-xs text-slate-500 mt-2">{error || 'La factura no existe o ha sido dada de baja.'}</p>
        </div>
      </div>
    );
  }

  const { sale, items, settings } = data;
  const currency = settings.currency_symbol || '$';
  const isPaid = sale.debt_status === 'paid' || (!sale.is_credit && sale.payment_method !== 'credito');

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-xs no-print">
          <span className="text-xs font-bold text-slate-700">Factura Electrónica Digital</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateSaleInvoiceA4PDF(sale, items, settings)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-bold uppercase text-primary-700 bg-primary-50 rounded-md">
                Comprobante Oficial
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {settings.store_name || 'KiroPOS'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {settings.store_document && `RUC/Doc: ${settings.store_document} | `}
                {settings.address && `${settings.address} | `}
                {settings.phone && `Tel: ${settings.phone}`}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg font-mono font-black text-slate-900">
                {sale.invoice_number}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(sale.created_at).toLocaleString()}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
                {isPaid ? (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" /> PAGADO
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="w-3.5 h-3.5" /> CRÉDITO PENDIENTE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Cliente</span>
              <div className="font-bold text-slate-900 text-sm">
                {sale.customer_name || 'Cliente de Mostrador'}
              </div>
              {sale.customer_document && <div className="text-slate-600">Doc: {sale.customer_document}</div>}
              <div className="text-slate-600">
                Tipo: <span className="font-bold uppercase text-primary-700">{sale.customer_category}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Pago & Caja</span>
              <div className="text-slate-700">
                Forma de pago: <span className="font-semibold uppercase">{sale.payment_method}</span>
              </div>
              <div className="text-slate-700">
                Atendido por: <span className="font-semibold">{sale.cashier_name || 'Caja'}</span>
              </div>
              {sale.due_date && (
                <div className="text-red-600 font-bold mt-1">Vencimiento: {sale.due_date}</div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-1">Producto</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-2 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-2 text-right">Desc.</th>
                  <th className="py-2.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-1 font-semibold text-slate-900">{it.product_name}</td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700">{it.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-600">{currency}{it.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {it.discount > 0 ? `-${currency}${it.discount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-slate-900">{currency}{it.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start pt-4 border-t border-slate-200 gap-6">
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <QRCodeSVG value={window.location.href} size={85} level="M" />
              <div className="text-[11px] text-slate-600 max-w-[180px]">
                <p className="font-bold text-slate-800">Verificación Digital</p>
                <p className="text-slate-500 mt-0.5">Comprobante verificado emitido por {settings.store_name}.</p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{currency}{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento:</span>
                  <span>-{currency}{sale.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {sale.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Impuesto ({settings.tax_rate}%):</span>
                  <span>{currency}{sale.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-black text-slate-900">
                <span>TOTAL:</span>
                <span className="text-primary-700">{currency}{sale.total.toFixed(2)}</span>
              </div>

              {sale.is_credit && (
                <div className="pt-2 border-t border-dashed border-slate-200 text-red-600 font-bold flex justify-between">
                  <span>Saldo Deudor:</span>
                  <span>{currency}{sale.debt_balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
            {settings.receipt_footer || '¡Gracias por su compra! Vuelva pronto.'}
          </div>
        </div>
      </div>
    </div>
  );
}
