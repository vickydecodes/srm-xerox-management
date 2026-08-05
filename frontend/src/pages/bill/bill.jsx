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
    { label: 'Latest', action: bills.filters.latest },
    { label: 'Oldest', action: bills.filters.oldest },
    { label: 'A - Z', action: () => bills.filters.ascending('name') },
    { label: 'Z - A', action: () => bills.filters.descending('name') },
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
      onPaginationChange={(p) => paginator(bills, p)}
      onSortChange={(p) => sorter(bills, p)}
    />
  );
}