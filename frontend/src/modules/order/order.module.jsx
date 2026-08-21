import { createCrud } from "@/core/factory/entity.crud";
import { useOrderColumns } from "./order.columns";
import { modals } from "./order.modals";
import { useOrderStore } from "./order.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";
import { useBillStore } from "@/modules/bill/bill.store";

export const useOrderModule = (exported) => {
  const { openModal } = useUI();
  const {role} = useAuth();
  const store = useOrderStore();
  const navigate = useNavigate();

  const { setQuery } = store;
  const { orders: orderUrls } = apiurls;

  const crud = createCrud({
    entity: "Order",
    urls: orderUrls,
    store: store,
    getRole: () => "super_admin",
  });

  const openView = (order) => {
    return openModal(modals.view, { order, exported });
  };

  const openCreate = () => {
    return openModal(modals.create, {
      submitFn: async (data) => {
        const created = await crud.create(data);
        if (created) {
          setTimeout(() => {
            openView(created);
          }, 100);
        }
        return created;
      },
      exported,
    });
  };

  const openEdit = (order) => {
    return openModal(modals.edit, {
      order,
      submitFn: (data) => crud.edit(order._id, data),
      exported,
    });
  };

  const openDelete = (order) => {
    return openModal(modals.delete, {
      id: order._id,
      code: order.code || "Draft",
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

  const submit = (id) => crud.submit(id);

  const openApprovalDialog = (order, roleType) => {
    const isBranch = roleType === "branch";
    const modalKey = isBranch ? "branchAdminApproval" : "superAdminApproval";
    return openModal(modals[modalKey], {
      id: order._id,
      submitFn: (id, data) =>
        crud[isBranch ? "branchApprove" : "superAdminApprove"](id, {
          status: data.status,
          remarks: data.remarks,
        }),
      exported,
    });
  };

  const convertToBill = (order) => {
    useBillStore.getState().setCurrent(order);
    navigate(`/${role}/bill-creation`);
  };

  const deliver = (id) => crud.deliver(id);
  const readyForPickup = (id) => crud.readyForPickup(id);
  const inProgress = (id) => crud.inProgress(id);

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
    crud,
    getQuery: () => useOrderStore.getState().query,
    setQuery,
  });

  return {
    get state() {
      return useOrderStore.getState().list;
    },
    get loading() {
      return useOrderStore.getState().loading;
    },
    get pagination() {
      return useOrderStore.getState().pagination;
    },
    get current() {
      return useOrderStore.getState().current;
    },
    useOrderColumns,
    openView,
    openCreate,
    openEdit,
    openDelete,
    openErase,
    openRetrieve,
    submit,
    openApprovalDialog,
    convertToBill,
    deliver,
    readyForPickup,
    inProgress,
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