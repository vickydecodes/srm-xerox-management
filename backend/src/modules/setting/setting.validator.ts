import { z } from 'zod';

export const updateSettingSchema = z.object({
  srmCollegeEmail: z
    .string()
    .trim()
    .min(1, 'SRM College Email is required')
    .email('Invalid email address')
    .optional(),
  pdfTitle: z.string().trim().min(1, 'PDF Title is required').optional(),
  pdfPaperSize: z.enum(['A4 Portrait', 'A5 Portrait', 'A5 Landscape']).optional(),
  pdfMargin: z.number().min(0, 'Margin must be at least 0').max(100, 'Margin must be at most 100').optional(),
  pdfLogoSize: z.number().min(10, 'Logo size must be at least 10').max(150, 'Logo size must be at most 150').optional(),
});
