import { createCrud } from "@/core/factory/entity.crud";
import { useShopAdminColumns } from "./shop-admin.columns";
import { modals } from "./shop-admin.modals";
import { useShopAdminStore } from "./shop-admin.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

const ROLE = 'shop_admin';

export const useShopAdminModule = (exported) => {
  const { openModal } = useUI();

  const list = useShopAdminStore((s) => s.list);
  const loading = useShopAdminStore((s) => s.loading);
  const pagination = useShopAdminStore((s) => s.pagination);
  const current = useShopAdminStore((s) => s.current);

  const store = useShopAdminStore();
  const { set, setCurrent, setQuery } = store;

  const { users } = apiurls;

  const crud = createCrud({
    entity: 'Shop Admin',
    urls: users,
    store: store,
    getRole: () => 'super_admin',
  });

  const openView = (admin) => {
    return openModal(modals.view, { admin, exported });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (formData) => crud.create({ ...formData, role: ROLE }),
      exported,
    });
  };

  const openEdit = (admin) => {
    setCurrent(admin);
    return openModal(modals.edit, {
      admin,
      submitFn: (formData) => crud.edit(admin._id, formData),
      exported,
    });
  };

  const openDelete = (admin) => {
    return openModal(modals.delete, {
      id: admin._id,
      name: admin.name,
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

  const openActiveStatus = (id, status) => {
    return openModal(modals.activeStatus, {
      id,
      status,
      submitFn: (id, data) => crud.setActiveStatus(id, data),
      exported,
    });
  };

  const { fetch: baseFetch, reset: baseReset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useShopAdminStore.getState().query,
    setQuery,
  });

  const fetch = (extras = {}) => baseFetch({ role: ROLE, ...extras });
  const reset = (extras = {}) => baseReset({ role: ROLE, ...extras });

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
    useShopAdminColumns,
    openView,
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
  };
};