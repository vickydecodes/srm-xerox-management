import prisma from '@config/prisma.config.js';

export interface ICreditPayment {
  department: string;
  bills: string[];
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'OTHER';
  otherPaymentMethod?: string;
  paidBy: string;
  date: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreditPaymentDocument {
  _id!: string;
  department!: string;
  bills!: string[];
  amount!: number;
  paymentMethod!: 'CASH' | 'UPI' | 'OTHER';
  otherPaymentMethod?: string;
  paidBy!: string;
  date!: Date;
  remarks?: string;
  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
  }

  async save() {
    if (this.isNew) {
      const created = await prisma.creditPayment.create({
        data: {
          amount: this.amount,
          paymentMethod: this.paymentMethod,
          otherPaymentMethod: this.otherPaymentMethod,
          date: this.date || new Date(),
          remarks: this.remarks,
          department: this.department,
          paidBy: this.paidBy,
          bills: this.bills || []
        }
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.creditPayment.update({
        where: { id: this._id },
        data: {
          amount: this.amount,
          paymentMethod: this.paymentMethod,
          otherPaymentMethod: this.otherPaymentMethod,
          date: this.date,
          remarks: this.remarks,
          department: this.department,
          paidBy: this.paidBy,
          bills: this.bills || []
        }
      });
    }
    return this;
  }
}

export class CreditPaymentModel {
  static prismaModelName = "creditPayment";
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.creditPayment.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new CreditPaymentDocument({ ...doc, _id: doc.id });
  }


  static async find(query: any) {
    const docs = await prisma.creditPayment.findMany({ where: query as any });
    return docs.map(doc => new CreditPaymentDocument({ ...doc, _id: doc.id }));

  }
  static async create(data: any) {
    const doc = new CreditPaymentDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.creditPayment.deleteMany({ where: query as any });
  }
  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.creditPayment.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new CreditPaymentDocument({ ...deleted, _id: deleted.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.creditPayment.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new CreditPaymentDocument({ ...updated, _id: updated.id });
  }
}

type CreditPaymentModelType = typeof CreditPaymentModel & {
  new(data: any): CreditPaymentDocument;
  (data: any): CreditPaymentDocument;
};

const CreditPaymentFn = function(data: any) { return new CreditPaymentDocument(data); };
Object.setPrototypeOf(CreditPaymentFn, CreditPaymentModel);
export const CreditPayment = CreditPaymentFn as unknown as CreditPaymentModelType;
export default CreditPayment;

