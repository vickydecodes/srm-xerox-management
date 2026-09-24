import { Prisma } from '@prisma/client';

export const parsePrismaError = (err: any) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      let field = 'Field';
      if (Array.isArray(target) && target.length > 0) {
        field = target[0];
      } else if (typeof target === 'string') {
        field = target;
      }
      
      return {
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        code: 'DUPLICATE_KEY',
        status: 409,
        field: field,
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
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
};