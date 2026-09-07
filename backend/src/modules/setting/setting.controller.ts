import { Request, Response } from 'express';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';
import * as service from './setting.services.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

import { generatePdfBuffer } from '../bill/exportbill.util.ts';

const controllers = {
  getSettings: async (req: Request, res: Response) => {
    const settings = await service.getSettings();
    return sendResponse.fetched(res, 'setting', settings);
  },

  updateSettings: async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'super_admin') {
      return sendResponse.forbidden(res, 'Only super admins can update settings');
    }
    const settings = await service.updateSettings(req.body);
    return sendResponse.updated(res, 'setting', settings);
  },

  previewPdf: async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'super_admin') {
      return sendResponse.forbidden(res, 'Only super admins can preview settings');
    }

    const docSetting = req.body; // Unsaved configurations

    // Fake bill data for preview
    const dummyBill = {
      code: 'PREV-1024',
      createdAt: new Date(),
      department: { name: 'Preview Department' },
      branch: { name: 'Preview Branch' },
      createdBy: {
        email: 'operator@srmist.edu.in',
        shop: { name: 'Preview Xerox Store' }
      },
      items: [
        {
          name: 'A4 B&W Print',
          type: 'Service',
          price: 2,
          quantity: 10,
          total: 20
        },
        {
          name: 'Binding',
          type: 'Service',
          price: 50,
          quantity: 1,
          total: 50
        }
      ],
      subtotal: 70,
      discount: 0,
      tax: 0,
      total: 70,
      paymentMethod: 'CASH',
      status: 'PAID'
    };

    const pdfBuffer = await generatePdfBuffer(dummyBill, docSetting);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=preview.pdf');
    res.send(pdfBuffer);
  }
};

export const { getSettings, updateSettings, previewPdf } = wrapControllers(controllers);
