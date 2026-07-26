import { FilterConfig } from "@core/constants/dynamicfilter.constant.ts";
import { IService } from "@db/models/service.model.ts";

export const serviceFilterConfig: FilterConfig<IService> = {
  searchable: ["name", "code", "description"],
  filterable: ["active", "deleted", "unit"],
  sortable: ["name", "code", "price", "createdAt", "active"],
  defaultSort: "name",
};