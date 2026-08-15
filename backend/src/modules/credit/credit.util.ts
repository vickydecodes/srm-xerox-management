import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import CreditPaymentModel, {
  ICreditPayment,
} from '@db/models/credit.model.ts';


export const enhanceCreditPayment = (
  creditPayment: ICreditPayment
) => {
  return enhanceDoc(
    CreditPaymentModel,
    creditPayment,
    []
  );
};