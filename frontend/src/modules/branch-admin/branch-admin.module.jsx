import { createCrud } from "@/core/factory/entity.crud";
import { useBranchAdminColumns } from "./branch-admin.columns";
import { modals } from "./branch-admin.modals";
import { useBranchAdminStore } from "./branch-admin.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

const ROLE = "branch_admin";

export const useBranchAdminModule = (exported) => {
  const { openModal } = useUI();

  const list = useBranchAdminStore((s) => s.list);
  const loading = useBranchAdminStore((s) => s.loading);
  const pagination = useBranchAdminStore((s) => s.pagination);
  const current = useBranchAdminStore((s) => s.current);

  const store = useBranchAdminStore();
  const { set, setCurrent, setQuery } = store;
  const { adminResetPassword } = useAuth();

  const { users } = apiurls;

  const crud = createCrud({
    entity: "Branch Admin",
    urls: users,
    store: store,
    getRole: () => "super_admin",
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
      submitFn: (formData) => crud.edit(admin._id, formData), // ← admin._id
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
      id, // ← passed straight through from admin._id
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
  } = createEntityQueryActions({
    crud,
    getQuery: () => useBranchAdminStore.getState().query,
    setQuery,
  });

  // always scope to role: branch_admin, since `users` is a shared collection
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
    useBranchAdminColumns,
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
  };
};
