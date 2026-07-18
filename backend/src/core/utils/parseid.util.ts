import { Types } from "mongoose";

export const castObjectIds = (obj: Record<string, any>): void => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      obj[key] = new Types.ObjectId(value);
    } else if (
      value &&
      typeof value === 'object' &&
      '$in' in value &&
      Array.isArray(value.$in)
    ) {
      obj[key] = {
        $in: value.$in.map((id: any) =>
          Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id
        ),
      };
    }
  }
};