import { Document, Schema, model } from 'mongoose';

export interface ISetting extends Document {
  srmCollegeEmail: string;
  pdfTitle: string;
  pdfPaperSize: 'A4 Portrait' | 'A5 Portrait' | 'A5 Landscape';
  pdfMargin: number;
  pdfLogoSize: number;
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
    pdfTitle: {
      type: String,
      required: true,
      trim: true,
      default: 'SRM Xerox & DTP Management',
    },
    pdfPaperSize: {
      type: String,
      enum: ['A4 Portrait', 'A5 Portrait', 'A5 Landscape'],
      required: true,
      default: 'A5 Landscape',
    },
    pdfMargin: {
      type: Number,
      required: true,
      default: 30,
    },
    pdfLogoSize: {
      type: Number,
      required: true,
      default: 45,
    },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', SettingSchema);
export default Setting;
