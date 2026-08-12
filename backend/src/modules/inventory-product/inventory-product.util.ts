import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts'
import inventoryProductModel, {
    IInventoryProduct,
} from "@db/models/inventory-product.model.ts"

export const enhanceInventoryProduct = (
    inventoryProduct: IInventoryProduct
) => {
    return enhanceDoc(
        inventoryProductModel,
        inventoryProduct,
        ['product']
    );
};
