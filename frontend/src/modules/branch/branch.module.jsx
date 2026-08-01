import { useBranchColumns } from "./branch.coulmns";
import { modals } from "./branch.modals";
import { useBranchStore } from "./branch.store";
import { useUI } from "@/core/contexts/ui.context";

export const useBranchModule = (exported) => {
  const { openModal } = useUI();
  const store = useBranchStore();
  const { set, add, update, remove, setCurrent } = store;

  const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => add(data), exported });
  };

  const openEdit = (branch) => {
    return openModal(modals.edit, {
      branch,
      submitFn: (data) => update(branch.id, data),
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

  const data = [
  { id: 1, code: 'BR-001', name: 'FSH', active: true, createdAt: new Date().toISOString() },
  { id: 2, code: 'BR-002', name: 'Easwari', active: true, createdAt: new Date().toISOString() },
];

  const load = async () => {
    await set(data);
  };

  return {
    get state() {
      return useBranchStore.getState().list;
    },
    get loading() {
      return useBranchStore.getState().loading;
    },
    get pagination() {
      return useBranchStore.getState().pagination;
    },
    get current() {
      return useBranchStore.getState().current;
    },
    set,
    add,
    update,
    remove,
    setCurrent,
    useBranchColumns,
    openCreate,
    openEdit,
    openDelete,
    data,
    load,
  };
};