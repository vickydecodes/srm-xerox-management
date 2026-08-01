import { useServiceColumns } from "./service.columns";
import { modals } from "./service.modals";
import { useServiceStore } from "./service.store";
import { useUI } from "@/core/contexts/ui.context";

export const useServiceModule = (exported) => {
  const { openModal } = useUI();

  // Subscribe reactively — this is what actually triggers re-renders on change
  const list = useServiceStore((s) => s.list);
  const loading = useServiceStore((s) => s.loading);
  const pagination = useServiceStore((s) => s.pagination);
  const current = useServiceStore((s) => s.current);

  const { set, add, update, remove, setCurrent } = useServiceStore();

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: (formData) =>
        add({
          id: Date.now(),       // temporary client-side id until real API assigns _id
          code: `TEMP-${Date.now().toString().slice(-4)}`, // placeholder until backend generates real code
          ...formData,
        }),
      exported,
    })
  }

  const openEdit = (service) => {
    setCurrent(service);
    return openModal(modals.create, {
      submitFn: (formData) => update(service.id, formData),
      exported,
      data: service,
    })
  }

  const openDelete = (service) => {
  return openModal(modals.delete, {
    id: service.id,
    name: service.name,
    submitFn: () => remove(service.id),
    exported,
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
    data,
    load
  }
}