import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';
import Bill from '@db/models/bill.model.ts';
import Setting from '@db/models/setting.model.ts';

// Helper: draw dashed line
function drawDashedLine(doc: PDFKit.PDFDocument, startX: number, y: number, endX: number, dashLen = 3, spaceLen = 2) {
  doc.save();
  doc.strokeColor('#94a3b8').lineWidth(0.75).dash(dashLen, { space: spaceLen });
  doc.moveTo(startX, y).lineTo(endX, y).stroke();
  doc.undash().restore();
}

/**
 * Renders an authentic, compact thermal receipt (80mm, 110mm, or narrow custom sizes)
 */
function renderThermalReceipt(
  doc: PDFKit.PDFDocument,
  bill: any,
  options: {
    pdfTitle: string;
    pdfMargin: number;
    pdfLogoSize: number;
    pageWidth: number;
    pageHeight: number;
    contentWidth: number;
  }
) {
  const { pdfTitle, pdfMargin, pdfLogoSize, pageWidth, pageHeight, contentWidth } = options;
  const rightBound = pageWidth - pdfMargin;

  const darkText = '#111827';
  const mutedText = '#4b5563';
  const primaryColor = '#1e40af';

  let currentY = pdfMargin;

  // 1. Logo
  const logoPath = path.join(process.cwd(), '../frontend/public/final_logo.png');
  const logoSize = Math.min(pdfLogoSize, pageWidth > 260 ? 40 : 32);
  if (fs.existsSync(logoPath)) {
    try {
      const logoX = (pageWidth - logoSize) / 2;
      doc.image(logoPath, logoX, currentY, { width: logoSize, height: logoSize });
      currentY += logoSize + 6;
    } catch (err) {
      console.warn('Failed to embed SRM logo on thermal receipt:', err);
    }
  }

  // 2. Header Information
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(pageWidth > 260 ? 12 : 10.5)
    .text(pdfTitle, pdfMargin, currentY, { width: contentWidth, align: 'center' });
  currentY += 14;

  doc
    .fillColor(mutedText)
    .font('Helvetica')
    .fontSize(6.5)
    .text('SRM INSTITUTE OF SCIENCE & TECHNOLOGY', pdfMargin, currentY, { width: contentWidth, align: 'center' });
  currentY += 10;

  doc
    .fontSize(5.5)
    .text('125, Angel Street, Thirumalai Nagar, Ramapuram, Chennai - 600 089', pdfMargin, currentY, { width: contentWidth, align: 'center' })
    .text('GSTIN: 33AALPS4307B7ZV  |  Xerox & DTP Services', pdfMargin, currentY + 8, { width: contentWidth, align: 'center' });
  currentY += 20;

  // Separator
  drawDashedLine(doc, pdfMargin, currentY, rightBound);
  currentY += 7;

  // 3. Receipt Details
  doc
    .fillColor(darkText)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('TAX INVOICE / CASH BILL', pdfMargin, currentY, { width: contentWidth, align: 'center' });
  currentY += 12;

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(bill.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const shopName = bill.shop?.name || bill.createdBy?.shop?.name || 'Central Xerox Store';
  const operatorEmail = bill.createdBy?.email || 'operator@srmist.edu.in';
  const branchName = bill.branch?.name || 'Main Campus';

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(mutedText)
    .text(`Bill No: `, pdfMargin, currentY, { continued: true })
    .fillColor(darkText)
    .font('Helvetica-Bold')
    .text(bill.code || 'N/A')
    .font('Helvetica')
    .fillColor(mutedText)
    .text(`Date: ${dateStr} ${timeStr}`, pdfMargin, currentY + 10)
    .text(`Counter: ${shopName}`, pdfMargin, currentY + 20, { width: contentWidth, lineBreak: false })
    .text(`Operator: ${operatorEmail}`, pdfMargin, currentY + 30, { width: contentWidth, lineBreak: false })
    .text(`Branch: ${branchName}`, pdfMargin, currentY + 40, { width: contentWidth, lineBreak: false });

  currentY += 52;

  // Separator
  drawDashedLine(doc, pdfMargin, currentY, rightBound);
  currentY += 6;

  // 4. Items Table Header
  const qtyColWidth = 35;
  const amountColWidth = 52;
  const descColWidth = contentWidth - qtyColWidth - amountColWidth;

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(darkText)
    .text('ITEM', pdfMargin, currentY, { width: descColWidth })
    .text('QTY', pdfMargin + descColWidth, currentY, { width: qtyColWidth, align: 'right' })
    .text('TOTAL', rightBound - amountColWidth, currentY, { width: amountColWidth, align: 'right' });

  currentY += 12;
  drawDashedLine(doc, pdfMargin, currentY, rightBound);
  currentY += 7;

  // 5. Items
  const items = bill.items || [];
  doc.font('Helvetica').fontSize(7.5);

  for (const item of items) {
    const itemName = item.name || 'Service Item';
    const itemPrice = (item.price || 0).toFixed(2);
    const itemTotal = (item.total || 0).toFixed(2);
    const itemQty = item.quantity || 1;

    doc
      .fillColor(darkText)
      .font('Helvetica-Bold')
      .text(itemName, pdfMargin, currentY, { width: descColWidth, lineBreak: false });

    doc
      .font('Helvetica')
      .fillColor(mutedText)
      .text(String(itemQty), pdfMargin + descColWidth, currentY, { width: qtyColWidth, align: 'right' });

    doc
      .font('Helvetica-Bold')
      .fillColor(darkText)
      .text(`Rs. ${itemTotal}`, rightBound - amountColWidth, currentY, { width: amountColWidth, align: 'right' });

    currentY += 11;

    // Rate details subtitle
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor(mutedText)
      .text(`@ Rs. ${itemPrice} each`, pdfMargin + 4, currentY, { width: descColWidth });

    currentY += 11;
  }

  // Separator
  drawDashedLine(doc, pdfMargin, currentY, rightBound);
  currentY += 7;

  // 6. Totals
  const valColWidth = 70;
  const labelColWidth = contentWidth - valColWidth;

  doc.font('Helvetica').fontSize(7.5).fillColor(mutedText);

  doc
    .text('Subtotal:', pdfMargin, currentY, { width: labelColWidth })
    .fillColor(darkText)
    .text(`Rs. ${(bill.subtotal || 0).toFixed(2)}`, rightBound - valColWidth, currentY, { width: valColWidth, align: 'right' });
  currentY += 12;

  if (bill.discount > 0) {
    doc
      .fillColor(mutedText)
      .text('Discount:', pdfMargin, currentY, { width: labelColWidth })
      .fillColor('#dc2626')
      .text(`- Rs. ${(bill.discount || 0).toFixed(2)}`, rightBound - valColWidth, currentY, { width: valColWidth, align: 'right' });
    currentY += 12;
  }

  if (bill.tax > 0) {
    doc
      .fillColor(mutedText)
      .text('Tax:', pdfMargin, currentY, { width: labelColWidth })
      .fillColor(darkText)
      .text(`+ Rs. ${(bill.tax || 0).toFixed(2)}`, rightBound - valColWidth, currentY, { width: valColWidth, align: 'right' });
    currentY += 12;
  }

  // Double solid line for Grand Total
  doc.strokeColor(primaryColor).lineWidth(1).moveTo(pdfMargin, currentY).lineTo(rightBound, currentY).stroke();
  currentY += 5;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryColor)
    .text('TOTAL:', pdfMargin, currentY, { width: labelColWidth })
    .text(`Rs. ${(bill.total || 0).toFixed(2)}`, rightBound - valColWidth, currentY, { width: valColWidth, align: 'right' });
  currentY += 14;

  doc.strokeColor(primaryColor).lineWidth(1).moveTo(pdfMargin, currentY).lineTo(rightBound, currentY).stroke();
  currentY += 8;

  // 7. Payment Mode & Status
  const isPaid = bill.status === 'PAID';
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(mutedText)
    .text(`Payment: ${bill.paymentMethod || 'CASH'}`, pdfMargin, currentY)
    .font('Helvetica-Bold')
    .fillColor(isPaid ? '#16a34a' : '#d97706')
    .text(`STATUS: ${bill.status || 'PAID'}`, rightBound - 80, currentY, { width: 80, align: 'right' });

  currentY += 14;

  // Separator
  drawDashedLine(doc, pdfMargin, currentY, rightBound);
  currentY += 10;

  // 8. Footer
  doc
    .fillColor(mutedText)
    .font('Helvetica')
    .fontSize(7)
    .text('Thank you for visiting SRM Xerox Centre!', pdfMargin, currentY, { width: contentWidth, align: 'center' });
  currentY += 10;

  doc
    .fontSize(5.5)
    .text('Official computer-generated receipt.', pdfMargin, currentY, { width: contentWidth, align: 'center' });
}

/**
 * Renders full-width invoice document (A4, A5, and wide custom formats)
 */
function renderInvoiceDocument(
  doc: PDFKit.PDFDocument,
  bill: any,
  options: {
    pdfTitle: string;
    pdfPaperSize: string;
    pdfMargin: number;
    pdfLogoSize: number;
    pageWidth: number;
    pageHeight: number;
    contentWidth: number;
  }
) {
  const { pdfTitle, pdfPaperSize, pdfMargin, pdfLogoSize, pageWidth, pageHeight, contentWidth } = options;
  const rightBound = pageWidth - pdfMargin;

  // Color definitions from index.css
  const primaryColor = '#1e40af';
  const secondaryColor = '#eab308';
  const darkTextColor = '#1e293b';
  const lightTextColor = '#64748b';
  const gridBorderColor = '#e2e8f0';
  const rowAltColor = '#f8fafc';
  const headerBgColor = '#1e40af';

  // 1. Logo and Header
  const logoPath = path.join(process.cwd(), '../frontend/public/final_logo.png');
  let hasLogo = false;
  const isA4 = pdfPaperSize.startsWith('A4');
  const logoSize = isA4 ? Math.max(pdfLogoSize, 50) : pdfLogoSize;
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, pdfMargin, pdfMargin - 5, { width: logoSize, height: logoSize });
      hasLogo = true;
    } catch (err) {
      console.warn('Failed to embed SRM logo:', err);
    }
  }

  const textStartX = hasLogo ? pdfMargin + logoSize + 10 : pdfMargin;

  // Organization heading
  const invoiceTitleWidth = 140;
  const invoiceTitleX = rightBound - invoiceTitleWidth;
  const titleWidth = Math.max(80, invoiceTitleX - textStartX - 12);
  doc
    .fillColor(primaryColor)
    .fontSize(isA4 ? 16 : 14)
    .font('Helvetica-Bold')
    .text(pdfTitle, textStartX, pdfMargin, { width: titleWidth, lineBreak: false });

  doc
    .fillColor(lightTextColor)
    .fontSize(6.5)
    .font('Helvetica')
    .text('125, ANGEL STREET, THIRUMALAI NAGAR, RAMAPURAM, CHENNAI - 600 089', textStartX, pdfMargin + 17, { width: titleWidth, lineBreak: false })
    .text('GST IN: 33AALPS4307B7ZV', textStartX, pdfMargin + 26, { width: titleWidth, lineBreak: false })
    .text('Xerox, Printing & DTP Services', textStartX, pdfMargin + 35, { width: titleWidth, lineBreak: false });

  doc
    .fillColor(primaryColor)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('INVOICE', invoiceTitleX, pdfMargin, { width: invoiceTitleWidth, align: 'right' });

  doc
    .fillColor(darkTextColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text(`Invoice No: ${bill.code || 'N/A'}`, invoiceTitleX, pdfMargin + 20, { width: invoiceTitleWidth, align: 'right' });

  doc
    .fillColor(lightTextColor)
    .font('Helvetica')
    .text(`Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`, invoiceTitleX, pdfMargin + 30, { width: invoiceTitleWidth, align: 'right' });

  // Gold separator line (SRM Accent)
  doc.rect(pdfMargin, pdfMargin + 55, contentWidth, 2).fill(secondaryColor);

  // 2. Service location and attending shop
  let infoY = pdfMargin + 70;

  doc
    .fillColor(lightTextColor)
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('BRANCH', pdfMargin, infoY);

  const branchName = bill.branch?.name || 'Main Campus';
  doc
    .fillColor(darkTextColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(branchName, pdfMargin, infoY + 12, { width: contentWidth * 0.45, lineBreak: false });

  const shopColX = pdfMargin + (contentWidth * 0.55);
  doc
    .fillColor(lightTextColor)
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('SERVICE COUNTER', shopColX, infoY);

  const shopName = bill.shop?.name || bill.createdBy?.shop?.name || 'Central Xerox Store';
  const operatorEmail = bill.createdBy?.email || 'operator@srmist.edu.in';
  doc
    .fillColor(darkTextColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(shopName, shopColX, infoY + 12, { width: rightBound - shopColX, lineBreak: false })
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica')
    .text(`Operator: ${operatorEmail}`, shopColX, infoY + 25, { width: rightBound - shopColX, lineBreak: false });

  // Separator before table
  let tableY = infoY + 45;
  doc.moveTo(pdfMargin, tableY - 15).lineTo(rightBound, tableY - 15).strokeColor(gridBorderColor).lineWidth(1).stroke();

  // 3. Items Table Header
  doc
    .rect(pdfMargin, tableY, contentWidth, 20)
    .fill(headerBgColor);

  const serialX = pdfMargin + 5;
  const descX = pdfMargin + (contentWidth * 0.08);
  const typeX = pdfMargin + (contentWidth * 0.48);
  const priceX = pdfMargin + (contentWidth * 0.62);
  const qtyX = pdfMargin + (contentWidth * 0.76);
  const totalX = pdfMargin + (contentWidth * 0.85);

  doc
    .fillColor('#ffffff')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('S.No', serialX, tableY + 6)
    .text('Particulars', descX, tableY + 6)
    .text('Type', typeX, tableY + 6)
    .text('Rate', priceX, tableY + 6, { width: contentWidth * 0.12, align: 'right' })
    .text('Qty', qtyX, tableY + 6, { width: contentWidth * 0.08, align: 'right' })
    .text('Amount', totalX, tableY + 6, { width: contentWidth * 0.13, align: 'right' });

  tableY += 20;

  // 4. Table Items
  doc.font('Helvetica').fontSize(8);

  let rowIdx = 0;
  for (const item of (bill.items || [])) {
    const itemType = item.type === 'InventoryProduct' ? 'Product' : 'Service';
    
    if (rowIdx % 2 === 1) {
      doc.rect(pdfMargin, tableY, contentWidth, 20).fill(rowAltColor);
    }

    doc
      .fillColor(darkTextColor)
      .text(String(rowIdx + 1), serialX, tableY + 6)
      .text(item.name || 'Unknown Item', descX, tableY + 6, { width: contentWidth * 0.37, lineBreak: false })
      .text(itemType, typeX, tableY + 6)
      .text(`Rs. ${(item.price || 0).toFixed(2)}`, priceX, tableY + 6, { width: contentWidth * 0.12, align: 'right' })
      .text(String(item.quantity || 0), qtyX, tableY + 6, { width: contentWidth * 0.08, align: 'right' })
      .text(`Rs. ${(item.total || 0).toFixed(2)}`, totalX, tableY + 6, { width: contentWidth * 0.13, align: 'right' });

    tableY += 20;

    doc.moveTo(pdfMargin, tableY).lineTo(rightBound, tableY).strokeColor(gridBorderColor).lineWidth(0.5).stroke();
    rowIdx++;
  }

  tableY += 10;

  // 5. Summary / Totals block
  const summaryW = isA4 ? 220 : 180;
  const summaryX = rightBound - summaryW;
  
  doc
    .rect(summaryX, tableY, summaryW, 70)
    .strokeColor(gridBorderColor)
    .lineWidth(1)
    .stroke();

  let sumY = tableY + 8;
  const sumValW = summaryW - 70;

  doc
    .fontSize(8.5)
    .fillColor(lightTextColor)
    .text('Subtotal:', summaryX + 10, sumY)
    .fillColor(darkTextColor)
    .text(`Rs. ${(bill.subtotal || 0).toFixed(2)}`, summaryX + 60, sumY, { width: sumValW, align: 'right' });

  sumY += 14;

  if (bill.discount > 0) {
    doc
      .fillColor(lightTextColor)
      .text('Discount:', summaryX + 10, sumY)
      .fillColor('#dc2626')
      .text(`- Rs. ${(bill.discount || 0).toFixed(2)}`, summaryX + 60, sumY, { width: sumValW, align: 'right' });
    sumY += 14;
  }

  if (bill.tax > 0) {
    doc
      .fillColor(lightTextColor)
      .text('Tax:', summaryX + 10, sumY)
      .fillColor(darkTextColor)
      .text(`+ Rs. ${(bill.tax || 0).toFixed(2)}`, summaryX + 60, sumY, { width: sumValW, align: 'right' });
    sumY += 14;
  }

  // Divider line inside summary
  doc.moveTo(summaryX + 10, sumY + 2).lineTo(summaryX + summaryW - 10, sumY + 2).strokeColor(gridBorderColor).lineWidth(0.5).stroke();
  sumY += 8;

  // Grand Total
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryColor)
    .text('Grand Total:', summaryX + 10, sumY)
    .text(`Rs. ${(bill.total || 0).toFixed(2)}`, summaryX + 60, sumY, { width: sumValW, align: 'right' });

  const minTableY = pageHeight - pdfMargin - 90;
  tableY = Math.max(tableY + 80, minTableY);

  // 6. Payment info & badges
  doc
    .fontSize(8.5)
    .fillColor(lightTextColor)
    .font('Helvetica-Bold')
    .text('Payment Method: ', pdfMargin, tableY)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text(bill.paymentMethod || 'CASH', pdfMargin + 90, tableY);

  const isPaid = bill.status === 'PAID';
  doc
    .fillColor(lightTextColor)
    .font('Helvetica-Bold')
    .text('Payment Status: ', pdfMargin, tableY + 14)
    .font('Helvetica-Bold')
    .fillColor(isPaid ? '#16a34a' : '#d97706')
    .text(bill.status || 'PAID', pdfMargin + 90, tableY + 14);

  // Footer section
  const footerY = pageHeight - pdfMargin - 25;
  doc.rect(pdfMargin, footerY - 10, contentWidth, 1).fill(secondaryColor);

  doc
    .fontSize(7.5)
    .fillColor(lightTextColor)
    .font('Helvetica')
    .text('Thank you for choosing SRM University Xerox Center.', pdfMargin, footerY, { align: 'center', width: contentWidth })
    .text('This is a computer-generated official invoice and does not require a physical signature.', pdfMargin, footerY + 11, { align: 'center', width: contentWidth });
}

export const generatePdfBuffer = (bill: any, docSetting: any): Promise<Buffer> => {
  const savedPdfTitle = docSetting?.pdfTitle;
  const pdfTitle = !savedPdfTitle || savedPdfTitle === 'SRM Xerox & DTP Management'
    ? 'THE REPROGRAPHICS CENTRE'
    : savedPdfTitle;

  // Normalize paper format
  const rawPaperSize = docSetting?.pdfPaperSize || 'A5 Landscape';
  const customMargin = docSetting?.pdfMargin ?? 30;
  const customLogoSize = docSetting?.pdfLogoSize ?? 45;

  const mmToPt = 72 / 25.4;

  let pageWidth = 595.28;
  let pageHeight = 419.53;
  let pdfMargin = customMargin;
  let isThermal = false;

  const itemsCount = (bill.items || []).length;

  if (rawPaperSize === '80mm') {
    isThermal = true;
    pageWidth = 80 * mmToPt; // ~226.77 pt
    pdfMargin = docSetting?.pdfMargin ?? 10;
    // Calculate dynamic height to fit items cleanly on roll paper
    pageHeight = Math.max(380, 360 + (itemsCount * 25));
  } else if (rawPaperSize === '110mm') {
    isThermal = true;
    pageWidth = 110 * mmToPt; // ~311.81 pt
    pdfMargin = docSetting?.pdfMargin ?? 14;
    pageHeight = Math.max(400, 380 + (itemsCount * 25));
  } else if (rawPaperSize === 'A4 Portrait' || rawPaperSize === 'A4') {
    pageWidth = 595.28;
    pageHeight = 841.89;
    pdfMargin = docSetting?.pdfMargin ?? 40;
  } else if (rawPaperSize === 'A4 Landscape') {
    pageWidth = 841.89;
    pageHeight = 595.28;
    pdfMargin = docSetting?.pdfMargin ?? 40;
  } else if (rawPaperSize === 'A5 Portrait') {
    pageWidth = 419.53;
    pageHeight = 595.28;
    pdfMargin = docSetting?.pdfMargin ?? 30;
  } else if (rawPaperSize === 'A5 Landscape' || rawPaperSize === 'A5') {
    pageWidth = 595.28;
    pageHeight = 419.53;
    pdfMargin = docSetting?.pdfMargin ?? 30;
  } else if (rawPaperSize === 'Custom') {
    const customWidthMm = docSetting?.pdfCustomWidth || 80;
    const customHeightMm = docSetting?.pdfCustomHeight || 200;
    pageWidth = customWidthMm * mmToPt;
    pageHeight = customHeightMm * mmToPt;
    pdfMargin = docSetting?.pdfMargin ?? (pageWidth < 360 ? 12 : 30);
    isThermal = pageWidth < 360;
  } else {
    // Default fallback: A5 Landscape
    pageWidth = 595.28;
    pageHeight = 419.53;
    pdfMargin = customMargin;
  }

  const contentWidth = pageWidth - (2 * pdfMargin);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: pdfMargin,
      autoFirstPage: true
    } as any);

    const buffers: Uint8Array[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    if (isThermal) {
      renderThermalReceipt(doc, bill, {
        pdfTitle,
        pdfMargin,
        pdfLogoSize: customLogoSize,
        pageWidth,
        pageHeight,
        contentWidth,
      });
    } else {
      renderInvoiceDocument(doc, bill, {
        pdfTitle,
        pdfPaperSize: rawPaperSize,
        pdfMargin,
        pdfLogoSize: customLogoSize,
        pageWidth,
        pageHeight,
        contentWidth,
      });
    }

    doc.end();
  });
};

export const generateBillPdf = async (id: string): Promise<Buffer> => {
  const bill = await Bill.findById(id);

  if (!bill) {
    throw new Error('Bill not found');
  }

  // Look up shop ID associated with this bill
  const shopId =
    (bill.shop && typeof bill.shop === 'object' ? bill.shop._id || bill.shop.id : bill.shop) ||
    bill.createdBy?.shop?._id ||
    bill.createdBy?.shop?.id ||
    bill.createdBy?.shop ||
    bill.order?.shop ||
    bill.xeroxOrder?.shop ||
    bill.eventOrder?.shop;

  let docSetting = null;
  if (shopId) {
    docSetting = await Setting.findOne({ shop: String(shopId) });
  }

  if (!docSetting) {
    docSetting = await Setting.findOne({ shop: null });
  }

  if (!docSetting) {
    docSetting = await Setting.findOne({});
  }

  return generatePdfBuffer(bill, docSetting);
};
