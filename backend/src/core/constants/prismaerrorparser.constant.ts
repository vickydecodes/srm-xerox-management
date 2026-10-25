import { Prisma } from '@prisma/client';

export const parsePrismaError = (err: any) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      let field: string | undefined;

      if (Array.isArray(target) && target.length > 0) {
        field = String(target[0]);
      } else if (typeof target === 'string') {
        field = target;
      }

      if (!field && err.meta?.driverAdapterError) {
        const daError = err.meta.driverAdapterError as any;
        const constraint =
          daError?.cause?.constraint?.index ||
          daError?.cause?.originalMessage ||
          '';

        // Match table_column_key, e.g., Order_code_key -> code
        const match = constraint.match(/(?:public\.)?["']?\w+["']?_["']?(\w+)["']?_key/i);
        if (match && match[1]) {
          field = match[1];
        } else {
          // Check for Key (col)=(val) already exists
          const keyMatch = constraint.match(/Key\s*\(([^)]+)\)=/i);
          if (keyMatch && keyMatch[1]) {
            field = keyMatch[1].trim();
          }
        }
      }

      if (!field && typeof err.meta?.constraint === 'string') {
        const match = err.meta.constraint.match(/(?:public\.)?["']?\w+["']?_["']?(\w+)["']?_key/i);
        if (match && match[1]) {
          field = match[1];
        }
      }

      const displayField = field
        ? field
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Record';

      return {
        message: `${displayField} already exists`,
        code: 'DUPLICATE_KEY',
        status: 409,
        field: field || 'record',
      };
    }
    
    if (err.code === 'P2025') {
      return {
        message: 'Record not found',
        code: 'NOT_FOUND',
        status: 404,
      };
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Validation error. Please check the data format.',
      code: 'VALIDATION_ERROR',
      status: 400,
    };
  }

  return {
    message: err.message || 'Unknown error',
    code: err.code || 'UNKNOWN_ERROR',
    status: err.statusCode || err.status || 500,
  };
};