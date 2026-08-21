import { createCrud } from "@/core/factory/entity.crud";
import { useCreditColumns } from "./credits.columns";
import { modals } from "./credits.modals";
import { useCreditStore } from "./credits.store";
import { useUI } from "@/core/contexts/ui.context";
import { apiurls } from "@/core/api/api.urls";
import { createEntityQueryActions } from "@/core/utils/entity.util";
import { useAuth } from "@/core/contexts/auth.context";

export const useCreditModule = (exported) => {
  const { openModal } = useUI();
  const { user } = useAuth();

  const list = useCreditStore((s) => s.list);
  const loading = useCreditStore((s) => s.loading);
  const pagination = useCreditStore((s) => s.pagination);
  const current = useCreditStore((s) => s.current);

  const store = useCreditStore();
  const { set, add, update, remove, setCurrent, setQuery } = store;

  const { credits } = apiurls;

  const crud = createCrud({
    entity: "Credit",
    urls: credits,
    store: store,
    getRole: () => "super_admin",
  });

  const openCreate = () => {
    return openModal(modals.create, {
      exported: {
        ...exported,
        user,
        fetch,
      },
    });
  };

  const openViewBills = (payment) => {
    return openModal(modals.viewBills, {
      payment,
      exported,
    });
  };

  const { fetch, reset, sortByColumn, presets, csv, xlsx, pdf, getQuery } = createEntityQueryActions({
    crud,
    getQuery: () => useCreditStore.getState().query,
    setQuery,
  });

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
    useCreditColumns,
    openCreate,
    openViewBills,
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
