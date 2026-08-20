import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import UserModel, { IUser } from '@db/models/user.model.ts';

export const enhanceUser = (user: any) => {
  return enhanceDoc(UserModel, user, ['branch', 'department', 'shop']);
};