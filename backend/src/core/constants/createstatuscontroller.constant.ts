import sendResponse from '@core/constants/responsewrapper.constant.js';
import { Response, Request } from 'express';

import { DeleteConfig } from './../config/delete.config.ts';
import prisma from '@config/prisma.config.js';

export const createStatusControllers = (service: any, entityName: string) => {
  return {
    softDelete: async (req: Request, res: Response) => {
      const { force } = req.query;
      const config = DeleteConfig[entityName.toLowerCase()];

      if (config) {
        let hasDependencies = false;
        let conflictMessage = `This ${entityName} has associated `;
        const conflictDetails: string[] = [];

        const noDeletedModels = ['BillItem', 'Counter', 'CreditPayment', 'ErrorLog', 'Setting', 'billItem', 'counter', 'creditPayment', 'errorLog', 'setting'];
        const noActiveModels = ['Order', 'Bill', 'BillItem', 'Counter', 'CreditPayment', 'ErrorLog', 'Setting', 'order', 'bill', 'billItem', 'counter', 'creditPayment', 'errorLog', 'setting'];

        if (force !== 'true') {
          for (const dep of config.dependencies) {
            // @ts-ignore - dynamic prisma model access
            const model = prisma[dep.modelName];
            if (!model) continue;

            const query: any = { [dep.filterField]: req.params.id };
            if (!noDeletedModels.includes(dep.modelName)) {
              query.deleted = false;
            }

            const count = await model.count({ where: query });
            if (count > 0) {
              hasDependencies = true;
              conflictDetails.push(`${count} ${dep.name}`);
            }
          }

          if (hasDependencies) {
            conflictMessage += conflictDetails.join(', ') + '. Force delete to remove all.';
            return sendResponse.blocked(res, conflictMessage, null, 'DEPENDENCY_CONFLICT');
          }
        } else {
          // Force delete phase
          for (const dep of config.dependencies) {
            // @ts-ignore - dynamic prisma model access
            const model = prisma[dep.modelName];
            if (!model) continue;

            const updateData: any = {};
            if (!noDeletedModels.includes(dep.modelName)) {
              updateData.deleted = true;
              updateData.deletedAt = new Date();
            }
            if (!noActiveModels.includes(dep.modelName)) {
              updateData.active = false;
            }

            if (Object.keys(updateData).length > 0) {
              await model.updateMany({
                where: { [dep.filterField]: req.params.id },
                data: updateData
              });
            }
          }
        }
      }

      const item = await service.remove(req.params.id);
      if (!item) return sendResponse.notFound(res, entityName);

      return sendResponse.deleted(res, entityName);
    },

    setActiveStatus: async (req: Request, res: Response) => {
      const { active } = req.body ?? {};
      if (typeof active !== 'boolean') {
        return sendResponse.badRequest(res, 'active must be a boolean');
      }
      const item = await service.setActiveStatus(req.params.id, active);
      if (!item) return sendResponse.notFound(res, entityName);

      return sendResponse.updated(res, entityName, item);
    },

    retrieve: async (req: Request, res: Response) => {
      const item = await service.retrieve(req.params.id);
      if (!item) return sendResponse.notFound(res, entityName);
      return sendResponse.retrieved(res, entityName);
    },
  };
};
