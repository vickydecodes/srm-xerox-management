import { useDepartmentColumns } from "./department.columns";
import { modals } from "./department.modals";
import { useDepartmentStore } from "./department.store";
import { useUI } from "@/core/contexts/ui.context";


export const useDepartmentModule = (exported) => {
    const { openModal } = useUI();
    const store = useDepartmentStore();
    const { set, add, update, remove, setCurrent } = store;

    const openCreate = () => {
        return openModal(modals.create, {  submitFn: (data) => add(data), exported })
    }

    const data = [
        {
            id: 1, name: 'rajkaran'
        },
        {
            id: 2, name: 'ajay vikram'
        }
    ]


    const load = async() => {
        await set(data)
    }




    return {
        get state() {
            return useDepartmentStore.getState().list;
        },
        get loading() {
            return useDepartmentStore.getState().loading;
        },
        get pagination() {
            return useDepartmentStore.getState().pagination
        },
        get current() {
            return useDepartmentStore.getState().current;
        },
        set,
        add,
        update,
        remove,
        setCurrent,
        useDepartmentColumns,
        openCreate,
        data,
        load
    }
}