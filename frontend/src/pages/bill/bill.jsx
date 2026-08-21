import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Bill() {
  const { bills } = useApi();

  const { useBillColumns, state } = bills;
  const { load } = useLoader();

  const columns = useBillColumns(bills);

  const filters = [
    { label: 'Latest', action: (f) => bills.filters.latest(f) },
    { label: 'Oldest', action: (f) => bills.filters.oldest(f) },
    { label: 'Highest Amount', action: (f) => bills.filters.descending('total', f) },
    { label: 'Lowest Amount', action: (f) => bills.filters.ascending('total', f) },
  ];

  const customConfigs = [
    {
      title: 'Status',
      filters: [
        { label: 'Paid', action: () => bills.filters.filterByField('status', 'PAID') },
        { label: 'Unpaid', action: () => bills.filters.filterByField('status', 'UNPAID') },
        { label: 'Cancelled', action: () => bills.filters.filterByField('status', 'CANCELLED') },
      ],
    },
  ];

  useEffect(() => {
    load(bills);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'code'}
      manualPagination={true}
      reset={bills.reset}
      loading={bills.loading.getAll}
      page={bills.pagination.page}
      limit={bills.pagination.limit}
      pageCount={bills.pagination.pages}
      totalRows={bills.pagination.total}
      filters={filters}
      customs={customConfigs}
      onPaginationChange={(p) => paginator(bills, p)}
      onSortChange={(p) => sorter(bills, p)}
    />
  );
}