import { allow } from "@/core/utils/allow.util";
import { createCrud } from "@/core/factory/entity.crud";
import { useShopAdminColumns } from "./shop-admin.columns";
import { modals } from "./shop-admin.modals";
import { useShopAdminStore } from "./shop-admin.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

const ROLE = 'shop_admin';

export const useShopAdminModule = (exported) => {
  const { openModal } = useUI();

  const list = useShopAdminStore((s) => s.list);
  const loading = useShopAdminStore((s) => s.loading);
  const pagination = useShopAdminStore((s) => s.pagination);
  const current = useShopAdminStore((s) => s.current);

  const store = useShopAdminStore();
  const { set, setCurrent, setQuery } = store;
  const { user, adminResetPassword } = useAuth();

  const { shop_admin } = apiurls;

  const crud = createCrud({
    entity: 'Shop Admin',
    urls: shop_admin,
    store: store,
    getRole: () => user?.role || null,
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

  const openResetPassword = (admin) => {
    return openModal(modals.resetPassword, {
      id: admin._id,
      name: admin.name,
      submitFn: (targetId, newPassword) =>
        adminResetPassword(targetId, ROLE, newPassword),
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

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
    crud,
    getQuery: () => useShopAdminStore.getState().query,
    setQuery,
  });

  return {
    allow: {
      create: allow(['super_admin'], user?.role),
      update: allow(['super_admin'], user?.role),
      delete: allow(['super_admin'], user?.role),
    },
    get state() { return useShopAdminStore.getState().list; },
    get loading() { return useShopAdminStore.getState().loading; },
    get pagination() { return useShopAdminStore.getState().pagination; },
    get current() { return useShopAdminStore.getState().current; },
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
    openResetPassword,
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