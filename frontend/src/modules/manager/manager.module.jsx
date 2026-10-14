import { allow } from "@/core/utils/allow.util";
import { createCrud } from "@/core/factory/entity.crud";
import { useManagerColumns } from "./manager.columns";
import { modals } from "./manager.modals";
import { useManagerStore } from "./manager.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

const ROLE = "manager";

export const useManagerModule = (exported) => {
  const { openModal } = useUI();

  const store = useManagerStore();
  const { set, setCurrent, setQuery } = store;
  let auth = {};
  try {
    auth = useAuth() || {};
  } catch (_) {
    // outside AuthProvider (e.g. testing)
  }
  const { user, adminResetPassword } = auth;

  const { users } = apiurls;

  const crud = createCrud({
    entity: "Manager",
    urls: users,
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

  const {
    fetch: baseFetch,
    reset: baseReset,
    sortByColumn,
    presets,
    csv,
    xlsx,
    pdf,
    getQuery,
  } = createEntityQueryActions({
    crud,
    getQuery: () => useManagerStore.getState().query,
    setQuery,
  });

  const fetch = (incoming) => baseFetch({ role: ROLE, ...(incoming || {}) });
  const reset = (extras) => baseReset({ role: ROLE, ...(extras || {}) });

  return {
    allow: {
      create: allow(['super_admin'], user?.role),
      update: allow(['super_admin'], user?.role),
      delete: allow(['super_admin'], user?.role),
    },
    get state() { return useManagerStore.getState().list; },
    get loading() { return useManagerStore.getState().loading; },
    get pagination() { return useManagerStore.getState().pagination; },
    get current() { return useManagerStore.getState().current; },
    set,
    setCurrent,
    useManagerColumns,
    openView,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    openActiveStatus,
    openResetPassword,
    crud,
    fetch: fetch({ role: 'manager' }),
    reset,
    sortByColumn,
    filters: presets,
    csv,
    xlsx,
    pdf,
    getQuery,
  };
};
