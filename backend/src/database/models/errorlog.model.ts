import { Schema, model, Document } from 'mongoose';

export interface IErrorLog extends Document {
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

const errorLogSchema = new Schema<IErrorLog>(
  {
    requestId: { type: String, index: true },
    method: String,
    route: String,
    caller: String,
    statusCode: { type: Number, default: 500 },
    message: { type: String, required: true },
    stack: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const ErrorLog = model<IErrorLog>('ErrorLog', errorLogSchema);