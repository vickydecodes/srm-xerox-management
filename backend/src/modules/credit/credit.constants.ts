import mongoose from 'mongoose';


export const UPDATE_OPTIONS = {
  new: true,
  runValidators: true,
};


export const toObjectId = (id: string) =>
  new mongoose.Types.ObjectId(id);