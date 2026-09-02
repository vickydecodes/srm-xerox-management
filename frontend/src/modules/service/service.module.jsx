import { createCrud } from "@/core/factory/entity.crud";
import { useServiceColumns } from "./service.columns";
import { modals } from "./service.modals";
import { useServiceStore } from "./service.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useServiceModule = (exported) => {
  const { openModal } = useUI();

  
  const list = useServiceStore((s) => s.list);
  const loading = useServiceStore((s) => s.loading);
  const pagination = useServiceStore((s) => s.pagination);
  const current = useServiceStore((s) => s.current);

  const store = useServiceStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { services } = apiurls;

  const crud = createCrud({
    entity: "Service",
    urls: services,
    store: store,
    getRole: () => "super_admin",
  });

  const openErase = (id) => {
    return openModal(modals.erase, {
      id,
      submitFn: (id) => crud.erase(id), // permanent delete
      closeModal: () => {}, // will be injected by openModal usually
      exported,
    });
  };

  const openView = (service) => {
    return openModal(modals.view, { service, exported });
  };

  const openRetrieve = (id) => {
    return openModal(modals.retrieve, {
      id,
      submitFn: (id) =>
        crud.retrieve?.(id) ?? crud.edit(id, { deleted: false }),
      exported,
    });
  };

  const openActiveStatus = (service) => {
    return openModal(modals.activeStatus, {
      id: service._id ?? service.id,
      status: service.active,
      submitFn: (id, data) => crud.setActiveStatus(id, data),
      loading: store.loading.edit,
      exported,
    });
  };
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
    submitFn: (formData) => crud.edit(service._id, formData),
    exported,
  });
};

  const openDelete = (service) => {
    return openModal(modals.delete, {
      id: service.id,
      name: service.name,
      onConfirm: (id) => crud.delete(id),
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
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
    openErase,
    openRetrieve,
    openActiveStatus,
    openView, 
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
