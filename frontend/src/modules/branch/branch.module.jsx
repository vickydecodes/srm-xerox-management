import { allow } from "@/core/utils/allow.util";
import { useAuth } from "@/core/contexts/auth.context";
import { createCrud } from "@/core/factory/entity.crud";
import { useBranchColumns } from "./branch.coulmns";
import { modals } from "./branch.modals";
import { useBranchStore } from "./branch.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useBranchModule = (exported) => {
  const { openModal } = useUI();
  const { user } = useAuth();
  const store = useBranchStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;
  const { branches } = apiurls;

  const crud = createCrud({
    entity: 'Branch',
    urls: branches,
    store: store,
    getRole: () => user?.role || null,
  });

  const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => crud.create(data), exported });
  };

  const openEdit = (branch) => {
    return openModal(modals.edit, {
      branch,
      submitFn: (data) => crud.edit(branch._id, data),
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

  const openErase = (id) => {
    return openModal(modals.erase, {
      id,
      submitFn: (id) => crud.erase(id),
      exported,
    });
  };

  const openRetrieve = (id) => {
    return openModal(modals.retrieve, {
      id,
      submitFn: (id) => crud.retrieve(id),
      exported,
    });
  };

  const openActiveStatus = (id, status) => {
    return openModal(modals.activeStatus, {
      id,
      status,
      submitFn: (id, data) => crud.setActiveStatus(id, data),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
    crud,
    getQuery: () => useBranchStore.getState().query,
    setQuery,
  });

  return {
    allow: {
      create: allow(undefined, user?.role),
      update: allow(undefined, user?.role),
      delete: allow(undefined, user?.role),
    },
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
    openErase,
    openRetrieve,
    openActiveStatus,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
    csv,
    xlsx,
    pdf,
    getQuery,
  };
};