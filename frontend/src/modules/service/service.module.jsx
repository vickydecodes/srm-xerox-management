import { createCrud } from "@/core/factory/entity.crud";
import { useServiceColumns } from "./service.columns";
import { modals } from "./service.modals";
import { useServiceStore } from "./service.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useServiceModule = (exported) => {
  const { openModal } = useUI();

  // Subscribe reactively — triggers re-renders on change
  const list = useServiceStore((s) => s.list);
  const loading = useServiceStore((s) => s.loading);
  const pagination = useServiceStore((s) => s.pagination);
  const current = useServiceStore((s) => s.current);

  const store = useServiceStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { services } = apiurls;

  const crud = createCrud({
    entity: 'Service',
    urls: services,
    store: store,
    getRole: () => 'super_admin',
  });

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (formData) => crud.create(formData),
      exported,
    });
  };

  const openEdit = (service) => {
  setCurrent(service);
  return openModal(modals.edit, {
    service,
    submitFn: (formData) => crud.edit(service.id, formData),
    exported,
  });
};

  const openDelete = (service) => {
    return openModal(modals.delete, {
      id: service.id,
      name: service.name,
      onConfirm: (id) => crud.erase(id),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useServiceStore.getState().query,
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
    useServiceColumns,
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