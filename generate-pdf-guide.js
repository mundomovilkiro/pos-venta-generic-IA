import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createGuidePDF() {
  const { jsPDF } = await import('./client/node_modules/jspdf/dist/jspdf.es.min.js');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;
  let pageNumber = 1;

  const primaryColor = [15, 23, 42];     // Slate 900
  const secondaryColor = [2, 132, 199];  // Sky / Primary 600
  const accentColor = [16, 185, 129];    // Emerald 500
  const lightBg = [248, 250, 252];       // Slate 50
  const textColor = [51, 65, 85];        // Slate 700
  const darkTextColor = [15, 23, 42];    // Slate 900

  function addHeader(title) {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('KIROPOS • GUÍA MAESTRA DE DESARROLLO Y MEJORA MODULAR', margin, 9);
    doc.text(`Página ${pageNumber}`, pageWidth - margin, 9, { align: 'right' });
  }

  function addFooter() {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Documentación Oficial de Ingeniería • Conservar para futuras sesiones de desarrollo', margin, pageHeight - 7);
    doc.text('KiroPOS v1.0', pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  function checkNewPage(neededSpace = 25) {
    if (y + neededSpace > pageHeight - margin) {
      addFooter();
      doc.addPage();
      pageNumber++;
      addHeader();
      y = margin + 6;
    }
  }

  function printTitle(text, subtitle = '') {
    checkNewPage(24);
    doc.setFillColor(...secondaryColor);
    doc.rect(margin, y, 3, 12, 'F');
    doc.setTextColor(...darkTextColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(text, margin + 6, y + 6);
    y += 10;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, margin + 6, y);
      y += 6;
    }
    y += 2;
  }

  function printSectionHeading(text) {
    checkNewPage(14);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(text, margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 6;
  }

  function printParagraph(text, spacing = 5) {
    checkNewPage(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textColor);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.2 + spacing;
  }

  function printBox(title, items = [], borderColor = [2, 132, 199], bgColor = [240, 249, 255]) {
    checkNewPage(items.length * 6 + 18);
    const boxStartY = y;
    const padding = 4;
    const estHeight = items.length * 5 + 14;

    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, y, contentWidth, estHeight, 2, 2, 'F');
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, estHeight, 2, 2, 'S');

    doc.setTextColor(...borderColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, margin + padding, y + padding + 3);

    let itemY = y + padding + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkTextColor);

    for (const item of items) {
      doc.text(`• ${item}`, margin + padding + 2, itemY);
      itemY += 5;
    }

    y += estHeight + 6;
  }

  function printTable(headers, rows, colWidths) {
    checkNewPage(rows.length * 7 + 16);
    const rowHeight = 6.5;

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let curX = margin;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], curX + 2, y + 4.5);
      curX += colWidths[i];
    }
    y += rowHeight;

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    for (let r = 0; r < rows.length; r++) {
      checkNewPage(rowHeight + 2);
      const isEven = r % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setTextColor(...darkTextColor);
      let cellX = margin;
      for (let c = 0; c < rows[r].length; c++) {
        const cellText = doc.splitTextToSize(String(rows[r][c]), colWidths[c] - 3);
        doc.text(cellText[0] || '', cellX + 2, y + 4.5);
        cellX += colWidths[c];
      }
      y += rowHeight;
    }
    y += 5;
  }

  // ==========================================
  // PÁGINA 1: PORTADA & INTRODUCCIÓN EJECUTIVA
  // ==========================================
  addHeader();
  y = 30;

  // Title block
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, 'S');

  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DOCUMENTO TÉCNICO & MANUAL DE PROCEDIMIENTOS', margin + 6, y + 8);

  doc.setTextColor(...primaryColor);
  doc.setFontSize(18);
  doc.text('KiroPOS: Guía Maestra de Desarrollo', margin + 6, y + 18);
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Metodología de Trabajo Modular, Aislamiento de Código y Prompts Seguros', margin + 6, y + 25);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Stack: Node.js + Express + SQLite (ACID) + React 18 + Tailwind CSS | Versión 1.0', margin + 6, y + 35);

  y += 50;

  printSectionHeading('1. ¿Por qué es fundamental esta guía?');
  printParagraph(
    'Al trabajar con asistentes de inteligencia artificial en aplicaciones de software comerciales (como este sistema POS), el principal desafío consiste en evitar efectos secundarios indeseados: que al modificar un botón o pantalla se reescriban accidentalmente otros archivos, se borre lógica previa o se introduzcan librerías incompatibles.'
  );
  printParagraph(
    'Este documento establece un protocolo estricto de ingeniería basado en la directiva "minimal-changes", proporcionándote el vocabulario exacto, las frases de blindaje y las plantillas de prompts recomendadas para iterar cada módulo con total seguridad y cero regresiones.'
  );

  printSectionHeading('2. Regla de Oro: La Directiva "minimal-changes"');
  printParagraph(
    'La skill "minimal-changes" es una instrucción técnica de alto rigor configurada en el proyecto. Cuando la invocas explícitamente en tu mensaje, la IA entra en un modo de trabajo con tres directivas inviolables:'
  );

  printBox(
    'DIRECTIVAS OBLIGATORIAS DE "MINIMAL-CHANGES":',
    [
      '1. Ediciones Quirúrgicas: Prohibido sobreescribir archivos enteros de cientos de líneas.',
      '2. Preservar la Arquitectura: Respetar nombres de variables, rutas y componentes existentes.',
      '3. Cero Afectación Cruzada: Modificar exclusivamente el bloque de código del requerimiento.'
    ],
    [2, 132, 199],
    [240, 249, 255]
  );

  // ==========================================
  // PÁGINA 2: ESTRUCTURA DE PROMPTS Y BLINDAJE
  // ==========================================
  checkNewPage(120);
  printTitle('Metodología para Solicitar Cambios', 'Estructura de 3 pasos y frases de blindaje para el asistente');

  printSectionHeading('1. La Fórmula de 3 Pasos (Estructura de la Petición)');
  printParagraph(
    'Para que el asistente entienda exactamente qué hacer sin desbordarse, estructura siempre tu solicitud en estos tres bloques claros:'
  );

  printBox(
    'FÓRMULA RECOMENDADA:',
    [
      '[PASO 1 - DELIMITAR SECTOR]: Nombra la pantalla o archivo exacto (ej. POSPage, Deudores, Inventario).',
      '[PASO 2 - BLINDAJE TÉCNICO]: Incluye "Aplica minimal-changes y no toques otros archivos".',
      '[PASO 3 - OBJETIVO PUNTUAL]: Describe el comportamiento exacto que deseas agregar o modificar.'
    ],
    [16, 185, 129],
    [236, 253, 245]
  );

  printSectionHeading('2. Frases Clave de Seguridad y Blindaje');
  printParagraph(
    'Estas frases actúan como restricciones directas en la toma de decisiones de la IA. Agrégalas al final de tus mensajes según el tipo de cambio:'
  );

  const securityRows = [
    ['"Aplica minimal-changes"', 'Impide la reescritura masiva de archivos y fuerza parches localizados.'],
    ['"Solo modifica el archivo X"', 'Aísla el contexto; prohíbe abrir o alterar componentes colaterales.'],
    ['"Solo diseño visual, no lógica"', 'Garantiza que la base de datos y cálculos permanezcan intactos.'],
    ['"Solo lógica backend, sin tocar UI"', 'Modifica consultas SQL o endpoints sin mover el layout visual.'],
    ['"No instales nuevas librerías"', 'Asegura estabilidad evitando dependencias npm que rompan el build.'],
    ['"Explícame antes de aplicar"', 'Pide un análisis previo paso a paso para dar tu visto bueno antes de codificar.']
  ];

  printTable(['Frase de Control', 'Efecto Técnico Garantizado'], securityRows, [60, 114]);

  // ==========================================
  // PÁGINA 3: MAPA COMPLETO DE MÓDULOS Y ARCHIVOS
  // ==========================================
  checkNewPage(120);
  printTitle('Mapa de Módulos y Archivos del Proyecto', 'Glosario de sectores para indicar dónde realizar cada ajuste');

  const moduleRows = [
    ['Punto de Venta (POS)', 'POSPage.jsx / sales.js', 'Carrito, escaneo de códigos de barra, selección de clientes y cobro.'],
    ['Control de Inventario', 'InventoryPage.jsx / products.js', 'Catálogo, stock mínimo, precios diferenciados y auditoría Kardex.'],
    ['Deudores & Abonos', 'DebtorsPage.jsx / debtors.js', 'Cartera de cuentas por cobrar, ventas fiadas y función de abonos.'],
    ['Compras (Proveedores)', 'PurchasesPage.jsx / purchases.js', 'Órdenes de compra a distribuidores y auto-reposición de stock.'],
    ['Gastos Operativos', 'ExpensesPage.jsx / expenses.js', 'Egresos por alquiler, servicios, nómina y sincronización de caja.'],
    ['Directorio de Clientes', 'CustomersPage.jsx / customers.js', 'Gestión de clientes y categorías (mayorista, frecuente, simple).'],
    ['Facturas & Historial', 'SalesHistoryPage.jsx', 'Libro de ventas, reimpresión y comprobantes digitales emitidos.'],
    ['Ticket Térmico (58/80mm)', 'ThermalReceipt.jsx', 'Plantilla ESC/POS para impresoras de rollo y directiva @media print.'],
    ['Factura Virtual / WhatsApp', 'VirtualInvoiceModal.jsx', 'Comprobante digital para compartir por enlace único y código QR.'],
    ['Exportación a PDF', 'pdfGenerator.js', 'Generador de facturas A4 formales y recibos con jsPDF.'],
    ['Turnos de Caja (Arqueo)', 'CashShiftModal.jsx / cash.js', 'Apertura de turno, fondo inicial, ventas en efectivo y cierre de caja.']
  ];

  printTable(['Sector Funcional', 'Archivos Clave', 'Responsabilidad en el Sistema'], moduleRows, [42, 45, 87]);

  printBox(
    'CONSEJO PRÁCTICO:',
    [
      'Si quieres saber qué archivo maneja una función específica, simplemente pregunta:',
      '"¿En qué archivo se encuentra la lógica de [X función]? No modifiques nada todavía."'
    ],
    [71, 85, 105],
    [241, 245, 249]
  );

  // ==========================================
  // PÁGINA 4: BANCO DE PROMPTS LISTOS PARA USAR
  // ==========================================
  checkNewPage(120);
  printTitle('Banco de Prompts Listos para Usar', 'Plantillas probadas para copiar, pegar y personalizar');

  printSectionHeading('Prompt 1: Ajustar el Diseño del Ticket Térmico');
  printParagraph(
    'Aplica minimal-changes. En ThermalReceipt.jsx, quiero ajustar [indicar cambio, ej. cambiar el tamaño de letra del total o agregar el mensaje de pie X]. No modifiques la lógica de cobro ni otros archivos.'
  );

  printSectionHeading('Prompt 2: Agregar un Campo al Formulario de Inventario');
  printParagraph(
    'Aplica minimal-changes. En el módulo de Inventario (InventoryPage.jsx y products.js), deseo añadir un campo opcional para [ej. ubicación en pasillo/estante]. Solo modifica este formulario y su endpoint sin alterar el POS ni deudores.'
  );

  printSectionHeading('Prompt 3: Modificar Reglas de Precios o Descuentos');
  printParagraph(
    'Aplica minimal-changes. En POSPage.jsx, quiero que cuando un cliente sea de categoría [X], se aplique automáticamente [regla de precio o descuento]. No alteres la visualización de la tarjeta del cliente ni las opciones de pago.'
  );

  printSectionHeading('Prompt 4: Personalizar la Factura Virtual o el Mensaje de WhatsApp');
  printParagraph(
    'Aplica minimal-changes. En VirtualInvoiceModal.jsx, deseo personalizar el texto predeterminado que se envía a WhatsApp para que diga [tu texto]. Mantén intacto el diseño del comprobante y el código QR.'
  );

  printSectionHeading('Prompt 5: Agregar un Nuevo Método de Pago');
  printParagraph(
    'Aplica minimal-changes. En POSPage.jsx y sales.js, deseo añadir la opción de pago [ej. Zelle, Tarjeta de Alimentación o Cheque]. Solo agrega el selector y el registro contable en caja sin modificar otras vistas.'
  );

  // ==========================================
  // PÁGINA 5: MANTENIMIENTO, RED LOCAL & BACKUPS
  // ==========================================
  checkNewPage(120);
  printTitle('Mantenimiento, Red Local y Backups', 'Instrucciones para operar y resguardar tu sistema KiroPOS');

  printSectionHeading('1. Cómo Hacer Copias de Seguridad (Backup de tu Base de Datos)');
  printParagraph(
    'Toda la información del sistema (productos, ventas, clientes, deudas, abonos, gastos e historial) se almacena en un archivo SQLite autónomo ubicado en:'
  );

  printBox(
    'RUTA DE LA BASE DE DATOS:',
    [
      'c:\\Users\\kiro\\Documents\\kiro\\pos de venta\\server\\data\\pos.sqlite',
      'Para respaldar: Simplemente copia este archivo a una memoria USB, Google Drive o Dropbox.',
      'Para restaurar: Pega el archivo pos.sqlite respaldado en esa misma carpeta y reinicia el servidor.'
    ],
    [16, 185, 129],
    [236, 253, 245]
  );

  printSectionHeading('2. Uso en Red Local (Celulares, Tablets o Múltiples PCs)');
  printParagraph(
    'El servidor está configurado por defecto para escuchar en "0.0.0.0:3000", lo que permite conectarte desde cualquier dispositivo conectado al mismo WiFi o red de tu negocio:'
  );

  printBox(
    'PASOS PARA CONECTAR OTROS DISPOSITIVOS:',
    [
      '1. Averigua la IP local de tu PC ejecutando en PowerShell: ipconfig (ej. 192.168.1.50).',
      '2. En el celular, tablet o segunda PC conectada al mismo WiFi, abre el navegador.',
      '3. Ingresa: http://192.168.1.50:3000',
      '4. ¡Listo! Puedes cobrar o registrar ventas desde el teléfono o tablet en tiempo real.'
    ],
    [2, 132, 199],
    [240, 249, 255]
  );

  printSectionHeading('3. Comandos Esenciales de Terminal');
  const cmdRows = [
    ['npm start', 'Inicia el servidor de producción con la interfaz compilada (http://localhost:3000).'],
    ['npm run build', 'Recompila todos los archivos del cliente (React + Tailwind) tras hacer cambios.'],
    ['npm run dev', 'Modo desarrollo simultáneo con recarga automática para cliente y servidor.']
  ];
  printTable(['Comando', 'Descripción y Uso'], cmdRows, [35, 139]);

  addFooter();

  // Save PDF to project root
  const outputPath = path.join(__dirname, 'Guia_Maestra_Desarrollo_KiroPOS.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log('PDF generado exitosamente en:', outputPath);
}

createGuidePDF().catch(console.error);
