import sendResponse from '@core/constants/responsewrapper.constant.js';
import { Response, Request } from 'express';

import { DeleteConfig } from './../config/delete.config.ts';
import mongoose from 'mongoose';

export const createStatusControllers = (service: any, entityName: string) => {
  return {
    softDelete: async (req: Request, res: Response) => {
      const { force } = req.query;
      const config = DeleteConfig[entityName.toLowerCase()];

      if (config) {
        let hasDependencies = false;
        let conflictMessage = `This ${entityName} has associated `;
        const conflictDetails: string[] = [];

        if (force !== 'true') {
          for (const dep of config.dependencies) {
            const Model = mongoose.models[dep.modelName];
            if (!Model) continue;

            const count = await Model.countDocuments({ [dep.filterField]: req.params.id, deleted: false });
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
            const Model = mongoose.models[dep.modelName];
            if (!Model) continue;

            await Model.updateMany(
              { [dep.filterField]: req.params.id },
              { $set: { deleted: true, active: false, deletedAt: new Date() } }
            );
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
