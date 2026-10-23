import { z } from 'zod';

export const updateSettingSchema = z.object({
  shop: z.string().nullable().optional(),
  srmCollegeEmail: z
    .string()
    .trim()
    .min(1, 'SRM College Email is required')
    .email('Invalid email address')
    .optional(),
  pdfTitle: z.string().trim().min(1, 'PDF Title is required').optional(),
  pdfPaperSize: z
    .enum([
      '80mm',
      '110mm',
      'A4',
      'A4 Portrait',
      'A4 Landscape',
      'A5',
      'A5 Portrait',
      'A5 Landscape',
      'Custom'
    ])
    .optional(),
  pdfMargin: z.number().min(0, 'Margin must be at least 0').max(100, 'Margin must be at most 100').optional(),
  pdfLogoSize: z.number().min(5, 'Logo size must be at least 5').max(150, 'Logo size must be at most 150').optional(),
  pdfCustomWidth: z.number().min(20, 'Width must be at least 20mm').max(1000, 'Width must be at most 1000mm').optional().nullable(),
  pdfCustomHeight: z.number().min(20, 'Height must be at least 20mm').max(2000, 'Height must be at most 2000mm').optional().nullable(),
});
