import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import ShopModel, {
  IShop,
} from '@db/models/shop.model.ts';


export const enhanceShop = (
  shop: IShop
) => {
  return enhanceDoc(
    ShopModel,
    shop,
    []
  );
};