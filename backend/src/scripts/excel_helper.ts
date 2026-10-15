import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getExcelWorkbookPath(): string {
  const possiblePaths = [
    path.resolve(__dirname, 'srm_user_by_institutions.xlsx'),
    path.resolve(process.cwd(), 'srm_user_by_institutions.xlsx'),
    path.resolve(process.cwd(), '../srm_user_by_institutions.xlsx'),
    path.resolve(process.cwd(), '../../srm_user_by_institutions.xlsx'),
    path.resolve(__dirname, '../../../srm_user_by_institutions.xlsx'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    `Could not find 'srm_user_by_institutions.xlsx'. Checked paths:\n${possiblePaths.join('\n')}`
  );
}

export async function loadWorkbook(): Promise<ExcelJS.Workbook> {
  const filePath = getExcelWorkbookPath();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

export interface SheetRowRecord {
  [header: string]: string;
}

/**
 * Extracts rows from a worksheet as an array of key-value objects based on header column names.
 */
export async function parseSheetRows(worksheet: ExcelJS.Worksheet): Promise<SheetRowRecord[]> {
  const rows: SheetRowRecord[] = [];
  const headerMap: { [colNumber: number]: string } = {};

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const headerText = cell.text ? cell.text.toString().trim() : '';
        if (headerText) {
          headerMap[colNumber] = headerText;
        }
      });
      return;
    }

    const rowObj: SheetRowRecord = {};
    let hasData = false;

    row.eachCell((cell, colNumber) => {
      const header = headerMap[colNumber];
      if (header) {
        let val = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && 'text' in cell.value) {
            val = (cell.value as any).text?.toString().trim() || '';
          } else {
            val = cell.value.toString().trim();
          }
        }
        if (val) {
          rowObj[header] = val;
          hasData = true;
        }
      }
    });

    if (hasData) {
      rows.push(rowObj);
    }
  });

  return rows;
}

/**
 * Normalizes header keys to find matching properties case-insensitively
 */
export function getFieldValue(row: SheetRowRecord, possibleFieldNames: string[]): string {
  const lowerKeys = Object.keys(row).reduce<{ [k: string]: string }>((acc, key) => {
    acc[key.toLowerCase()] = row[key];
    return acc;
  }, {});

  for (const name of possibleFieldNames) {
    const val = lowerKeys[name.toLowerCase()];
    if (val !== undefined && val !== null && val.trim() !== '') {
      return val.trim();
    }
  }
  return '';
}
