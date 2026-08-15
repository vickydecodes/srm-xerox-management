import { getRequest, postRequest, putRequest, deleteRequest, patchRequest, downloadFile } from "./api.service"; 


export const apiRequest = async (methodOrConfig, url, options = {}) => {
  let method = methodOrConfig;
  let finalUrl = url;
  let finalOptions = options;

  if (methodOrConfig && typeof methodOrConfig === "object" && !url) {
    method = methodOrConfig.method;
    finalUrl = methodOrConfig.url;
    finalOptions = methodOrConfig;
  }

  const { data, params, headers } = finalOptions;
  if (!method || typeof method !== "string") {
    throw new Error(`Invalid method provided to apiRequest: ${method}`);
  }
  const lower = method.toLowerCase();

  switch (lower) {
    case "get":
      return await getRequest(finalUrl, params, headers);
    case "post":
      return await postRequest(finalUrl, data, headers);
    case "put":
      return await putRequest(finalUrl, data, headers);
    case "patch":
      return await patchRequest(finalUrl, data, headers); 
    case "delete":
      return await deleteRequest(finalUrl, params, headers);
    case "download":
      return await downloadFile(finalUrl, params, headers)
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};


