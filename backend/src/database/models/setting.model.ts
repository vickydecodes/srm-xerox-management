import { Document, Schema, model } from 'mongoose';

export interface ISetting extends Document {
  srmCollegeEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema(
  {
    srmCollegeEmail: {
      type: String,
      required: true,
      trim: true,
      default: 'srmxerox@srmist.edu.in',
    },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', SettingSchema);
export default Setting;
