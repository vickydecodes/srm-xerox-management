import prisma from '@config/prisma.config.js';

export interface ICounter {
  key: string;
  value: number;
}

export class CounterDocument {
  _id!: string;
  key!: string;
  value!: number;

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
      const created = await prisma.counter.create({
        data: {
          key: this.key,
          value: this.value !== undefined ? this.value : 0,
        }
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.counter.update({
        where: { id: this._id },
        data: {
          key: this.key,
          value: this.value,
        }
      });
    }
    return this;
  }
}

export class CounterModel {
  static prismaModelName = 'counter';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.counter.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new CounterDocument({ ...doc, _id: doc.id });
  }

  static async findOneAndUpdate(query: any, update: any, options: any = {}) {
    // Mongoose query usually has { key: 'something' }
    const key = query.key;
    if (!key) throw new Error("Counter findOneAndUpdate wrapper only supports querying by key");
    
    const updateData: any = {};
    if (update.$inc) {
      updateData.value = { increment: update.$inc.value };
    } else {
      updateData.value = update.value;
    }

    const updated = await prisma.counter.upsert({
      where: { key: key },
      update: updateData,
      create: { key: key, value: update.$inc ? update.$inc.value : update.value }
    });

    return new CounterDocument({ ...updated, _id: updated.id });
  }
  static async create(data: any) {
    const doc = new CounterDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.counter.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.counter.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Counter.aggregate not fully implemented for PostgreSQL Prisma');
    return [];
  }
  static async findOne(query: any) {
    const doc = await prisma.counter.findFirst({ where: query as any });
    if (!doc) return null;
    return new CounterDocument({ ...doc, _id: doc.id });
  }
  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.counter.update({ where: { id: id.toString() }, data: updateData as any });
    return new CounterDocument({ ...updated, _id: updated.id });
  }
  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.counter.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new CounterDocument({ ...deleted, _id: deleted.id });
  }
}

type CounterModelType = typeof CounterModel & {
  new (data: any): CounterDocument;
  (data: any): CounterDocument;
};

const CounterFn = function(data: any) { return new CounterDocument(data); };
Object.setPrototypeOf(CounterFn, CounterModel);
export const Counter = CounterFn as unknown as CounterModelType;
export default Counter;

