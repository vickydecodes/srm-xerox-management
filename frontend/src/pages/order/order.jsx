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
    { label: "Latest", action: (f) => orders.filters.latest(f) },
    { label: "Oldest", action: (f) => orders.filters.oldest(f) },
  ];

  const customConfigs = [
    {
      title: "Status",
      filters: [
        { label: "Draft", action: () => orders.filters.where("status", "draft") },
        { label: "Pending Approval", action: () => orders.filters.where("status", "pending") },
        { label: "In Progress", action: () => orders.filters.where("status", "in_progress") },
        { label: "Ready for Pickup", action: () => orders.filters.where("status", "ready_for_pickup") },
        { label: "Delivered", action: () => orders.filters.where("status", "delivered") },
        { label: "Rejected", action: () => orders.filters.where("status", "rejected") },
      ],
    },
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
      customs={customConfigs}
      onPaginationChange={(p) => paginator(orders, p)}
      onSortChange={(p) => sorter(orders, p)}
    />
  );
}