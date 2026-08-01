import { useBillColumns } from "./bill.coulmns";
import { modals } from "./bill.modals";
import { useBillStore } from "./bill.store";
import { useUI } from "@/core/contexts/ui.context";

export const useBillModule = (exported) => {
  const { openModal } = useUI();
  const store = useBillStore();
  const { set, remove } = store;

  const openView = (bill) => {
    return openModal(modals.view, { bill, exported });
  };

  const openDelete = (id, code) => {
    return openModal(modals.delete, {
      id,
      code,
      onConfirm: (id) => remove(id),
      exported,
    });
  };

  const data = [
    {
      id: 1,
      code: 'B-001',
      items: [
        { type: 'InventoryProduct', name: 'T-Shirt', quantity: 2, price: 300, total: 600 },
      ],
      subtotal: 600,
      discount: 50,
      tax: 20,
      total: 570,
      status: 'PAID',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      code: 'B-002',
      items: [
        { type: 'Service', name: 'Installation', quantity: 1, price: 200, total: 200 },
      ],
      subtotal: 200,
      discount: 0,
      tax: 10,
      total: 210,
      status: 'UNPAID',
      createdAt: new Date().toISOString(),
    },
  ];

  const load = async () => {
    await set(data);
  };

  return {
    get state() {
      return useBillStore.getState().list;
    },
    get loading() {
      return useBillStore.getState().loading;
    },
    get pagination() {
      return useBillStore.getState().pagination;
    },
    get current() {
      return useBillStore.getState().current;
    },
    useBillColumns,
    openView,
    openDelete,
    data,
    load,
  };
};