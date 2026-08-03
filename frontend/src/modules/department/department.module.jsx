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
    entity: 'Department',
    urls: departments,
    store: store,
    getRole: () => 'super_admin',
  });

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (data) => crud.create(data),
      exported,
    });
  };

  const openEdit = (dept) => {
    setCurrent(dept);
    return openModal(modals.create, {
      submitFn: (formData) => crud.edit(dept.id, formData),
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

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useDepartmentStore.getState().query,
    setQuery,
  });

  return {
    state: list,
    loading,
    pagination,
    current,
    set,
    add,
    update,
    remove,
    setCurrent,
    useDepartmentColumns,
    openCreate,
    openEdit,
    openDelete,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
  };
};