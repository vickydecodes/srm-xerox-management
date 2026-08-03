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

  const { products } = apiurls

 


  const crud = createCrud({
    entity: 'Product',
    urls: products,
    store: store,
    getRole: () => 'super_admin'
  })



   const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => crud.create(data), exported });
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
      onConfirm: (id) => crud.erase(id),
      exported,
    });
  };


  const toggleActive = (product) => {
    return update(product.id, { active: !product.active });
  };


  const {fetch, reset, sortByColumn, presets} = createEntityQueryActions({
    crud,
    getQuery: () => useProductStore.getState().query,
    setQuery
  })


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