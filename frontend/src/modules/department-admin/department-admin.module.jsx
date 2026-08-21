import { createCrud } from "@/core/factory/entity.crud";
import { useDepartmentAdminColumns } from "./department-admin.columns";
import { modals } from "./department-admin.modals";
import { useDepartmentAdminStore } from "./department-admin.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

const ROLE = "department_admin";

export const useDepartmentAdminModule = (exported) => {
  const { openModal } = useUI();

  const list = useDepartmentAdminStore((s) => s.list);
  const loading = useDepartmentAdminStore((s) => s.loading);
  const pagination = useDepartmentAdminStore((s) => s.pagination);
  const current = useDepartmentAdminStore((s) => s.current);

  const store = useDepartmentAdminStore();
  const { set, setCurrent, setQuery } = store;

  const { users } = apiurls;

  const crud = createCrud({
    entity: "Department Admin",
    urls: users,
    store: store,
    getRole: () => "super_admin",
  });

  const { adminResetPassword } = useAuth();

  const openResetPassword = (admin) => {
    return openModal(modals.resetPassword, {
      id: admin._id,
      name: admin.name,
      submitFn: (targetId, newPassword) =>
        adminResetPassword(targetId, ROLE, newPassword),
      exported,
    });
  };

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
    getQuery: () => useDepartmentAdminStore.getState().query,
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
    useDepartmentAdminColumns,
    openView,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    openResetPassword,
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
