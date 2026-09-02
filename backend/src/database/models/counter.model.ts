import { Document, Schema, model } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  value: number;
}

const CounterSchema = new Schema({
  key: { type: String, unique: true },
  value: { type: Number, default: 0 },
});

export const Counter = model<ICounter>('Counter', CounterSchema);
