import { useServiceColumns } from "./service.columns";
import { modals } from "./service.modals";
import { useServiceStore } from "./service.store";
import { useUI } from "@/core/contexts/ui.context";

export const useServiceModule = (exported) => {
  const { openModal } = useUI();
  const store = useServiceStore();
  const { set, add, update, remove, setCurrent } = store;

  const openCreate = () => {
    console.log('openCreate called');
    return openModal(modals.create, { submitFn: (data) => add(data), exported })
  }

  const openEdit = (service) => {
    setCurrent(service);
    return openModal(modals.create, {
      submitFn: (data) => update(service.id, data),
      exported,
      data: service,
    })
  }

  const data = [
    { id: 1, code: 'S-001', name: 'AC Repair', unit: 'unit', price: 500, active: true, materials: [] },
    { id: 2, code: 'S-002', name: 'Xerox Printing', unit: 'page', price: 2, active: true, materials: [] },
  ]

  const load = async () => {
    await set(data)
  }

  return {
    get state() {
      return useServiceStore.getState().list;
    },
    get loading() {
      return useServiceStore.getState().loading;
    },
    get pagination() {
      return useServiceStore.getState().pagination
    },
    get current() {
      return useServiceStore.getState().current;
    },
    set,
    add,
    update,
    remove,
    setCurrent,
    useServiceColumns,
    openCreate,
    openEdit,
    data,
    load
  }
}