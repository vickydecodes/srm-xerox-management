import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useAuth } from "@/core/contexts/auth.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function OrderPage() {
  const { orders } = useApi();
  const { role } = useAuth();
  const { useOrderColumns, state } = orders;
  const { load } = useLoader();

  const columns = useOrderColumns(orders);

  const filters = [
    { label: "Latest", action: orders.filters.latest },
    { label: "Oldest", action: orders.filters.oldest },
    { label: "Pending Approval", action: () => orders.filters.where("status", "pending") },
    { label: "Approved (Pending Bill)", action: () => orders.filters.where("status", "in_progress") },
    { label: "Billed & Completed", action: () => orders.filters.where("status", "completed") },
    { label: "Drafts", action: () => orders.filters.where("status", "draft") },
  ];

  useEffect(() => {
    load(orders);
  }, []);

  const canCreate = role === "department_admin" || role === "super_admin";

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey="purpose"
      create={canCreate ? createbtn("Create Order", () => orders.openCreate(), true) : null}
      manualPagination={true}
      reset={orders.reset}
      loading={orders.loading.getAll}
      page={orders.pagination.page}
      limit={orders.pagination.limit}
      pageCount={orders.pagination.pages}
      totalRows={orders.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(orders, p)}
      onSortChange={(p) => sorter(orders, p)}
    />
  );
}