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
  const {adminResetPassword}=useAuth()

  const list = useStaffStore((s) => s.list);
  const loading = useStaffStore((s) => s.loading);
  const pagination = useStaffStore((s) => s.pagination);
  const current = useStaffStore((s) => s.current);

  const store = useStaffStore();
  const { set, setCurrent, setQuery } = store;

  const { users } = apiurls;

  const crud = createCrud({
    entity: 'Staff',
    urls: users,
    store: store,
    getRole: () => 'super_admin',
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

  const { fetch: baseFetch, reset: baseReset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useStaffStore.getState().query,
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
  };
};