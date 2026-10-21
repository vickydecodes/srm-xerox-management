import { allow } from "@/core/utils/allow.util";
import { createCrud } from "@/core/factory/entity.crud";
import { useEventOrderColumns } from "./event-order.columns";
import { modals } from "./event-order.modals";
import { useEventOrderStore } from "./event-order.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { useNavigate } from "react-router-dom";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";
import { useBillStore } from "@/modules/bill/bill.store";

export const useEventOrderModule = (exported) => {
  let openModal = () => {};
  try {
    const ui = useUI();
    if (ui?.openModal) openModal = ui.openModal;
  } catch (_) {}

  let user = null;
  let role = null;
  try {
    const auth = useAuth();
    if (auth) {
      user = auth.user;
      role = auth.role;
    }
  } catch (_) {}

  const store = useEventOrderStore();

  let navigate = () => {};
  try {
    navigate = useNavigate();
  } catch (_) {}

  const { setQuery } = store;
  const { eventOrders: eventOrderUrls } = apiurls;

  const crud = createCrud({
    entity: "EventOrder",
    urls: eventOrderUrls,
    store: store,
    getRole: () => user?.role || null,
  });

  const openView = (order) => {
    return openModal(modals.view, { order, exported });
  };

  const openEdit = (order) => {
    // Navigate to order-creation with edit query or open edit modal
    navigate(`/${role}/order-creation?tab=event&editId=${order._id}`);
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
      order,
      submitFn: (id, data) =>
        crud[isBranch ? "branchApprove" : "superAdminApprove"](id, {
          status: data.status,
          remarks: data.remarks,
          verifyProofs: data.verifyProofs,
        }),
      exported,
    });
  };

  const convertToBill = (order) => {
    useBillStore.getState().setCurrent({
      ...order,
      eventOrder: order._id,
    });
    navigate(`/${role}/bill-creation?eventOrderId=${order._id}`);
  };

  const deliver = (id) => crud.deliver(id);
  const readyForPickup = (id) => crud.readyForPickup(id);
  const inProgress = (id) => crud.inProgress(id);

  const {
    fetch,
    reset,
    sortByColumn,
    presets,
    csv,
    xlsx,
    pdf,
    getQuery,
  } = createEntityQueryActions({
    crud,
    getQuery: () => useEventOrderStore.getState().query,
    setQuery,
  });

  return {
    allow: {
      create: allow(["department_admin", "super_admin"], user?.role),
      update: allow(["department_admin", "super_admin"], user?.role),
      delete: allow(["super_admin"], user?.role),
    },
    get state() {
      return useEventOrderStore.getState().list;
    },
    get loading() {
      return useEventOrderStore.getState().loading;
    },
    get pagination() {
      return useEventOrderStore.getState().pagination;
    },
    get current() {
      return useEventOrderStore.getState().current;
    },
    useEventOrderColumns,
    openView,
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
