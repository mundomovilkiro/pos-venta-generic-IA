import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Eye } from 'lucide-react';
import { generateSaleInvoiceA4PDF } from '../utils/pdfGenerator';

export default function ThermalReceipt({ sale, items = [], settings = {}, onOpenVirtual }) {
  const [paperWidth, setPaperWidth] = useState(settings.paper_size || '80mm');
  const currency = settings.currency_symbol || '$';

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateSaleInvoiceA4PDF(sale, items, settings);
  };

  const is80 = paperWidth === '80mm';

  return (
    <div>
      {/* Controls (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-4 bg-slate-100 rounded-xl border border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Papel térmico:</span>
          <button
            type="button"
            onClick={() => setPaperWidth('80mm')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              is80 ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            80mm Estándar
          </button>
          <button
            type="button"
            onClick={() => setPaperWidth('58mm')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              !is80 ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            58mm Compacto
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVirtual && (
            <button
              type="button"
              onClick={onOpenVirtual}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
            >
              <Eye className="w-4 h-4" /> Factura Virtual
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> PDF A4
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir Ticket
          </button>
        </div>
      </div>

      {/* Ticket Preview on Screen & Container for Window.Print */}
      <div className="flex justify-center p-4 bg-slate-200/60 rounded-xl overflow-x-auto no-print">
        <div
          className={`bg-white shadow-lg p-4 font-mono text-slate-800 border border-slate-300 transition-all ${
            is80 ? 'w-[320px] text-xs' : 'w-[250px] text-[11px]'
          }`}
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h2 className="font-bold text-sm uppercase tracking-tight">{settings.store_name || 'KIROPOS'}</h2>
            <p className="text-[10px] text-slate-600">{settings.store_document || 'J-00000000'}</p>
            <p className="text-[10px] text-slate-600">{settings.address || 'Av. Principal'}</p>
            <p className="text-[10px] text-slate-600">Tel: {settings.phone || '555-0000'}</p>
          </div>

          {/* Ticket Metadata */}
          <div className="py-2 text-[11px] border-b border-dashed border-slate-400 space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>TICKET / FACTURA:</span>
              <span>{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fecha:</span>
              <span>{new Date(sale.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Hora:</span>
              <span>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cajero:</span>
              <span>{sale.cashier_name || 'Caja 1'}</span>
            </div>

            {sale.customer_name && (
              <div className="pt-1 mt-1 border-t border-dashed border-slate-200">
                <div className="flex justify-between">
                  <span className="font-semibold">Cliente:</span>
                  <span className="truncate max-w-[170px]">{sale.customer_name}</span>
                </div>
                {sale.customer_document && (
                  <div className="flex justify-between text-slate-600">
                    <span>Doc:</span>
                    <span>{sale.customer_document}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tipo:</span>
                  <span className="uppercase font-semibold text-primary-700">
                    {sale.customer_category || 'simple'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <div className="flex justify-between font-bold pb-1 text-[11px]">
              <span>CANT / ARTÍCULO</span>
              <span>TOTAL</span>
            </div>
            <div className="space-y-1.5">
              {items.map((it, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-semibold truncate">{it.product_name}</div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>
                      {it.quantity} x {currency}{it.unit_price.toFixed(2)}
                      {it.discount > 0 && ` (-${currency}${it.discount.toFixed(2)})`}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {currency}{it.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-2 space-y-1 border-b border-dashed border-slate-400 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currency}{sale.subtotal.toFixed(2)}</span>
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
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300">
              <span>TOTAL:</span>
              <span>{currency}{sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Credit Details */}
          <div className="py-2 text-[11px] space-y-0.5 border-b border-dashed border-slate-400">
            <div className="flex justify-between">
              <span>Forma de Pago:</span>
              <span className="uppercase font-semibold">{sale.payment_method}</span>
            </div>
            {sale.is_credit ? (
              <>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Abono Inicial:</span>
                  <span>{currency}{sale.amount_paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>PENDIENTE (DEUDA):</span>
                  <span>{currency}{sale.debt_balance.toFixed(2)}</span>
                </div>
                {sale.due_date && (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Vencimiento:</span>
                    <span>{sale.due_date}</span>
                  </div>
                )}
              </>
            ) : (
              sale.payment_method === 'efectivo' && (
                <>
                  <div className="flex justify-between">
                    <span>Efectivo Recibido:</span>
                    <span>{currency}{sale.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Cambio / Vuelto:</span>
                    <span>{currency}{sale.change_given.toFixed(2)}</span>
                  </div>
                </>
              )
            )}
          </div>

          {/* QR Code and Footer */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center">
              <QRCodeSVG
                value={`FAC:${sale.invoice_number}|TOT:${sale.total}|FECHA:${sale.created_at}`}
                size={is80 ? 90 : 75}
                level="M"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-sans italic">
              Escanee para verificar comprobante
            </p>
            <p className="text-[11px] font-semibold text-slate-700 pt-1">
              {settings.receipt_footer || '¡Gracias por su compra!'}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden container rendered purely for window.print() */}
      <div className={`print-only thermal-receipt-container ${is80 ? 'thermal-80mm' : 'thermal-58mm'}`}>
        <div style={{ textAlign: 'center', paddingBottom: '4px', borderBottom: '1px dashed black' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{settings.store_name || 'KIROPOS'}</div>
          <div>{settings.store_document || 'J-00000000'}</div>
          <div>{settings.address || 'Av. Principal'}</div>
          <div>Tel: {settings.phone || '555-0000'}</div>
        </div>

        <div style={{ padding: '4px 0', borderBottom: '1px dashed black', fontSize: '11px' }}>
          <div><strong>TICKET: {sale.invoice_number}</strong></div>
          <div>Fecha: {new Date(sale.created_at).toLocaleString()}</div>
          <div>Cajero: {sale.cashier_name || 'Caja'}</div>
          {sale.customer_name && (
            <div>Cliente: {sale.customer_name} ({sale.customer_category})</div>
          )}
        </div>

        <div style={{ padding: '4px 0', borderBottom: '1px dashed black' }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: '3px' }}>
              <div>{it.product_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{it.quantity} x {currency}{it.unit_price.toFixed(2)}</span>
                <span>{currency}{it.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '4px 0', borderBottom: '1px dashed black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{currency}{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.tax_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Impuesto:</span>
              <span>{currency}{sale.tax_amount.toFixed(2)}</span>
            </div>
          )}
          {sale.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Descuento:</span>
              <span>-{currency}{sale.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
            <span>TOTAL:</span>
            <span>{currency}{sale.total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ padding: '4px 0', borderBottom: '1px dashed black' }}>
          <div>Pago: {sale.payment_method.toUpperCase()}</div>
          {sale.is_credit ? (
            <div><strong>Saldo Deudor: {currency}{sale.debt_balance.toFixed(2)}</strong></div>
          ) : (
            <div>Cambio: {currency}{sale.change_given.toFixed(2)}</div>
          )}
        </div>

        <div style={{ textAlign: 'center', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <QRCodeSVG
              value={`FAC:${sale.invoice_number}|TOT:${sale.total}`}
              size={70}
              level="M"
            />
          </div>
          <div>{settings.receipt_footer || '¡Gracias por su compra!'}</div>
        </div>
      </div>
    </div>
  );
}
