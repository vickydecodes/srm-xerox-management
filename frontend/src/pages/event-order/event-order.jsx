import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useAuth } from "@/core/contexts/auth.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";

export default function EventOrderPage() {
  const navigate = useNavigate();
  const { eventOrders } = useApi();
  const { role } = useAuth();
  const { load } = useLoader();

  const columns = eventOrders.useEventOrderColumns(eventOrders);

  const filters = [
    { label: "Latest", action: (f) => eventOrders.filters.latest(f) },
    { label: "Oldest", action: (f) => eventOrders.filters.oldest(f) },
  ];

  const customConfigs = [
    {
      title: "Status",
      filters: [
        {
          label: "Draft",
          action: () => eventOrders.filters.where("status", "draft"),
        },
        {
          label: "Pending Approval",
          action: () => eventOrders.filters.where("status", "pending"),
        },
        {
          label: "In Progress",
          action: () => eventOrders.filters.where("status", "in_progress"),
        },
        {
          label: "Ready for Pickup",
          action: () => eventOrders.filters.where("status", "ready_for_pickup"),
        },
        {
          label: "Delivered",
          action: () => eventOrders.filters.where("status", "delivered"),
        },
        {
          label: "Rejected",
          action: () => eventOrders.filters.where("status", "rejected"),
        },
      ],
    },
  ];

  useEffect(() => {
    load(eventOrders);
  }, []);

  const canCreate = role === "department_admin" || role === "super_admin";

  return (
    <div className="space-y-4">
      <DataTable
        data={eventOrders.state}
        columns={columns}
        searchKey="eventName"
        searchPlaceholder="Search event orders by title..."
        create={
          canCreate
            ? createbtn("Create Event Order", () => navigate(`/${role}/order-creation?tab=work-order`), true)
            : null
        }
        manualPagination={true}
        reset={eventOrders.reset}
        loading={eventOrders.loading.getAll}
        page={eventOrders.pagination.page}
        limit={eventOrders.pagination.limit}
        pageCount={eventOrders.pagination.pages}
        totalRows={eventOrders.pagination.total}
        filters={filters}
        customs={customConfigs}
        onPaginationChange={(p) => paginator(eventOrders, p)}
        onSortChange={(p) => sorter(eventOrders, p)}
      />
    </div>
  );
}
