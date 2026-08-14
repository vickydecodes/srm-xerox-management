import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import OrderModel, { IOrder } from '@db/models/order.model.ts';

export const enhanceOrder = (order: IOrder) => {
  return enhanceDoc(OrderModel, order, []);
};