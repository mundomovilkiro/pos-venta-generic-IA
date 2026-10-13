import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, Printer, CheckCircle, Clock, Copy, Check } from 'lucide-react';
import Modal from './Modal';
import { generateSaleInvoiceA4PDF } from '../utils/pdfGenerator';

export default function VirtualInvoiceModal({ isOpen, onClose, sale, items = [], settings = {}, onPrintThermal }) {
  const [copied, setCopied] = useState(false);
  if (!sale) return null;

  const currency = settings.currency_symbol || '$';
  const isPaid = sale.debt_status === 'paid' || (!sale.is_credit && sale.payment_method !== 'credito');

  // Build virtual invoice URL
  const virtualInvoiceUrl = `${window.location.origin}/factura/${sale.invoice_number}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(virtualInvoiceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `🧾 *FACTURA VIRTUAL - ${settings.store_name || 'KiroPOS'}*\n\n` +
      `Estimado(a) *${sale.customer_name || 'Cliente'}*:\n` +
      `Detalle de su compra N° *${sale.invoice_number}*:\n` +
      `📅 Fecha: ${new Date(sale.created_at).toLocaleDateString()}\n` +
      `💳 Método: ${sale.payment_method.toUpperCase()}\n` +
      `💰 Total: *${currency}${sale.total.toFixed(2)}*\n` +
      `📌 Estado: *${isPaid ? '✅ PAGADO' : '⏳ PENDIENTE DE PAGO (CRÉDITO)'}*\n` +
      (sale.is_credit ? `⚠️ Saldo Deudor: *${currency}${sale.debt_balance.toFixed(2)}*\n` : '') +
      `\n🔗 Ver comprobante digital:\n${virtualInvoiceUrl}\n\n` +
      `_${settings.receipt_footer || '¡Gracias por su compra!'}_`;

    const cleanPhone = (sale.customer_phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Factura Virtual: ${sale.invoice_number}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" /> Enviar por WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Enlace copiado!' : 'Copiar Enlace'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateSaleInvoiceA4PDF(sale, items, settings)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
            {onPrintThermal && (
              <button
                onClick={onPrintThermal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Printer className="w-4 h-4" /> Ticket Térmico
              </button>
            )}
          </div>
        </div>

        {/* Digital Invoice Presentation Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Top Brand Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-bold tracking-wider uppercase text-primary-700 bg-primary-50 rounded-md">
                Comprobante Digital
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {settings.store_name || 'KiroPOS'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {settings.store_document && `RUC/Doc: ${settings.store_document} | `}
                {settings.address && `${settings.address} | `}
                {settings.phone && `Tel: ${settings.phone}`}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg font-mono font-bold text-slate-900">
                {sale.invoice_number}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(sale.created_at).toLocaleString()}
              </div>

              {/* Status Seal */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {isPaid ? (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" /> PAGADO
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="w-3.5 h-3.5" /> PENDIENTE DE PAGO (CRÉDITO)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Transaction Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Cliente</span>
              <div className="font-semibold text-slate-900 text-sm">
                {sale.customer_name || 'Cliente de Mostrador'}
              </div>
              {sale.customer_document && (
                <div className="text-slate-600">Doc: {sale.customer_document}</div>
              )}
              <div className="text-slate-600">
                Categoría:{' '}
                <span className="font-bold uppercase text-primary-700">
                  {sale.customer_category || 'simple'}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Detalles de Operación</span>
              <div className="text-slate-700">
                Método de pago: <span className="font-semibold uppercase">{sale.payment_method}</span>
              </div>
              <div className="text-slate-700">
                Atendido por: <span className="font-semibold">{sale.cashier_name || 'Caja'}</span>
              </div>
              {sale.due_date && (
                <div className="text-red-600 font-semibold mt-1">
                  Fecha Vencimiento: {sale.due_date}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-2 px-1">Producto</th>
                  <th className="py-2 px-2 text-center">Cant.</th>
                  <th className="py-2 px-2 text-right">Precio</th>
                  <th className="py-2 px-2 text-right">Desc.</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-1 font-medium text-slate-900">
                      {it.product_name}
                      {it.product_barcode && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {it.product_barcode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-700">
                      {it.quantity}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600">
                      {currency}{it.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {it.discount > 0 ? `-${currency}${it.discount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900">
                      {currency}{it.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown & QR Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start pt-4 border-t border-slate-200 gap-6">
            {/* Dynamic QR Verification */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <QRCodeSVG
                value={virtualInvoiceUrl}
                size={80}
                level="M"
              />
              <div className="text-[11px] text-slate-600 max-w-[180px]">
                <p className="font-bold text-slate-800">Verificación Digital</p>
                <p className="text-slate-500 mt-0.5">
                  Escanee este código QR para validar la autenticidad del documento.
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{currency}{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento global:</span>
                  <span>-{currency}{sale.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {sale.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Impuestos ({settings.tax_rate}%):</span>
                  <span>{currency}{sale.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-black text-slate-900">
                <span>TOTAL:</span>
                <span className="text-primary-700">{currency}{sale.total.toFixed(2)}</span>
              </div>

              {sale.is_credit ? (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 font-semibold">
                  <div className="flex justify-between text-emerald-700">
                    <span>Abonado:</span>
                    <span>{currency}{sale.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Saldo Deudor:</span>
                    <span>{currency}{sale.debt_balance.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                sale.payment_method === 'efectivo' && sale.amount_paid > 0 && (
                  <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span>Efectivo entregado:</span>
                      <span>{currency}{sale.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Cambio / Vuelto:</span>
                      <span>{currency}{sale.change_given.toFixed(2)}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
            {settings.receipt_footer || '¡Gracias por su compra! Vuelva pronto.'}
          </div>
        </div>
      </div>
    </Modal>
  );
}
