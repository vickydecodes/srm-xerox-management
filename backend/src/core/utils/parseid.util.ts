export const castObjectIds = (obj: Record<string, any>): void => {
  for (const [key, value] of Object.entries(obj)) {
    // Prisma uses strings for UUIDs, so no ObjectId casting is needed.
    // However, if the query contains MongoDB's $in, we convert it to Prisma's 'in'.
    if (
      value &&
      typeof value === 'object' &&
      '$in' in value &&
      Array.isArray(value.$in)
    ) {
      obj[key] = {
        in: value.$in,
      };
    }
  }
};