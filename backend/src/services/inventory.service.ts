import mongoose from 'mongoose';
import InventoryProduct from '../database/models/inventory-product.model.ts';

export const adjustInventoryQuantity = async (
  inventoryProductId: string | mongoose.Types.ObjectId,
  delta: number,
  type?: 'sale' | 'restock' | 'adjustment' | 'return' | 'consumption',
  options: { session?: mongoose.ClientSession } = {}
) => {
  const updateCond: any = { _id: inventoryProductId };
  
  if (delta < 0) {
    updateCond.quantity = { $gte: -delta };
  }

  const updated = await InventoryProduct.findOneAndUpdate(
    updateCond,
    { $inc: { quantity: delta } },
    { new: true, session: options.session }
  );

  if (!updated) {
    throw new Error('Insufficient stock');
  }

  return updated;
};
