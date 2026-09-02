import { createCrud } from "@/core/factory/entity.crud";
import { useShopColumns } from "./shop.columns";
import { modals } from "./shop.modals";
import { useShopStore } from "./shop.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";

export const useShopModule = (exported) => {
  const { openModal } = useUI();

  const list = useShopStore((s) => s.list);
  const loading = useShopStore((s) => s.loading);
  const pagination = useShopStore((s) => s.pagination);
  const current = useShopStore((s) => s.current);

  const store = useShopStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { shops } = apiurls;

  const crud = createCrud({
    entity: "Shop",
    urls: shops,
    store: store,
    getRole: () => "super_admin",
  });

  const openView = (shop) => {
    return openModal(modals.view, { shop, exported });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (data) => crud.create(data),
      exported,
    });
  };

  const openEdit = (shop) => {
    setCurrent(shop);
    return openModal(modals.create, {
      submitFn: (formData) => crud.edit(shop._id, formData),
      exported,
      data: shop,
    });
  };

  const openDelete = (id) => {
    return openModal(modals.delete, {
      id,
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
      loading: store.loading.edit,
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
    crud,
    getQuery: () => useShopStore.getState().query,
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
    useShopColumns,
    openCreate,
    openEdit,
    openDelete,
    openView,
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