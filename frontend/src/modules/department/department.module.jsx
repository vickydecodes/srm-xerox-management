import { useDepartmentColumns } from "./department.columns";
import { modals } from "./department.modals";
import { useDepartmentStore } from "./department.store";
import { useUI } from "@/core/contexts/ui.context";


export const useDepartmentModule = (exported) => {
  const { openModal } = useUI();

  // Subscribe reactively so components re-render on store changes
  const list = useDepartmentStore((s) => s.list);
  const loading = useDepartmentStore((s) => s.loading);
  const pagination = useDepartmentStore((s) => s.pagination);
  const current = useDepartmentStore((s) => s.current);

  const { set, add, update, remove, setCurrent } = useDepartmentStore();

  const openCreate = () => {
    return openModal(modals.create, { submitFn: (data) => add(data), exported })
  }

  const openEdit = (dept) => {
    setCurrent(dept);
    return openModal(modals.create, {
      submitFn: (formData) => update(dept.id, formData),
      exported,
      data: dept,
    })
  }

  const openDelete = (dept) => {
    return openModal(modals.delete, {
      id: dept.id,
      name: dept.name,
      submitFn: () => remove(dept.id),
      exported,
    })
  }

  const data = [
    { id: 1, name: 'rajkaran' },
    { id: 2, name: 'ajay vikram' },
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
    useDepartmentColumns,
    openCreate,
    openEdit,
    openDelete,
    data,
    load
  }
}