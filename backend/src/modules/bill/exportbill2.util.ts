import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  ShadingType,
  VerticalAlign,
  PageOrientation,
} from 'docx';
import path from 'path';
import fs from 'fs';
import Bill from '@db/models/bill.model.ts';
import Setting from '@db/models/setting.model.ts';
import prisma from '@config/prisma.config.js';
import { getBillDepartmentAndBranch } from './exportbill.util.js';

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const DASHED_DIVIDER_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.DASHED, size: 1, color: '94A3B8' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

// Helper: convert millimeters to twips (dxa)
const mmToTwips = (mm: number) => Math.round(mm * 56.6929);

/**
 * Creates a horizontal dashed divider line for thermal receipts
 */
function createDashedDivider() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: DASHED_DIVIDER_BORDER,
            children: [new Paragraph({ text: '', spacing: { before: 20, after: 20 } })],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds a compact, authentic thermal receipt (80mm, 110mm, narrow POS rolls)
 */
function buildThermalReceiptSection(bill: any, docSetting: any, options: {
  pageWidth: number;
  pageHeight: number;
  marginTwips: number;
  logoSize: number;
  orgTitle: string;
  email: string;
}) {
  const { pageWidth, pageHeight, marginTwips, logoSize, orgTitle, email } = options;

  // Resolve Department & Branch
  const deptInfo = getBillDepartmentAndBranch(bill);

  const shopName = bill.shop?.name || bill.createdBy?.shop?.name || 'Central Xerox Store';
  const operatorEmail = bill.createdBy?.email || email || 'operator@srmist.edu.in';

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(bill.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. Logo
  const logoPath = path.resolve(process.cwd(), '../frontend/public/final_logo.png');
  let logoRun: ImageRun | null = null;
  if (fs.existsSync(logoPath)) {
    try {
      logoRun = new ImageRun({
        type: 'png',
        data: fs.readFileSync(logoPath),
        transformation: { width: logoSize, height: logoSize },
      });
    } catch (e) {
      console.warn('Failed to embed logo in DOCX thermal receipt:', e);
    }
  }

  const thermalChildren: (Paragraph | Table)[] = [];

  // Header Elements
  if (logoRun) {
    thermalChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [logoRun],
        spacing: { before: 40, after: 40 },
      })
    );
  }

  thermalChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: orgTitle,
          bold: true,
          size: 22, // 11pt
          color: '1E40AF',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'SRM INSTITUTE OF SCIENCE & TECHNOLOGY',
          bold: true,
          size: 14, // 7pt
          color: '475569',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '125, Angel Street, Thirumalai Nagar, Ramapuram, Chennai - 600 089',
          size: 12, // 6pt
          color: '64748B',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `GSTIN: 33AALPS4307B7ZV | ${email}`,
          size: 12, // 6pt
          color: '64748B',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 40 },
    }),
    createDashedDivider(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TAX INVOICE / CASH BILL',
          bold: true,
          size: 16, // 8pt
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
      spacing: { before: 40, after: 40 },
    })
  );

  // Metadata Table: Bill No, Date, Counter, Operator, Branch, Dept
  const metaRows: Array<Array<{ label: string; value: string; bold: boolean }>> = [
    [
      { label: 'Bill No:', value: bill.code || 'N/A', bold: true },
      { label: 'Date:', value: `${dateStr} ${timeStr}`, bold: false },
    ],
    [
      { label: 'Counter:', value: shopName, bold: false },
      { label: 'Operator:', value: operatorEmail, bold: false },
    ],
  ];

  if (deptInfo.isDirectWalkIn) {
    metaRows.push([
      { label: 'Customer:', value: 'Direct Walk-in Bill', bold: true },
      { label: '', value: '', bold: false },
    ]);
  } else {
    const detailRow: Array<{ label: string; value: string; bold: boolean }> = [];
    if (deptInfo.hasBranch) {
      detailRow.push({ label: 'Branch:', value: deptInfo.displayBranch, bold: false });
    }
    if (deptInfo.hasDept) {
      detailRow.push({ label: 'Dept:', value: deptInfo.displayDept, bold: false });
    }
    if (detailRow.length === 1) {
      detailRow.push({ label: '', value: '', bold: false });
    }
    metaRows.push(detailRow);
  }

  const metaTableRows = metaRows.map((row) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${row[0].label} `, size: 14, color: '64748B', font: 'Calibri' }),
                new TextRun({ text: row[0].value, bold: row[0].bold, size: 14, color: '0F172A', font: 'Calibri' }),
              ],
              spacing: { after: 15 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: `${row[1].label} `, size: 14, color: '64748B', font: 'Calibri' }),
                new TextRun({ text: row[1].value, bold: row[1].bold, size: 14, color: '0F172A', font: 'Calibri' }),
              ],
              spacing: { after: 15 },
            }),
          ],
        }),
      ],
    })
  );

  thermalChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      rows: metaTableRows,
    }),
    createDashedDivider()
  );

  // Items Table Header
  const itemsTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 56, type: WidthType.PERCENTAGE },
          borders: DASHED_DIVIDER_BORDER,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'ITEM', bold: true, size: 14, color: '0F172A', font: 'Calibri' })],
              spacing: { before: 20, after: 20 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: DASHED_DIVIDER_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'QTY', bold: true, size: 14, color: '0F172A', font: 'Calibri' })],
              spacing: { before: 20, after: 20 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          borders: DASHED_DIVIDER_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'TOTAL', bold: true, size: 14, color: '0F172A', font: 'Calibri' })],
              spacing: { before: 20, after: 20 },
            }),
          ],
        }),
      ],
    }),
  ];

  // Item Rows
  const items = bill.items || [];
  items.forEach((item: any) => {
    const itemName = item.name || 'Service Item';
    const itemQty = item.quantity || 1;
    const itemRate = (item.price || 0).toFixed(2);
    const itemTotal = (item.total || 0).toFixed(2);

    itemsTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 56, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: itemName, bold: true, size: 14, color: '0F172A', font: 'Calibri' }),
                  new TextRun({ text: ` (@ Rs. ${itemRate})`, size: 12, color: '64748B', font: 'Calibri' }),
                ],
                spacing: { before: 20, after: 10 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: String(itemQty), size: 14, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 20, after: 10 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Rs. ${itemTotal}`, bold: true, size: 14, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 20, after: 10 },
              }),
            ],
          }),
        ],
      })
    );
  });

  thermalChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      rows: itemsTableRows,
    }),
    createDashedDivider()
  );

  // Totals Section
  const subtotalFormatted = (bill.subtotal || bill.total || 0).toFixed(2);
  const discountFormatted = (bill.discount || 0).toFixed(2);
  const taxFormatted = (bill.tax || 0).toFixed(2);
  const totalFormatted = (bill.total || 0).toFixed(2);

  const totalLines: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'Subtotal:', size: 14, color: '64748B', font: 'Calibri' })],
              spacing: { after: 10 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Rs. ${subtotalFormatted}`, size: 14, color: '0F172A', font: 'Calibri' })],
              spacing: { after: 10 },
            }),
          ],
        }),
      ],
    }),
  ];

  if ((bill.discount || 0) > 0) {
    totalLines.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Discount:', size: 14, color: '64748B', font: 'Calibri' })],
                spacing: { after: 10 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `- Rs. ${discountFormatted}`, size: 14, color: '16A34A', font: 'Calibri' })],
                spacing: { after: 10 },
              }),
            ],
          }),
        ],
      })
    );
  }

  if ((bill.tax || 0) > 0) {
    totalLines.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Tax:', size: 14, color: '64748B', font: 'Calibri' })],
                spacing: { after: 10 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `+ Rs. ${taxFormatted}`, size: 14, color: '64748B', font: 'Calibri' })],
                spacing: { after: 10 },
              }),
            ],
          }),
        ],
      })
    );
  }

  // Grand Total Line
  totalLines.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '1E40AF' },
            bottom: { style: BorderStyle.DOUBLE, size: 2, color: '1E40AF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'TOTAL DUE:', bold: true, size: 18, color: '1E40AF', font: 'Calibri' })],
              spacing: { before: 30, after: 30 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '1E40AF' },
            bottom: { style: BorderStyle.DOUBLE, size: 2, color: '1E40AF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Rs. ${totalFormatted}`, bold: true, size: 18, color: '1E40AF', font: 'Calibri' })],
              spacing: { before: 30, after: 30 },
            }),
          ],
        }),
      ],
    })
  );

  thermalChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      rows: totalLines,
    }),
    createDashedDivider()
  );

  // Payment Status
  const isPaid = bill.status === 'PAID';
  thermalChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'PAYMENT: ', size: 14, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: `${bill.paymentMethod || 'CASH'}  |  `, bold: true, size: 14, color: '0F172A', font: 'Calibri' }),
        new TextRun({
          text: bill.status || 'PAID',
          bold: true,
          size: 14,
          color: isPaid ? '16A34A' : 'D97706',
          font: 'Calibri',
        }),
      ],
      spacing: { before: 30, after: 30 },
    }),
    createDashedDivider(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Thank you for choosing SRM Reprographics!',
          italics: true,
          size: 13,
          color: '64748B',
          font: 'Calibri',
        }),
      ],
      spacing: { before: 40, after: 15 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Computer-generated official receipt.',
          size: 11,
          color: '94A3B8',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 40 },
    })
  );

  return {
    properties: {
      page: {
        size: {
          width: pageWidth,
          height: pageHeight,
          orientation: PageOrientation.PORTRAIT,
        },
        margin: {
          top: marginTwips,
          bottom: marginTwips,
          left: marginTwips,
          right: marginTwips,
        },
      },
    },
    children: thermalChildren,
  };
}

/**
 * Builds standard corporate invoice section (A4, A5, and custom wide sheets)
 */
function buildInvoiceSection(bill: any, docSetting: any, options: {
  pageWidth: number;
  pageHeight: number;
  orientation: (typeof PageOrientation)[keyof typeof PageOrientation];
  marginTwips: number;
  logoSize: number;
  orgTitle: string;
  email: string;
}) {
  const { pageWidth, pageHeight, orientation, marginTwips, logoSize, orgTitle, email } = options;

  // Resolve Department and Branch names
  const deptInfo = getBillDepartmentAndBranch(bill);

  const shopName = bill.shop?.name || bill.createdBy?.shop?.name || 'Central Xerox Store';
  const operatorEmail = bill.createdBy?.email || email || 'operator@srmist.edu.in';

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Logo handling
  const logoPath = path.resolve(process.cwd(), '../frontend/public/final_logo.png');
  let logoRun: ImageRun | null = null;
  if (fs.existsSync(logoPath)) {
    try {
      logoRun = new ImageRun({
        type: 'png',
        data: fs.readFileSync(logoPath),
        transformation: { width: logoSize, height: logoSize },
      });
    } catch (e) {
      console.warn('Failed to embed logo in DOCX:', e);
    }
  }

  // Header Table: Left (Branding) | Right (Invoice metadata)
  const headerLeftChildren: Paragraph[] = [];
  if (logoRun) {
    headerLeftChildren.push(new Paragraph({ children: [logoRun], spacing: { after: 60 } }));
  }
  headerLeftChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: orgTitle, bold: true, size: 26, color: '1E40AF', font: 'Calibri' }),
      ],
      spacing: { after: 30 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'SRM INSTITUTE OF SCIENCE & TECHNOLOGY', bold: true, size: 15, color: '64748B', font: 'Calibri' }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '125, Angel Street, Thirumalai Nagar, Ramapuram, Chennai - 600 089', size: 14, color: '64748B', font: 'Calibri' }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `GSTIN: 33AALPS4307B7ZV | ${email}`, size: 14, color: '64748B', font: 'Calibri' }),
      ],
      spacing: { after: 60 },
    })
  );

  const headerRightChildren = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'TAX INVOICE', bold: true, size: 22, color: '1E40AF', font: 'Calibri' }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'Bill No: ', size: 16, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: bill.code || 'N/A', bold: true, size: 18, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'Date: ', size: 16, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: dateStr, bold: true, size: 16, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'Counter: ', size: 15, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: shopName, size: 15, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
  ];

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: headerLeftChildren,
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: headerRightChildren,
          }),
        ],
      }),
    ],
  });

  // Gold accent divider
  const goldDivider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 3, color: 'D97706' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [new Paragraph({ text: '', spacing: { before: 20, after: 40 } })],
          }),
        ],
      }),
    ],
  });

  // Billing Info Table
  const billingInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR, color: 'auto' },
            children: deptInfo.isDirectWalkIn
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'CUSTOMER / BILL TYPE:', bold: true, size: 15, color: '1E40AF', font: 'Calibri' }),
                    ],
                    spacing: { before: 60, after: 20 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Direct Walk-in Bill', bold: true, size: 18, color: '0F172A', font: 'Calibri' }),
                    ],
                    spacing: { after: 20 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Over-the-counter walk-in service', size: 15, color: '64748B', font: 'Calibri' }),
                    ],
                    spacing: { after: 60 },
                  }),
                ]
              : [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'BILLED TO (DEPARTMENT):', bold: true, size: 15, color: '1E40AF', font: 'Calibri' }),
                    ],
                    spacing: { before: 60, after: 20 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: deptInfo.hasDept ? deptInfo.displayDept : deptInfo.displayBranch, bold: true, size: 18, color: '0F172A', font: 'Calibri' }),
                    ],
                    spacing: { after: 20 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: deptInfo.hasBranch ? `Campus / Branch: ${deptInfo.displayBranch}` : '', size: 15, color: '64748B', font: 'Calibri' }),
                    ],
                    spacing: { after: 60 },
                  }),
                ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR, color: 'auto' },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'ORDER & PAYMENT SUMMARY:', bold: true, size: 15, color: '1E40AF', font: 'Calibri' }),
                ],
                spacing: { before: 60, after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Operator: ', size: 15, color: '64748B', font: 'Calibri' }),
                  new TextRun({ text: operatorEmail, size: 15, color: '0F172A', font: 'Calibri' }),
                ],
                spacing: { after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Method: ', size: 15, color: '64748B', font: 'Calibri' }),
                  new TextRun({ text: bill.paymentMethod || 'CASH', bold: true, size: 15, color: '0F172A', font: 'Calibri' }),
                  new TextRun({ text: '  |  Status: ', size: 15, color: '64748B', font: 'Calibri' }),
                  new TextRun({
                    text: bill.status || 'PAID',
                    bold: true,
                    size: 15,
                    color: bill.status === 'PAID' ? '16A34A' : 'D97706',
                    font: 'Calibri',
                  }),
                ],
                spacing: { after: 60 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Items Table
  const tableHeaders = [
    { text: 'No.', width: 7, align: AlignmentType.CENTER },
    { text: 'Particulars / Item Description', width: 43, align: AlignmentType.LEFT },
    { text: 'Type', width: 12, align: AlignmentType.CENTER },
    { text: 'Rate (Rs.)', width: 13, align: AlignmentType.RIGHT },
    { text: 'Qty', width: 10, align: AlignmentType.RIGHT },
    { text: 'Amount (Rs.)', width: 15, align: AlignmentType.RIGHT },
  ];

  const headerRow = new TableRow({
    children: tableHeaders.map(
      (h) =>
        new TableCell({
          width: { size: h.width, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: '1E40AF', type: ShadingType.CLEAR, color: 'auto' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: h.align,
              children: [new TextRun({ text: h.text, bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        })
    ),
  });

  const itemRows: TableRow[] = [headerRow];
  const items = bill.items || [];

  items.forEach((item: any, idx: number) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFF' : 'F8FAFC';
    const itemTotal = (item.total || 0).toFixed(2);
    const itemRate = (item.price || 0).toFixed(2);
    const itemType = item.type || (item.product ? 'Product' : 'Service');

    itemRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(idx + 1), size: 16, color: '64748B', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 43, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: item.name || 'Item', bold: true, size: 16, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: itemType, size: 15, color: '64748B', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 13, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: itemRate, size: 16, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: String(item.quantity || 1), size: 16, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: itemTotal, bold: true, size: 16, color: '0F172A', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      })
    );
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
    rows: itemRows,
  });

  // Totals Section
  const subtotalFormatted = (bill.subtotal || bill.total || 0).toFixed(2);
  const discountFormatted = (bill.discount || 0).toFixed(2);
  const taxFormatted = (bill.tax || 0).toFixed(2);
  const totalFormatted = (bill.total || 0).toFixed(2);

  const totalSummaryRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [new Paragraph({ text: '' })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'Subtotal:', size: 16, color: '64748B', font: 'Calibri' })],
              spacing: { before: 40, after: 20 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Rs. ${subtotalFormatted}`, size: 16, color: '0F172A', font: 'Calibri' })],
              spacing: { before: 40, after: 20 },
            }),
          ],
        }),
      ],
    }),
  ];

  if ((bill.discount || 0) > 0) {
    totalSummaryRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Discount:', size: 16, color: '64748B', font: 'Calibri' })],
                spacing: { after: 20 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `- Rs. ${discountFormatted}`, size: 16, color: '16A34A', font: 'Calibri' })],
                spacing: { after: 20 },
              }),
            ],
          }),
        ],
      })
    );
  }

  if ((bill.tax || 0) > 0) {
    totalSummaryRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Tax:', size: 16, color: '64748B', font: 'Calibri' })],
                spacing: { after: 20 },
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `+ Rs. ${taxFormatted}`, size: 16, color: '64748B', font: 'Calibri' })],
                spacing: { after: 20 },
              }),
            ],
          }),
        ],
      })
    );
  }

  // Grand Total row
  totalSummaryRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: NO_BORDER,
          children: [new Paragraph({ text: '' })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: '1E40AF' },
            bottom: { style: BorderStyle.DOUBLE, size: 3, color: '1E40AF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'Total Due:', bold: true, size: 20, color: '1E40AF', font: 'Calibri' })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: '1E40AF' },
            bottom: { style: BorderStyle.DOUBLE, size: 3, color: '1E40AF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Rs. ${totalFormatted}`, bold: true, size: 20, color: '1E40AF', font: 'Calibri' })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    })
  );

  const totalsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: totalSummaryRows,
  });

  // Footer notes
  const footerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Thank you for visiting SRM Xerox Centre!',
          italics: true,
          size: 15,
          color: '64748B',
          font: 'Calibri',
        }),
      ],
      spacing: { before: 240, after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Official computer-generated receipt.',
          size: 13,
          color: '94A3B8',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 60 },
    }),
  ];

  return {
    properties: {
      page: {
        size: {
          width: pageWidth,
          height: pageHeight,
          orientation,
        },
        margin: {
          top: marginTwips,
          bottom: marginTwips,
          left: marginTwips,
          right: marginTwips,
        },
      },
    },
    children: [
      headerTable,
      new Paragraph({ text: '', spacing: { before: 40, after: 40 } }),
      goldDivider,
      billingInfoTable,
      new Paragraph({ text: '', spacing: { before: 40, after: 40 } }),
      itemsTable,
      totalsTable,
      ...footerParagraphs,
    ],
  };
}

/**
 * Generates DOCX buffer adapting to all user configurations (80mm, 110mm, A4, A5, Custom, margins, logo size, email)
 */
export const generateDocxBuffer = async (bill: any, docSetting: any): Promise<Buffer> => {
  const savedPdfTitle = docSetting?.pdfTitle;
  const orgTitle = !savedPdfTitle || savedPdfTitle === 'SRM Xerox & DTP Management'
    ? 'THE REPROGRAPHICS CENTRE'
    : savedPdfTitle;

  const rawPaperSize = docSetting?.pdfPaperSize || 'A5 Landscape';
  const customWidthMm = Number(docSetting?.pdfCustomWidth) || 80;
  const customHeightMm = Number(docSetting?.pdfCustomHeight) || 200;

  const is80mm = rawPaperSize === '80mm';
  const is110mm = rawPaperSize === '110mm';
  const isCustom = rawPaperSize === 'Custom';
  const isThermal = is80mm || is110mm || (isCustom && customWidthMm < 120);

  const itemsCount = (bill.items || []).length;
  const srmEmail = docSetting?.srmCollegeEmail || 'srmxerox@srmist.edu.in';

  let pageWidth: number;
  let pageHeight: number;
  let orientation: (typeof PageOrientation)[keyof typeof PageOrientation];
  let marginTwips: number;
  let logoSize: number;

  if (is80mm) {
    pageWidth = mmToTwips(80); // ~4535 twips
    pageHeight = Math.max(7200, 5200 + itemsCount * 500);
    orientation = PageOrientation.PORTRAIT;
    marginTwips = Math.max(80, Math.min(260, Math.round((docSetting?.pdfMargin ?? 10) * 20)));
    logoSize = Math.max(20, Math.min(36, Number(docSetting?.pdfLogoSize) || 32));
  } else if (is110mm) {
    pageWidth = mmToTwips(110); // ~6236 twips
    pageHeight = Math.max(7600, 5600 + itemsCount * 500);
    orientation = PageOrientation.PORTRAIT;
    marginTwips = Math.max(100, Math.min(320, Math.round((docSetting?.pdfMargin ?? 14) * 20)));
    logoSize = Math.max(24, Math.min(42, Number(docSetting?.pdfLogoSize) || 38));
  } else if (isCustom) {
    pageWidth = mmToTwips(customWidthMm);
    pageHeight = mmToTwips(customHeightMm);
    orientation = customWidthMm > customHeightMm ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;
    marginTwips = isThermal
      ? Math.max(80, Math.min(260, Math.round((docSetting?.pdfMargin ?? 12) * 20)))
      : Math.max(160, Math.round((docSetting?.pdfMargin ?? 30) * 20));
    logoSize = isThermal
      ? Math.max(20, Math.min(36, Number(docSetting?.pdfLogoSize) || 32))
      : Math.max(24, Math.min(80, Number(docSetting?.pdfLogoSize) || 45));
  } else if (rawPaperSize === 'A4 Portrait' || rawPaperSize === 'A4') {
    pageWidth = 11906; // 210mm
    pageHeight = 16838; // 297mm
    orientation = PageOrientation.PORTRAIT;
    marginTwips = Math.max(200, Math.round((docSetting?.pdfMargin ?? 40) * 20));
    logoSize = Math.max(24, Math.min(80, Number(docSetting?.pdfLogoSize) || 48));
  } else if (rawPaperSize === 'A4 Landscape') {
    pageWidth = 16838; // 297mm
    pageHeight = 11906; // 210mm
    orientation = PageOrientation.LANDSCAPE;
    marginTwips = Math.max(200, Math.round((docSetting?.pdfMargin ?? 40) * 20));
    logoSize = Math.max(24, Math.min(80, Number(docSetting?.pdfLogoSize) || 50));
  } else if (rawPaperSize === 'A5 Portrait') {
    pageWidth = 8390; // 148mm
    pageHeight = 11906; // 210mm
    orientation = PageOrientation.PORTRAIT;
    marginTwips = Math.max(160, Math.round((docSetting?.pdfMargin ?? 30) * 20));
    logoSize = Math.max(24, Math.min(70, Number(docSetting?.pdfLogoSize) || 42));
  } else {
    // A5 Landscape (default)
    pageWidth = 11906; // 210mm
    pageHeight = 8390; // 148mm
    orientation = PageOrientation.LANDSCAPE;
    marginTwips = Math.max(160, Math.round((docSetting?.pdfMargin ?? 30) * 20));
    logoSize = Math.max(24, Math.min(70, Number(docSetting?.pdfLogoSize) || 45));
  }

  const section = isThermal
    ? buildThermalReceiptSection(bill, docSetting, {
        pageWidth,
        pageHeight,
        marginTwips,
        logoSize,
        orgTitle,
        email: srmEmail,
      })
    : buildInvoiceSection(bill, docSetting, {
        pageWidth,
        pageHeight,
        orientation,
        marginTwips,
        logoSize,
        orgTitle,
        email: srmEmail,
      });

  const doc = new Document({
    sections: [section],
  });

  return await Packer.toBuffer(doc);
};

/**
 * Loads bill and its associated shop/global setting to generate adapted DOCX
 */
export const generateBillDocx = async (id: string): Promise<Buffer> => {
  const bill = await Bill.findById(id);

  if (!bill) {
    throw new Error('Bill not found');
  }

  // 1. Resolve Department if missing or raw string ID
  let deptObj = typeof bill.department === 'object' && bill.department?.name ? bill.department : null;
  if (!deptObj) {
    const rawDeptId =
      (bill.department && typeof bill.department === 'object' ? bill.department._id || bill.department.id : bill.department) ||
      bill.order?.department ||
      bill.eventOrder?.department ||
      bill.xeroxOrder?.department;

    if (rawDeptId) {
      const foundDept = await prisma.department.findUnique({ where: { id: String(rawDeptId) } });
      if (foundDept) {
        deptObj = { ...foundDept, _id: foundDept.id };
        bill.department = deptObj;
      }
    }
  }

  // 2. Resolve Branch if missing or raw string ID
  let branchObj = typeof bill.branch === 'object' && bill.branch?.name ? bill.branch : null;
  if (!branchObj) {
    const rawBranchId =
      (bill.branch && typeof bill.branch === 'object' ? bill.branch._id || bill.branch.id : bill.branch) ||
      deptObj?.branch ||
      bill.order?.branch ||
      bill.eventOrder?.branch ||
      bill.xeroxOrder?.branch;

    if (rawBranchId) {
      const foundBranch = await prisma.branch.findUnique({ where: { id: String(rawBranchId) } });
      if (foundBranch) {
        branchObj = { ...foundBranch, _id: foundBranch.id };
        bill.branch = branchObj;
      }
    }
  }

  // 3. Resolve Shop ID associated with this bill
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

  const defaultSettings = {
    pdfTitle: 'THE REPROGRAPHICS CENTRE',
    pdfPaperSize: 'A5 Landscape',
    pdfMargin: 30,
    pdfLogoSize: 45,
    pdfCustomWidth: 80,
    pdfCustomHeight: 200,
    srmCollegeEmail: 'srmxerox@srmist.edu.in',
  };

  const finalSetting = {
    ...defaultSettings,
    ...(docSetting ? ((docSetting as any).toJSON ? (docSetting as any).toJSON() : docSetting) : {}),
  };

  return generateDocxBuffer(bill, finalSetting);
};

/**
 * Generates official SRM Department Billing & Expenditure Report as DOCX
 */
export const generateDepartmentReportDocx = async (report: any): Promise<Buffer> => {
  const dept = report.department || {};
  const summary = report.summary || {};
  const shopBreakdown = report.shopBreakdown || [];
  const itemBreakdown = report.itemBreakdown || [];
  const bills = report.bills || [];

  const deptName = dept.name || 'Department';
  const deptCode = dept.code || '';
  const branchName = dept.branch?.name || dept.branch || 'Main Campus';
  const generatedAt = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const docSetting = (await Setting.findOne({ shop: null })) || (await Setting.findOne({}));
  const orgTitle = docSetting?.pdfTitle || 'THE REPROGRAPHICS CENTRE';
  const srmEmail = docSetting?.srmCollegeEmail || 'srmxerox@srmist.edu.in';
  const logoSize = Math.max(32, Math.min(60, Number(docSetting?.pdfLogoSize) || 44));

  const logoPath = path.resolve(process.cwd(), '../frontend/public/final_logo.png');
  let logoRun: ImageRun | null = null;
  if (fs.existsSync(logoPath)) {
    try {
      logoRun = new ImageRun({
        type: 'png',
        data: fs.readFileSync(logoPath),
        transformation: { width: logoSize, height: logoSize },
      });
    } catch {}
  }

  type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];

  const headerLeft: Paragraph[] = [];
  if (logoRun) {
    headerLeft.push(new Paragraph({ children: [logoRun], spacing: { after: 40 } }));
  }
  headerLeft.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'SRM INSTITUTE OF SCIENCE & TECHNOLOGY', bold: true, size: 22, color: '1E40AF', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${orgTitle} | Department Billing & Expenditure Report`, bold: true, size: 16, color: '64748B', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `125, Angel Street, Thirumalai Nagar, Ramapuram, Chennai - 600 089 | GSTIN: 33AALPS4307B7ZV | ${srmEmail}`, size: 14, color: '64748B', font: 'Calibri' }),
      ],
      spacing: { after: 40 },
    })
  );

  const headerRight = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'EXECUTIVE REPORT', bold: true, size: 22, color: '1E40AF', font: 'Calibri' }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Department: `, size: 15, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: deptCode ? `${deptName} (${deptCode})` : deptName, bold: true, size: 16, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Branch: `, size: 15, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: branchName, size: 15, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 15 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Generated: `, size: 15, color: '64748B', font: 'Calibri' }),
        new TextRun({ text: generatedAt, size: 15, color: '0F172A', font: 'Calibri' }),
      ],
      spacing: { after: 40 },
    }),
  ];

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: headerLeft }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: headerRight }),
        ],
      }),
    ],
  });

  const goldDivider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 3, color: 'D97706' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [new Paragraph({ text: '', spacing: { before: 20, after: 40 } })],
          }),
        ],
      }),
    ],
  });

  // KPI Summary Cards Table (5 Columns)
  const kpis = [
    { title: 'Total Bills', value: String(summary.totalBills || 0), sub: 'Bills processed' },
    { title: 'Total Items Count', value: String(summary.totalItemsCount || 0), sub: 'Quantity aggregate' },
    { title: 'Paid Bills', value: String(summary.paidBillsCount || 0), sub: `Rs. ${(summary.paidAmount || 0).toFixed(2)}` },
    { title: 'Unpaid Dues', value: String(summary.unpaidBillsCount || 0), sub: `Rs. ${(summary.unpaidAmount || 0).toFixed(2)}` },
    { title: 'Total Spend', value: `Rs. ${(summary.totalSpend || 0).toFixed(2)}`, sub: 'Gross expenditure' },
  ];

  const kpiCells = kpis.map(
    (kpi) =>
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR, color: 'auto' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: kpi.title, bold: true, size: 13, color: '64748B', font: 'Calibri' })],
            spacing: { before: 60, after: 20 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: kpi.value, bold: true, size: 20, color: '1E40AF', font: 'Calibri' })],
            spacing: { after: 20 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: kpi.sub, size: 12, color: '475569', font: 'Calibri' })],
            spacing: { after: 60 },
          }),
        ],
      })
  );

  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
    rows: [new TableRow({ children: kpiCells })],
  });

  // Section Heading helper
  const makeSectionHeading = (title: string, desc: string) => [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 18, color: '1E40AF', font: 'Calibri' })],
      spacing: { before: 180, after: 20 },
    }),
    new Paragraph({
      children: [new TextRun({ text: desc, size: 13, color: '64748B', font: 'Calibri' })],
      spacing: { after: 60 },
    }),
  ];

  // Helper for stylized tables
  const makeTable = (headers: { text: string; width: number; align: AlignmentValue }[], rowsData: TableRow[]) => {
    const headRow = new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            width: { size: h.width, type: WidthType.PERCENTAGE },
            borders: CELL_BORDER,
            shading: { fill: '1E40AF', type: ShadingType.CLEAR, color: 'auto' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: h.align,
                children: [new TextRun({ text: h.text, bold: true, size: 14, color: 'FFFFFF', font: 'Calibri' })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          })
      ),
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: CELL_BORDER,
      rows: [headRow, ...rowsData],
    });
  };

  // 1. Shop Breakdown Table
  const shopHeaders: { text: string; width: number; align: AlignmentValue }[] = [
    { text: 'Counter / Shop Name', width: 34, align: AlignmentType.LEFT },
    { text: 'Bills', width: 12, align: AlignmentType.CENTER },
    { text: 'Items Count', width: 14, align: AlignmentType.CENTER },
    { text: 'Paid Amount', width: 14, align: AlignmentType.RIGHT },
    { text: 'Unpaid Dues', width: 13, align: AlignmentType.RIGHT },
    { text: 'Total Billing', width: 13, align: AlignmentType.RIGHT },
  ];

  const shopRows: TableRow[] = shopBreakdown.map((sb: any, idx: number) => {
    const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 34, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ text: sb.shopName || 'Unknown Shop', spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(sb.billCount || 0), spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(sb.totalItems || 0), spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, text: `Rs. ${(sb.paidAmount || 0).toFixed(2)}`, spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, text: `Rs. ${(sb.unpaidAmount || 0).toFixed(2)}`, spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [TableCellChildWrap(`Rs. ${(sb.totalAmount || 0).toFixed(2)}`, true)],
        }),
      ],
    });
  });

  function TableCellChildWrap(text: string, bold: boolean) {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text, bold, size: 14, color: '0F172A', font: 'Calibri' })],
      spacing: { before: 40, after: 40 },
    });
  }

  const shopTable = makeTable(shopHeaders, shopRows.length > 0 ? shopRows : [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: 'No shop activity found', spacing: { before: 60, after: 60 } })],
        }),
      ],
    }),
  ]);

  // 2. Item Breakdown Table
  const itemHeaders: { text: string; width: number; align: AlignmentValue }[] = [
    { text: 'Item Description / Particulars', width: 60, align: AlignmentType.LEFT },
    { text: 'Total Quantity / Count', width: 20, align: AlignmentType.CENTER },
    { text: 'Total Amount (Rs.)', width: 20, align: AlignmentType.RIGHT },
  ];

  const itemRows: TableRow[] = itemBreakdown.map((ib: any, idx: number) => {
    const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ text: ib.name || 'Unnamed Item', spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(ib.quantity || 0), spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [TableCellChildWrap(`Rs. ${(ib.amount || 0).toFixed(2)}`, true)],
        }),
      ],
    });
  });

  const itemTable = makeTable(itemHeaders, itemRows.length > 0 ? itemRows : [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: 'No items found', spacing: { before: 60, after: 60 } })],
        }),
      ],
    }),
  ]);

  // 3. Bill Register Table
  const billHeaders: { text: string; width: number; align: AlignmentValue }[] = [
    { text: 'Bill No.', width: 15, align: AlignmentType.LEFT },
    { text: 'Date', width: 14, align: AlignmentType.CENTER },
    { text: 'Shop / Counter', width: 26, align: AlignmentType.LEFT },
    { text: 'Items', width: 10, align: AlignmentType.CENTER },
    { text: 'Amount', width: 15, align: AlignmentType.RIGHT },
    { text: 'Status', width: 20, align: AlignmentType.CENTER },
  ];

  const billRows: TableRow[] = bills.map((b: any, idx: number) => {
    const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    const bDate = new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const isPaid = b.status === 'PAID';

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ children: [new TextRun({ text: b.code || 'N/A', bold: true, size: 14 })], spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: bDate, spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ text: b.shopName || 'Main Counter', spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: String(b.itemsCount || 0), spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [TableCellChildWrap(`Rs. ${(b.total || 0).toFixed(2)}`, true)],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: b.status || 'PAID',
                  bold: true,
                  size: 13,
                  color: isPaid ? '16A34A' : 'D97706',
                }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    });
  });

  const billTable = makeTable(billHeaders, billRows.length > 0 ? billRows : [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, text: 'No bills recorded for this department', spacing: { before: 60, after: 60 } })],
        }),
      ],
    }),
  ]);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 16838, // A4 Landscape (297mm)
              height: 11906, // A4 Landscape (210mm)
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ text: '', spacing: { before: 20, after: 20 } }),
          goldDivider,
          kpiTable,
          ...makeSectionHeading('1. Service Counter & Shop Breakdown', 'Distribution of bills, items count, and dues across counters'),
          shopTable,
          ...makeSectionHeading('2. Aggregate Item & Particulars Breakdown', 'Overall count and spending across each unique xerox, print, and stationery item'),
          itemTable,
          ...makeSectionHeading('3. Department Bill Register', 'Detailed list of individual bills matching active filters'),
          billTable,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'End of Department Billing Report — SRM Reprographics Management System',
                italics: true,
                size: 13,
                color: '94A3B8',
                font: 'Calibri',
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};
