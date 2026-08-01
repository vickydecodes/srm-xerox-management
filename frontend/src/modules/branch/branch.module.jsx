import { createCrud } from "@/core/factory/entity.crud";
import { useBranchColumns } from "./branch.coulmns";
import { modals } from "./branch.modals";
import { useBranchStore } from "./branch.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useBranchModule = (exported) => {
  const { openModal } = useUI();
  const store = useBranchStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;
  const { branches } = apiurls;

  const crud = createCrud({
    entity: 'Branch',
    urls: branches,
    store: store,
    getRole: () => 'super_admin',
  });

  const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => crud.create(data), exported });
  };

  const openEdit = (branch) => {
    return openModal(modals.edit, {
      branch,
      submitFn: (data) => crud.edit(branch.id, data),
      exported,
    });
  };

  const openDelete = (id, name) => {
    return openModal(modals.delete, {
      id,
      name,
      onConfirm: (id) => crud.delete(id),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useBranchStore.getState().query,
    setQuery,
  });

  return {
    get state() {
      return useBranchStore.getState().list;
    },
    get loading() {
      return useBranchStore.getState().loading;
    },
    get pagination() {
      return useBranchStore.getState().pagination;
    },
    get current() {
      return useBranchStore.getState().current;
    },
    set,
    add,
    update,
    remove,
    setCurrent,
    useBranchColumns,
    openCreate,
    openEdit,
    openDelete,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
  };
};