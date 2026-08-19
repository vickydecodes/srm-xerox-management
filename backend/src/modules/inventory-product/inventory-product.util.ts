import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts'
import inventoryProductModel, {
    IInventoryProduct,
} from "@db/models/inventory-product.model.ts"

export const resolveInventoryProductVariant = (ip: any) => {
  if (!ip) return ip;

  const ipObj = typeof ip.toObject === 'function' ? ip.toObject() : ip;

  let resolvedVariant = null;
  if (ipObj.variant) {
    const product = ipObj.product;
    if (product && product.variants) {
      const variantObj = product.variants.find((v: any) => String(v._id) === String(ipObj.variant));
      resolvedVariant = variantObj ? variantObj.attributes : null;
    } else {
      resolvedVariant = ipObj.variant;
    }
  }

  ipObj.variant = resolvedVariant;
  return ipObj;
};

export const enhanceInventoryProduct = async (
    inventoryProduct: IInventoryProduct
) => {
    const populated = await enhanceDoc(
        inventoryProductModel,
        inventoryProduct,
        ['product']
    );
    return resolveInventoryProductVariant(populated);
};
