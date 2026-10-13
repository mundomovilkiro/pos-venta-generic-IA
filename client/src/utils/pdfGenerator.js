import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateSaleInvoiceA4PDF(sale, items, settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = settings.currency_symbol || '$';
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [2, 132, 199]; // Primary 600

  // 1. Company Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.store_name || 'KiroPOS Sistema de Ventas', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RUC/NIT/Doc: ${settings.store_document || ''} | Tel: ${settings.phone || ''} | ${settings.address || ''}`, 14, 22);

  // 2. Invoice Meta Info
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`FACTURA ELECTRÓNICA: ${sale.invoice_number}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha y Hora: ${new Date(sale.created_at).toLocaleString()}`, 14, 44);
  doc.text(`Cajero: ${sale.cashier_name || 'Caja Principal'}`, 14, 49);
  doc.text(`Método de Pago: ${sale.payment_method.toUpperCase()} ${sale.is_credit ? '(CRÉDITO / FIADO)' : ''}`, 14, 54);

  // Status Badge
  const isPaid = sale.debt_status === 'paid' || (!sale.is_credit && sale.payment_method !== 'credito');
  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 242, isPaid ? 231 : 242);
  doc.roundedRect(150, 32, 46, 20, 2, 2, 'F');
  doc.setTextColor(isPaid ? 22 : 185, isPaid ? 101 : 28, isPaid ? 52 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isPaid ? 'PAGADO' : 'PENDIENTE', 173, 43, { align: 'center' });
  doc.setFontSize(8);
  doc.text(isPaid ? 'Comprobante Válido' : 'Cuenta por Cobrar', 173, 49, { align: 'center' });

  // 3. Customer Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 60, 182, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 60, 182, 22, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL CLIENTE:', 18, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${sale.customer_name || 'Cliente Ocasional / Mostrador'}`, 18, 72);
  doc.text(`Documento: ${sale.customer_document || 'N/A'}`, 18, 77);
  doc.text(`Categoría: ${(sale.customer_category || 'simple').toUpperCase()}`, 110, 72);
  doc.text(`Teléfono / Dirección: ${sale.customer_phone || ''} ${sale.customer_address ? `| ${sale.customer_address}` : ''}`, 110, 77);

  // 4. Items Table
  const tableRows = items.map((it, idx) => [
    idx + 1,
    it.product_name,
    it.quantity.toFixed(2),
    `${currency}${it.unit_price.toFixed(2)}`,
    it.discount > 0 ? `-${currency}${it.discount.toFixed(2)}` : '-',
    `${currency}${it.subtotal.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 88,
    head: [['#', 'Producto / Descripción', 'Cant.', 'Precio Unit.', 'Desc.', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 85 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' }
    }
  });

  // 5. Totals Breakdown
  const finalY = doc.lastAutoTable.finalY + 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const rightAlignX = 196;
  let curY = finalY;

  doc.text('Subtotal:', 140, curY);
  doc.text(`${currency}${sale.subtotal.toFixed(2)}`, rightAlignX, curY, { align: 'right' });
  curY += 5;

  if (sale.discount_amount > 0) {
    doc.text('Descuento General:', 140, curY);
    doc.text(`-${currency}${sale.discount_amount.toFixed(2)}`, rightAlignX, curY, { align: 'right' });
    curY += 5;
  }

  if (sale.tax_amount > 0) {
    doc.text(`Impuesto (${settings.tax_rate || 0}%):`, 140, curY);
    doc.text(`${currency}${sale.tax_amount.toFixed(2)}`, rightAlignX, curY, { align: 'right' });
    curY += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL A PAGAR:', 140, curY + 2);
  doc.text(`${currency}${sale.total.toFixed(2)}`, rightAlignX, curY + 2, { align: 'right' });

  curY += 10;
  if (sale.is_credit) {
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text(`Monto Abonado: ${currency}${sale.amount_paid.toFixed(2)}`, 140, curY);
    curY += 5;
    doc.text(`Saldo Pendiente (Deuda): ${currency}${sale.debt_balance.toFixed(2)}`, 140, curY);
    if (sale.due_date) {
      curY += 5;
      doc.text(`Vencimiento: ${sale.due_date}`, 140, curY);
    }
  } else if (sale.payment_method === 'efectivo' && sale.amount_paid > 0) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Efectivo Recibido: ${currency}${sale.amount_paid.toFixed(2)}`, 140, curY);
    curY += 5;
    doc.text(`Cambio / Vuelto: ${currency}${sale.change_given.toFixed(2)}`, 140, curY);
  }

  // Footer notes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.receipt_footer || '¡Gracias por preferirnos!', 105, 280, { align: 'center' });

  doc.save(`Factura_${sale.invoice_number}.pdf`);
}

export function generateAbonoReceiptPDF(payment, settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150] // Compact thermal/receipt dimensions
  });

  const currency = settings.currency_symbol || '$';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(settings.store_name || 'KiroPOS', 40, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`RUC/Doc: ${settings.store_document || ''}`, 40, 14, { align: 'center' });
  doc.text(`Tel: ${settings.phone || ''}`, 40, 18, { align: 'center' });

  doc.setLineWidth(0.2);
  doc.line(5, 22, 75, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('COMPROBANTE DE ABONO', 40, 27, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Recibo N°: ${payment.receipt_number}`, 40, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Fecha: ${new Date(payment.created_at).toLocaleString()}`, 5, 38);
  doc.text(`Cajero: ${payment.cashier_name || 'Caja'}`, 5, 43);
  doc.text(`Cliente: ${payment.customer_name}`, 5, 48);
  doc.text(`Doc: ${payment.customer_document || 'N/A'}`, 5, 53);
  if (payment.invoice_number) {
    doc.text(`Aplica a Factura: ${payment.invoice_number}`, 5, 58);
  }

  doc.line(5, 62, 75, 62);

  doc.setFontSize(8);
  doc.text('Deuda Anterior:', 5, 68);
  doc.text(`${currency}${payment.previous_debt.toFixed(2)}`, 75, 68, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MONTO ABONADO:', 5, 75);
  doc.text(`${currency}${payment.amount.toFixed(2)}`, 75, 75, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Método: ${payment.payment_method.toUpperCase()}`, 5, 81);

  doc.line(5, 85, 75, 85);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NUEVO SALDO DEUDOR:', 5, 91);
  doc.text(`${currency}${payment.remaining_debt.toFixed(2)}`, 75, 91, { align: 'right' });

  if (payment.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(`Nota: ${payment.notes}`, 5, 98);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Conserve este comprobante como respaldo.', 40, 115, { align: 'center' });

  doc.save(`Recibo_Abono_${payment.receipt_number}.pdf`);
}
