import React from 'react';
import { Printer, Download, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { generateAbonoReceiptPDF } from '../utils/pdfGenerator';

export default function AbonoReceiptModal({ isOpen, onClose, receipt, settings = {} }) {
  if (!receipt) return null;
  const currency = settings.currency_symbol || '$';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateAbonoReceiptPDF(receipt, settings);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comprobante de Abono: ${receipt.receiptNumber || receipt.receipt_number}`} maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-sm block text-emerald-900">¡Abono registrado con éxito!</span>
            El saldo de la deuda ha sido actualizado en la cuenta del cliente.
          </div>
        </div>

        {/* Receipt Slip Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 font-mono text-xs text-slate-800">
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <div className="font-bold text-sm">{settings.store_name || 'KiroPOS'}</div>
            <div className="text-[10px] text-slate-500">Comprobante de Ingreso / Abono a Deuda</div>
            <div className="font-bold text-slate-700 mt-1">{receipt.receiptNumber || receipt.receipt_number}</div>
          </div>

          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span className="text-slate-900 font-sans">{new Date(receipt.createdAt || receipt.created_at || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-bold text-slate-900 font-sans">{receipt.customerName || receipt.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Método:</span>
              <span className="uppercase text-slate-900">{receipt.paymentMethod || receipt.payment_method}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Deuda Anterior:</span>
              <span>{currency}{(receipt.previousDebt ?? receipt.previous_debt ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <span>MONTO ABONADO:</span>
              <span>{currency}{(receipt.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>NUEVO SALDO DEUDOR:</span>
              <span className="text-red-600">{currency}{(receipt.remainingDebt ?? receipt.remaining_debt ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {(receipt.notes) && (
            <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 italic">
              Nota: {receipt.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Descargar PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir Recibo
          </button>
        </div>
      </div>
    </Modal>
  );
}
