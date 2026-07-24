import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import inventoryProductModel, { IInventoryProduct } from '@db/models/inventory-product.model.ts';



export const enhanceProduct = (product: IInventoryProduct) => {
  return enhanceDoc(inventoryProductModel, product, []);
}