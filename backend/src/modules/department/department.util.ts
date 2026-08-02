import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import DepartmentModel, {
  IDepartment,
} from '@db/models/department.model.ts';

export const enhanceDepartment = (
  department: IDepartment
) => {
  return enhanceDoc(
    DepartmentModel,
    department,
    []
  );
};