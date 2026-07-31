import { useProductColumns } from "./product.columns";
import { modals } from "./product.modals";
import { useProductStore } from "./product.store";
import { useUI } from "@/core/contexts/ui.context";

export const useProductModule = (exported) => {
  const { openModal } = useUI();
  const store = useProductStore();
  const { set, add, update, remove, setCurrent } = store;

  const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => add(data), exported });
  };

  const openEdit = (product) => {
    return openModal(modals.edit, {
      product,
      submitFn: (data) => update(product.id, data),
      exported,
    });
  };

  const openDelete = (id, name) => {
    return openModal(modals.delete, {
      id,
      name,
      onConfirm: (id) => remove(id),
      exported,
    });
  };


  const toggleActive = (product) => {
    return update(product.id, { active: !product.active });
  };

  const data = [
    {
      id: 1,
      code: 'P-001',
      name: 'T-Shirt',
      description: 'Cotton round-neck t-shirt',
      variants: { color: ['red', 'blue'], size: ['S', 'M', 'L'] },
      active: true,
    },
    {
      id: 2,
      code: 'P-002',
      name: 'Mug',
      description: 'Ceramic coffee mug',
      variants: { color: ['white', 'black'] },
      active: true,
    },
  ];

  const load = async () => {
    await set(data);
  };

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
    data,
    load,
  };
};