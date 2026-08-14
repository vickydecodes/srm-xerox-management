import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Order() {
  const { orders } = useApi();

  const { useOrderColumns, state } = orders;
  const { load } = useLoader();

  const columns = useOrderColumns(orders);

  const filters = [
    { label: 'Draft', action: () => orders.filters.filterByStatus('draft') },
    { label: 'Pending', action: () => orders.filters.filterByStatus('pending') },
    { label: 'In Progress', action: () => orders.filters.filterByStatus('in_progress') },
    { label: 'Completed', action: () => orders.filters.filterByStatus('completed') },
    { label: 'Rejected', action: () => orders.filters.filterByStatus('rejected') },
  ];

  useEffect(() => {
    load(orders);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'code'}
      create={createbtn('Create Order', () => orders.openCreate(), true)}
      manualPagination={true}
      reset={orders.reset}
      loading={orders.loading.getAll}
      limit={orders.pagination.limit}
      pageCount={orders.pagination.pages}
      totalRows={orders.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(orders, p)}
      onSortChange={(p) => sorter(orders, p)}
    />
  );
}