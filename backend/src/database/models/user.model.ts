import prisma from '@config/prisma.config.ts';
import bcrypt from 'bcryptjs';
import { getNextSequence } from '@core/utils/getsequence.util.ts';

export interface IUser extends UserDocument { }

export class UserDocument {
  _id!: string;
  name!: string;
  login_id!: string;
  email!: string;
  phone!: string;
  address?: string;
  password!: string;
  role!: 'super_admin' | 'branch_admin' | 'department_admin' | 'shop_admin' | 'staff';
  branch?: string;
  department?: string;
  shop?: string;

  active!: boolean;
  deleted!: boolean;
  deletedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;
  _originalPassword!: string;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    this.login_id = data.login_id || data.loginId;
    if (!this._id) {
      this.isNew = true;
    }
    this._originalPassword = this.password;
    if (this.active === undefined) this.active = true;
    if (this.deleted === undefined) this.deleted = false;
  }

  async runPreSaveHooks() {
    // validate hook equivalent
    if (this.isNew || this.password !== this._originalPassword) {
      // Check if it's already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (this.password && !this.password.startsWith('$2')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }

    // save hook equivalent
    if (this.isNew && !this.login_id) {
      const institution = 'SRM';
      const year = new Date().getFullYear().toString().slice(-2);

      const seqKey = `user_srm_${year}`;
      const nextSeq = await getNextSequence(seqKey);

      this.login_id = `${institution}${year}${String(nextSeq).padStart(3, '0')}`;
    }
  }

  async save() {
    await this.runPreSaveHooks();

    const payload = {
      name: this.name,
      login_id: this.login_id,
      email: this.email,
      phone: this.phone,
      address: this.address,
      password: this.password,
      role: this.role,
      active: this.active,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
      branch: this.branch,
      department: this.department,
      shop: this.shop,
    };

    if (this.isNew) {
      const created = await prisma.user.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.user.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class UserModel {
  static prismaModelName = 'user';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.user.findUnique({
      where: { id: id.toString() },
      include: { branchObj: true, departmentObj: true, shopObj: true }
    });
    if (!doc) return null;
    return new UserDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.user.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new UserDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.user.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new UserDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.user.findMany({ where: query as any });
    return docs.map((doc: any) => new UserDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.user.findFirst({ where: query as any });
    if (!doc) return null;
    return new UserDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new UserDocument(data);
    return await doc.save();
  }

  static async deleteMany(query: any) {
    return await prisma.user.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.user.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('User.aggregate not fully implemented for PostgreSQL Prisma');
    return [];
  }
  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await prisma.user.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.user.update({ where: { id: existing.id }, data: updateData as any });
    return new UserDocument({ ...updated, _id: updated.id });
  }
}

type UserModelType = typeof UserModel & {
  new(data: any): UserDocument;
  (data: any): UserDocument;
};

const UserFn = function(data: any) { return new UserDocument(data); };
Object.setPrototypeOf(UserFn, UserModel);
export const User = UserFn as unknown as UserModelType;
export default User;
