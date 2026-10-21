import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useAuth } from "@/core/contexts/auth.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";

export default function XeroxOrderPage() {
  const navigate = useNavigate();
  const { xeroxOrders } = useApi();
  const { role } = useAuth();
  const { load } = useLoader();

  const columns = xeroxOrders.useXeroxOrderColumns(xeroxOrders);

  const filters = [
    { label: "Latest", action: (f) => xeroxOrders.filters.latest(f) },
    { label: "Oldest", action: (f) => xeroxOrders.filters.oldest(f) },
  ];

  const customConfigs = [
    {
      title: "Status",
      filters: [
        {
          label: "Draft",
          action: () => xeroxOrders.filters.where("status", "draft"),
        },
        {
          label: "Pending Approval",
          action: () => xeroxOrders.filters.where("status", "pending"),
        },
        {
          label: "In Progress",
          action: () => xeroxOrders.filters.where("status", "in_progress"),
        },
        {
          label: "Ready for Pickup",
          action: () => xeroxOrders.filters.where("status", "ready_for_pickup"),
        },
        {
          label: "Delivered",
          action: () => xeroxOrders.filters.where("status", "delivered"),
        },
        {
          label: "Rejected",
          action: () => xeroxOrders.filters.where("status", "rejected"),
        },
      ],
    },
  ];

  useEffect(() => {
    load(xeroxOrders);
  }, []);

  const canCreate = role === "department_admin" || role === "super_admin";

  return (
    <div className="space-y-4">
      <DataTable
        data={xeroxOrders.state}
        columns={columns}
        searchKey="purpose"
        searchPlaceholder="Search xerox orders by purpose or description..."
        create={
          canCreate
            ? createbtn("Create Xerox Order", () => navigate(`/${role}/order-creation?tab=xerox`), true)
            : null
        }
        manualPagination={true}
        reset={xeroxOrders.reset}
        loading={xeroxOrders.loading.getAll}
        page={xeroxOrders.pagination.page}
        limit={xeroxOrders.pagination.limit}
        pageCount={xeroxOrders.pagination.pages}
        totalRows={xeroxOrders.pagination.total}
        filters={filters}
        customs={customConfigs}
        onPaginationChange={(p) => paginator(xeroxOrders, p)}
        onSortChange={(p) => sorter(xeroxOrders, p)}
      />
    </div>
  );
}
