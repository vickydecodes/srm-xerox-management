import { Types } from 'mongoose';
import { AccessRequest } from '@core/middlewares/access.middleware.ts';

export const buildQuery = (req: AccessRequest): Record<string, any> => {
  const q: Record<string, any> = {};

  if (req.query && typeof req.query === 'object') {
    Object.assign(q, req.query);
  }

  if (req.queryFilter && typeof req.queryFilter === 'object') {
    for (const [key, value] of Object.entries(req.queryFilter)) {
      if (value && typeof value === 'object' && '$in' in value && Array.isArray(value.$in)) {
        q[key] = { $in: value.$in.map((id: any) => new Types.ObjectId(id)) };
      } else {
        q[key] = value;
      }
    }
  }

  return q;
};
