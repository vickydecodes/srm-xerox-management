import { useSearchStore } from "./search.store";
import { apiurls } from "@/core/api/api.urls";
import { apiRequest } from "@/core/api/api.request";
import { BillingItemSearchCombobox } from "./search.combobox";

// eslint-disable-next-line no-unused-vars
export const useSearchModule = (exported) => {
  const store = useSearchStore();
  const { set, startLoading, stopLoading } = store;

  const { search } = apiurls;

  const searchProducts = async (q = '', extraParams = {}) => {
    startLoading('getAll');
    try {
      const { method, url } = search.products;
      const finalUrl = url();
      // We pass q and extraParams as query params
      const res = await apiRequest(method, finalUrl, { params: { q, ...extraParams } });
      const items = res.data || [];
      set(items);
      return items;
    } finally {
      stopLoading('getAll');
    }
  };

  return {
    get state() {
      return useSearchStore.getState().list;
    },
    get loading() {
      return useSearchStore.getState().loading.getAll;
    },
    searchProducts,
    set,
    BillingItemSearchCombobox,
  };
};
