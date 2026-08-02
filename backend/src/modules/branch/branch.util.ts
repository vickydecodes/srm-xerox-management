import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import BranchModel, { IBranch } from '@db/models/branch.model.ts';

export const enhanceBranch = (branch: IBranch) => {
  return enhanceDoc(BranchModel, branch, []);
};