import { createCrud } from "@/core/factory/entity.crud";
import { useDepartmentColumns } from "./department.columns";
import { modals } from "./department.modals";
import { useDepartmentStore } from "./department.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useDepartmentModule = (exported) => {
  const { openModal } = useUI();

  const list = useDepartmentStore((s) => s.list);
  const loading = useDepartmentStore((s) => s.loading);
  const pagination = useDepartmentStore((s) => s.pagination);
  const current = useDepartmentStore((s) => s.current);

  const store = useDepartmentStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { departments } = apiurls;

  const crud = createCrud({
    entity: "Department",
    urls: departments,
    store: store,
    getRole: () => "super_admin",
  });

  const openView = (department) => {
    return openModal(modals.view, { department, exported });
  };

  const openManageCredit = (department) => {
    return openModal(modals.manageCredit, { department, exported });
  };

  const openClearCreditByBill = (department) => {
  return openModal(modals.clearCreditByBill, { department, exported });
};

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (data) => crud.create(data),
      exported,
    });
  };

  const openEdit = (dept) => {
    setCurrent(dept);
    return openModal(modals.create, {
      submitFn: (formData) => crud.edit(dept._id, formData),
      exported,
      data: dept,
    });
  };

  const openDelete = (dept) => {
    return openModal(modals.delete, {
      id: dept.id,
      name: dept.name,
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

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useDepartmentStore.getState().query,
    setQuery,
  });

  const clearCredit = (id, data) => crud.clearCredit(id, data);

  return {
    state: list,
    loading,
    pagination,
    current,
    set,
    add,
    update,
    clearCredit,
    remove,
    setCurrent,
    useDepartmentColumns,
    openCreate,
    openClearCreditByBill,
    openEdit,
    openDelete,
    openView,
    openManageCredit,
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
