import { createCrud } from "@/core/factory/entity.crud";
import { useProductColumns } from "./product.columns";
import { modals } from "./product.modals";
import { useProductStore } from "./product.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useProductModule = (exported) => {
  const { openModal } = useUI();
  const store = useProductStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { products } = apiurls;

  const crud = createCrud({
    entity: "Product",
    urls: products,
    store: store,
    getRole: () => "super_admin",
  });

  const openView = (product) => {
    return openModal(modals.view, { product, exported });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (data) => crud.create(data),
      exported,
    });
  };

  const openEdit = (product) => {
    return openModal(modals.edit, {
      product,
      submitFn: (data) => crud.edit(product._id, data),
      exported,
    });
  };

  const openDelete = (id, name) => {
    return openModal(modals.delete, {
      id,
      name,
      onConfirm: (id) => crud.delete(id), // soft delete
      exported,
    });
  };

  const openErase = (id) => {
    return openModal(modals.erase, {
      id,
      submitFn: (id) => crud.erase(id), // permanent delete
      closeModal: () => {}, // will be injected by openModal usually
      exported,
    });
  };

  const openRetrieve = (id) => {
    return openModal(modals.retrieve, {
      id,
      submitFn: (id) =>
        crud.retrieve?.(id) ?? crud.edit(id, { deleted: false }),
      exported,
    });
  };

  const openActiveStatus = (product) => {
    return openModal(modals.activeStatus, {
      id: product._id ?? product.id,
      status: product.active,
      submitFn: (id, data) => crud.setActiveStatus(id, data),
      loading: store.loading.edit,
      exported,
    });
  };

  // Keep the simple toggle if you still want an immediate action without modal
  const toggleActive = (product) => {
    return update(product._id ?? product.id, { active: !product.active });
  };

  const { fetch, reset, sortByColumn, presets } = createEntityQueryActions({
    crud,
    getQuery: () => useProductStore.getState().query,
    setQuery,
  });

  return {
    get state() {
      return useProductStore.getState().list;
    },
    get loading() {
      return useProductStore.getState().loading;
    },
    get pagination() {
      return useProductStore.getState().pagination;
    },
    get current() {
      return useProductStore.getState().current;
    },
    set,
    add,
    update,
    remove,
    setCurrent,
    useProductColumns,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    openView,
    openActiveStatus,
    toggleActive,
    crud,
    fetch,
    reset,
    sortByColumn,
    filters: presets,
    create: crud.create,
    edit: crud.edit,
    delete: crud.delete,
  };
};
