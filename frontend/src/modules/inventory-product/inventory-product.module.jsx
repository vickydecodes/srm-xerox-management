import { allow } from "@/core/utils/allow.util";
import { useAuth } from "@/core/contexts/auth.context";
import { createCrud } from "@/core/factory/entity.crud";
import { useInventoryProductStore } from "./inventory-product.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useInventoryProductColumns } from "./inventory-product.columns";
import { modals } from "./inventory-product.modals";




export const useInventoryProductModule = (exported) => {
  const { openModal } = useUI();
  const { user } = useAuth();
  const store = useInventoryProductStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;
  const { inventoryProducts } = apiurls;


  const crud = createCrud({
    entity: 'Inventory Product',
    urls: inventoryProducts,
    store: store,
    getRole: () => user?.role || null,
  });


    const openCreate = () => {
      return openModal(modals.create, { submitFn: (data) => crud.create(data), exported });
    };
  
    const openEdit = (inventoryProduct) => {
      return openModal(modals.edit, {
        inventoryProduct,
        submitFn: (data) => crud.edit(inventoryProduct._id, data),
        exported,
      });
    };
  
    const openDelete = (id, name) => {
      return openModal(modals.delete, {
        id,
        name,
        onConfirm: (id) => crud.delete(id),
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
      getQuery: () => useInventoryProductStore.getState().query,
      setQuery,
    });
  return {
     allow: {
      create: allow(['staff'], user?.role),
      update: allow(['staff'], user?.role),
      delete: allow(['staff'], user?.role),
    },
    get state() {
      return useInventoryProductStore.getState().list;
    },
    get loading() {
      return useInventoryProductStore.getState().loading;
    },
    get pagination() {
      return useInventoryProductStore.getState().pagination;
    },
    get current() {
      return useInventoryProductStore.getState().current;
    },
    set,add,update, remove, setCurrent, crud, fetch, reset, sortByColumn, filters: presets,
    csv,
    xlsx,
    pdf,
    getQuery,
    useInventoryProductColumns,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    openActiveStatus,
};

}