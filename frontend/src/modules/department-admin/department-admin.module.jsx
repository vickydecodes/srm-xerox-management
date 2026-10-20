import { allow } from "@/core/utils/allow.util";
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
  const { user, adminResetPassword } = useAuth();

  const { department_admin } = apiurls;

  const crud = createCrud({
    entity: "Department Admin",
    urls: department_admin,
    store: store,
    getRole: () => user?.role || null,
  });

  const openResetPassword = (admin) => {
    const adminId = admin._id || admin.id;
    return openModal(modals.resetPassword, {
      id: adminId,
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
    const adminId = admin._id || admin.id;
    setCurrent(admin);
    return openModal(modals.edit, {
      admin,
      submitFn: (formData) => crud.edit(adminId, formData),
      exported,
    });
  };

  const openDelete = (admin) => {
    const adminId = admin._id || admin.id;
    return openModal(modals.delete, {
      id: adminId,
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
    fetch,
    reset,
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

  return {
     allow: {
      create: allow(['super_admin', 'branch_admin'], user?.role),
      update: allow(['super_admin', 'branch_admin'], user?.role),
      delete: allow(['super_admin', 'branch_admin'], user?.role),
    },
    get state() { return useDepartmentAdminStore.getState().list; },
    get loading() { return useDepartmentAdminStore.getState().loading; },
    get pagination() { return useDepartmentAdminStore.getState().pagination; },
    get current() { return useDepartmentAdminStore.getState().current; },
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
