import mongoose from 'mongoose';


export const UPDATE_OPTIONS = {
  new: true,
  runValidators: true,
};


export const toObjectId = (id: any) => id ? id.toString() : null;;