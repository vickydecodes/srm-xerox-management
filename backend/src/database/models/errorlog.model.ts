import prisma from '@config/prisma.config.js';

export interface IErrorLog {
  requestId?: string;
  method?: string;
  route?: string;
  caller?: string;
  statusCode: number;
  message: string;
  stack?: string;
  meta?: Record<string, any>;
  createdAt: Date;
}

export class ErrorLogDocument {
  _id!: string;
  requestId?: string;
  method?: string;
  route?: string;
  caller?: string;
  statusCode!: number;
  message!: string;
  stack?: string;
  meta?: Record<string, any>;
  createdAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
    if (this.statusCode === undefined) this.statusCode = 500;
  }

  async save() {
    if (this.isNew) {
      const created = await prisma.errorLog.create({
        data: {
          requestId: this.requestId,
          method: this.method,
          route: this.route,
          caller: this.caller,
          statusCode: this.statusCode,
          message: this.message,
          stack: this.stack,
          meta: this.meta ? (this.meta as any) : undefined,
        } as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.errorLog.update({
        where: { id: this._id },
        data: {
          requestId: this.requestId,
          method: this.method,
          route: this.route,
          caller: this.caller,
          statusCode: this.statusCode,
          message: this.message,
          stack: this.stack,
          meta: this.meta ? (this.meta as any) : undefined,
        } as any
      });
    }
    return this;
  }
}

export class ErrorLogModel {
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.errorLog.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new ErrorLogDocument({ ...doc, _id: doc.id });
  }

  static async find(query: any) {
    const docs = await prisma.errorLog.findMany({ where: query as any });
    return docs.map((doc: any) => new ErrorLogDocument({ ...doc, _id: doc.id }));
  }
  static prismaModelName = 'errorLog';

  static async create(data: any) {
    const doc = new ErrorLogDocument(data);
    return await doc.save();
  }

  static async deleteMany(query: any) {
    return await prisma.errorLog.deleteMany({ where: query as any });
  }

  static async countDocuments(query: any) {
    return await prisma.errorLog.count({ where: query as any });
  }

  static async aggregate(pipeline: any[]): Promise<any[]> {
    return [];
  }
}

type ErrorLogModelType = typeof ErrorLogModel & {
  new (data: any): ErrorLogDocument;
  (data: any): ErrorLogDocument;
};

const ErrorLogFn = function(data: any) { return new ErrorLogDocument(data); };
Object.setPrototypeOf(ErrorLogFn, ErrorLogModel);
export const ErrorLog = ErrorLogFn as unknown as ErrorLogModelType;
export default ErrorLog;

