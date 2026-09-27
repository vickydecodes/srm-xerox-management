import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts'
import inventoryProductModel, {
    IInventoryProduct,
} from "@db/models/inventory-product.model.ts"

export const resolveInventoryProductVariant = (ip: any) => {
  if (!ip) return ip;

  const ipObj = typeof ip.toObject === 'function' ? ip.toObject() : (ip.toJSON ? ip.toJSON() : { ...ip });

  let resolvedVariant = null;
  if (ipObj.variant) {
    const product = ipObj.product;
    if (product && typeof product === 'object' && Array.isArray(product.variants)) {
      const variantObj = product.variants.find((v: any) => 
        String(v.sku) === String(ipObj.variant) || 
        String(v._id) === String(ipObj.variant) || 
        String(v.id) === String(ipObj.variant)
      );
      resolvedVariant = variantObj ? variantObj : ipObj.variant;
    } else {
      resolvedVariant = ipObj.variant;
    }
  }

  ipObj.variant = resolvedVariant;
  return ipObj;
};

export const enhanceInventoryProduct = async (
    inventoryProduct: IInventoryProduct | any
) => {
    if (!inventoryProduct) return inventoryProduct;
    const populated = await enhanceDoc(
        inventoryProductModel,
        inventoryProduct,
        ['inventory', 'product']
    );
    return resolveInventoryProductVariant(populated);
};
