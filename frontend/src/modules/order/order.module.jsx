import { createCrud } from "@/core/factory/entity.crud";
import { useOrderColumns } from "./order.columns";
import { modals } from "./order.modals";
import { useOrderStore } from "./order.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useOrderModule = (exported) => {
  const { openModal } = useUI();

  const list = useOrderStore((s) => s.list);
  const loading = useOrderStore((s) => s.loading);
  const pagination = useOrderStore((s) => s.pagination);
  const current = useOrderStore((s) => s.current);

  const store = useOrderStore();
  const { set, setCurrent, setQuery } = store;

  const { orders } = apiurls;

  const crud = createCrud({
    entity: 'Order',
    urls: orders,
    store: store,
    getRole: () => 'super_admin',
  });

  const openView = (order) => {
    return openModal(modals.view, { order, exported });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (formData) => crud.create(formData),
      exported,
    });
  };

  const openEdit = (order) => {
    setCurrent(order);
    return openModal(modals.edit, {
      order,
      submitFn: (formData) => crud.edit(order._id, formData),
      exported,
    });
  };

  const openDelete = (order) => {
    return openModal(modals.delete, {
      id: order._id,
      code: order.code,
      submitFn: (id) => crud.delete(id),
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

  const openBranchAdminApproval = (order) => {
    return openModal(modals.branchAdminApproval, {
      id: order._id,
      submitFn: (id, data) => crud.branchAdminApprove(id, data),
      exported,
    });
  };

  const openVpApproval = (order) => {
    return openModal(modals.vpApproval, {
      id: order._id,
      submitFn: (id, data) => crud.vpApprove(id, data),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useOrderStore.getState().query,
    setQuery,
  });

  return {
    get state() {
      return list;
    },
    get loading() {
      return loading;
    },
    get pagination() {
      return pagination;
    },
    get current() {
      return current;
    },
    set,
    setCurrent,
    useOrderColumns,
    openView,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    openBranchAdminApproval,
    openVpApproval,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
  };
};