import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';
import Bill from '@db/models/bill.model.ts';
import Setting from '@db/models/setting.model.ts';

export const generatePdfBuffer = (bill: any, docSetting: any): Promise<Buffer> => {
  const pdfTitle = docSetting?.pdfTitle || 'SRM Xerox & DTP Management';
  const pdfPaperSize = docSetting?.pdfPaperSize || 'A5 Landscape';
  
  // Custom sizing defaults
  const customMargin = docSetting?.pdfMargin ?? 30;
  const customLogoSize = docSetting?.pdfLogoSize ?? 45;

  let pdfSize: 'A4' | 'A5' = 'A5';
  let pdfLayout: 'portrait' | 'landscape' = 'landscape';
  let pdfMargin = customMargin;
  
  let pageWidth = 595.28;
  let pageHeight = 419.53;

  if (pdfPaperSize === 'A4 Portrait') {
    pdfSize = 'A4';
    pdfLayout = 'portrait';
    pdfMargin = docSetting?.pdfMargin ?? 50;
    pageWidth = 595.28;
    pageHeight = 841.89;
  } else if (pdfPaperSize === 'A5 Portrait') {
    pdfSize = 'A5';
    pdfLayout = 'portrait';
    pdfMargin = docSetting?.pdfMargin ?? 30;
    pageWidth = 419.53;
    pageHeight = 595.28;
  } else {
    // A5 Landscape
    pageWidth = 595.28;
    pageHeight = 419.53;
  }
  
  const rightBound = pageWidth - pdfMargin;
  const contentWidth = pageWidth - (2 * pdfMargin);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: pdfMargin, 
      size: pdfSize, 
      layout: pdfLayout,
      autoFirstPage: true
    } as any);
    const buffers: Uint8Array[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Color definitions from index.css
    const primaryColor = '#1e40af';
    const secondaryColor = '#eab308';
    const darkTextColor = '#1e293b';
    const lightTextColor = '#64748b';
    const gridBorderColor = '#e2e8f0';
    const rowAltColor = '#f8fafc';
    const headerBgColor = '#1e40af';

    // 1. Logo and Header
    const logoPath = path.join(process.cwd(), '../frontend/public/logo.png');
    let hasLogo = false;
    let logoSize = pdfPaperSize === 'A4 Portrait' ? (docSetting?.pdfLogoSize ?? 55) : customLogoSize;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, pdfMargin, pdfMargin - 5, { width: logoSize, height: logoSize });
        hasLogo = true;
      } catch (err) {
        console.warn('Failed to embed SRM logo:', err);
      }
    }

    const textStartX = hasLogo ? pdfMargin + logoSize + 10 : pdfMargin;

    // College Title
    doc
      .fillColor(primaryColor)
      .fontSize(pdfPaperSize === 'A4 Portrait' ? 16 : 14)
      .font('Helvetica-Bold')
      .text(pdfTitle, textStartX, pdfMargin);

    doc
      .fillColor(lightTextColor)
      .fontSize(8)
      .font('Helvetica')
      .text('Kattankulathur Campus, Chennai, Tamil Nadu - 603203', textStartX, pdfMargin + 15)
      .text('Official Xerox & Print Services Management System', textStartX, pdfMargin + 25);

    // Invoice Title on far right
    const invoiceTitleWidth = 135;
    const invoiceTitleX = rightBound - invoiceTitleWidth;

    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('INVOICE', invoiceTitleX, pdfMargin, { width: invoiceTitleWidth, align: 'right' });

    doc
      .fillColor(darkTextColor)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`Invoice No: ${bill.code}`, invoiceTitleX, pdfMargin + 20, { width: invoiceTitleWidth, align: 'right' });

    doc
      .fillColor(lightTextColor)
      .font('Helvetica')
      .text(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`, invoiceTitleX, pdfMargin + 30, { width: invoiceTitleWidth, align: 'right' });

    // Gold separator line (SRM Accent)
    doc.rect(pdfMargin, pdfMargin + 55, contentWidth, 2).fill(secondaryColor);

    // 2. Billing Info & attending Shop info
    let infoY = pdfMargin + 70;

    doc
      .fillColor(lightTextColor)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('BILLED TO', pdfMargin, infoY);

    const deptName = bill.department?.name || 'Direct Walk-in';
    const branchName = bill.branch?.name || 'Main Campus';
    doc
      .fillColor(darkTextColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(deptName, pdfMargin, infoY + 12)
      .fillColor(lightTextColor)
      .fontSize(8)
      .font('Helvetica')
      .text(`Branch: ${branchName}`, pdfMargin, infoY + 24);

    const shopColX = pdfMargin + (contentWidth * 0.55);
    doc
      .fillColor(lightTextColor)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('ATTENDING SHOP', shopColX, infoY);

    const shopName = bill.createdBy?.shop?.name || 'Central Xerox Store';
    const operatorEmail = bill.createdBy?.email || 'operator@srmist.edu.in';
    doc
      .fillColor(darkTextColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(shopName, shopColX, infoY + 12)
      .fillColor(lightTextColor)
      .fontSize(8)
      .font('Helvetica')
      .text(`Operator: ${operatorEmail}`, shopColX, infoY + 24);

    // Separator before table
    let tableY = infoY + 45;
    doc.moveTo(pdfMargin, tableY - 15).lineTo(rightBound, tableY - 15).strokeColor(gridBorderColor).lineWidth(1).stroke();

    // 3. Items Table Header
    doc
      .rect(pdfMargin, tableY, contentWidth, 20)
      .fill(headerBgColor);

    const descX = pdfMargin + 5;
    const typeX = pdfMargin + (contentWidth * 0.45);
    const priceX = pdfMargin + (contentWidth * 0.60);
    const qtyX = pdfMargin + (contentWidth * 0.75);
    const totalX = pdfMargin + (contentWidth * 0.85);

    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('Item Description', descX, tableY + 6)
      .text('Type', typeX, tableY + 6)
      .text('Price', priceX, tableY + 6, { width: contentWidth * 0.12, align: 'right' })
      .text('Qty', qtyX, tableY + 6, { width: contentWidth * 0.08, align: 'right' })
      .text('Total', totalX, tableY + 6, { width: contentWidth * 0.13, align: 'right' });

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
        .text(item.name || 'Unknown Item', descX, tableY + 6, { width: contentWidth * 0.40, lineBreak: false })
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
    const summaryW = pdfPaperSize === 'A4 Portrait' ? 215 : 180;
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

    let minTableY = pageHeight - pdfMargin - 90;
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
    let footerY = pageHeight - pdfMargin - 25;
    
    doc.rect(pdfMargin, footerY - 10, contentWidth, 1).fill(secondaryColor);

    doc
      .fontSize(7.5)
      .fillColor(lightTextColor)
      .font('Helvetica')
      .text('Thank you for choosing SRM University Xerox Center.', pdfMargin, footerY, { align: 'center', width: contentWidth })
      .text('This is a computer-generated official invoice and does not require a physical signature.', pdfMargin, footerY + 11, { align: 'center', width: contentWidth });

    doc.end();
  });
};

export const generateBillPdf = async (id: string): Promise<Buffer> => {
  const bill = await Bill.findById(id)
    .populate('branch')
    .populate('department')
    .populate({
      path: 'createdBy',
      populate: { path: 'shop' }
    });

  if (!bill) {
    throw new Error('Bill not found');
  }
  
  const docSetting = await Setting.findOne();
  return generatePdfBuffer(bill, docSetting);
};
