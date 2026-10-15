import { allow } from "@/core/utils/allow.util";
import { createCrud } from "@/core/factory/entity.crud";
import { useStaffColumns } from "./staff-admin.columns";
import { modals } from "./staff-admin.modals";
import { useStaffStore } from "./staff-admin.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

const ROLE = 'staff';

export const useStaffModule = (exported) => {
  const { openModal } = useUI();
  const { user, adminResetPassword }=useAuth()

  const list = useStaffStore((s) => s.list);
  const loading = useStaffStore((s) => s.loading);
  const pagination = useStaffStore((s) => s.pagination);
  const current = useStaffStore((s) => s.current);

  const store = useStaffStore();
  const { set, setCurrent, setQuery } = store;

  const { staff } = apiurls;

  const crud = createCrud({
    entity: 'Staff',
    urls: staff,
    store: store,
    getRole: () => user?.role || null,
  });

  const openView = (staff) => {
    return openModal(modals.view, { staff, exported });
  };

  const openResetPassword = (staff) => {
    return openModal(modals.resetPassword, {
      staff,
      submitFn: (formData) => adminResetPassword(staff._id, formData),
      exported,
    });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (formData) => crud.create({ ...formData, role: ROLE }),
      exported,
    });
  };

  const openEdit = (staff) => {
    setCurrent(staff);
    return openModal(modals.edit, {
      staff,
      submitFn: (formData) => crud.edit(staff._id, formData),
      exported,
    });
  };

  const openDelete = (staff) => {
    return openModal(modals.delete, {
      id: staff._id,
      name: staff.name,
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
    getQuery: () => useStaffStore.getState().query,
    setQuery,
  });

  return {
    allow: {
      create: allow(undefined, user?.role),
      update: allow(undefined, user?.role),
      delete: allow(undefined, user?.role),
    },
    get state() { return useStaffStore.getState().list; },
    get loading() { return useStaffStore.getState().loading; },
    get pagination() { return useStaffStore.getState().pagination; },
    get current() { return useStaffStore.getState().current; },
    set,
    setCurrent,
    useStaffColumns,
    openView,
    openCreate,
    openResetPassword,
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