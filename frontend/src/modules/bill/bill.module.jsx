import { createCrud } from "@/core/factory/entity.crud";
import { useBillColumns } from "./bill.coulmns";
import { modals } from "./bill.modals";
import { useBillStore } from "./bill.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useBillModule = (exported) => {
  const { openModal } = useUI();
  const store = useBillStore();
  const { setQuery } = store;
  const { bills } = apiurls;

  const crud = createCrud({
    entity: 'Bill',
    urls: bills,
    store: store,
    getRole: () => 'super_admin',
  });

  const openView = (bill) => {
    return openModal(modals.view, { bill, exported });
  };

  const openDelete = (id, code) => {
    return openModal(modals.delete, {
      id,
      code,
      onConfirm: (id) => crud.delete(id),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useBillStore.getState().query,
    setQuery,
  });

  return {
    get state() {
      return useBillStore.getState().list;
    },
    get loading() {
      return useBillStore.getState().loading;
    },
    get pagination() {
      return useBillStore.getState().pagination;
    },
    get current() {
      return useBillStore.getState().current;
    },
    useBillColumns,
    openView,
    openDelete,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
  };
};