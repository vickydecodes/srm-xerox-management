import prisma from '@config/prisma.config.js';

export interface ISetting {
  srmCollegeEmail: string;
  pdfTitle: string;
  pdfPaperSize: string;
  pdfMargin: number;
  pdfLogoSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SettingDocument {
  _id!: string;
  srmCollegeEmail!: string;
  pdfTitle!: string;
  pdfPaperSize!: string;
  pdfMargin!: number;
  pdfLogoSize!: number;
  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
    
    // defaults
    if (this.srmCollegeEmail === undefined) this.srmCollegeEmail = 'srmxerox@srmist.edu.in';
    if (this.pdfTitle === undefined) this.pdfTitle = 'SRM Xerox & DTP Management';
    if (this.pdfPaperSize === undefined) this.pdfPaperSize = 'A5 Landscape';
    if (this.pdfMargin === undefined) this.pdfMargin = 30;
    if (this.pdfLogoSize === undefined) this.pdfLogoSize = 45;
  }

  async save() {
    const payload = {
      srmCollegeEmail: this.srmCollegeEmail,
      pdfTitle: this.pdfTitle,
      pdfPaperSize: this.pdfPaperSize,
      pdfMargin: this.pdfMargin,
      pdfLogoSize: this.pdfLogoSize,
    };

    if (this.isNew) {
      const created = await prisma.setting.create({
        data: payload
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.setting.update({
        where: { id: this._id },
        data: payload
      });
    }
    return this;
  }
}

export class SettingModel {
  static prismaModelName = 'setting';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.setting.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new SettingDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.setting.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new SettingDocument({ ...updated, _id: updated.id });
  }
  
  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await prisma.setting.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.setting.update({
      where: { id: existing.id },
      data: updateData as any
    });
    return new SettingDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.setting.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new SettingDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.setting.findMany({ where: query as any });
    return docs.map((doc: any) => new SettingDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any = {}) {
    const doc = await prisma.setting.findFirst({ where: query as any });
    if (!doc) return null;
    return new SettingDocument({ ...doc, _id: doc.id });
  }
  
  static async create(data: any) {
    const doc = new SettingDocument(data);
    return await doc.save();
  }
  
  static async deleteMany(query: any) {
    return await prisma.setting.deleteMany({ where: query as any });
  }
  
  static async countDocuments(query: any) {
    return await prisma.setting.count({ where: query as any });
  }
  
  static async aggregate(pipeline: any[]): Promise<any[]> {
    return [];
  }
}

type SettingModelType = typeof SettingModel & {
  new (data: any): SettingDocument;
  (data: any): SettingDocument;
};

const SettingFn = function(data: any) { return new SettingDocument(data); };
Object.setPrototypeOf(SettingFn, SettingModel);
export const Setting = SettingFn as unknown as SettingModelType;
export default Setting;
