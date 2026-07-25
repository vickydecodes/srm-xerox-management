import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import ProductModel, { IProduct } from '@db/models/product.model.ts';



export const enhanceProduct = (product: IProduct) => {
  return enhanceDoc(ProductModel, product, []);
}