import { enhanceDoc } from "@core/constants/enhancedoc.constant.ts";
import ServiceModel, { IService } from "@db/models/service.model.ts";

export const enhanceService = (service: IService) => {
  return enhanceDoc(ServiceModel, service, []);
};