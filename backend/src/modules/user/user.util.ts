import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import UserModel, { IUser } from '@db/models/user.model.ts';

export const enhanceUser = (user: IUser) => {
  return enhanceDoc(UserModel, user, []);
};