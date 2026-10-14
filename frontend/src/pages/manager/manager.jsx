import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Manager() {
  const { managers } = useApi();

  const { useManagerColumns, state } = managers;
  const { load } = useLoader();

  const columns = useManagerColumns(managers);

  const filters = [
    { label: 'Active', action: () => managers.filters.filterByStatus?.(true) },
    { label: 'Inactive', action: () => managers.filters.filterByStatus?.(false) },
  ];

  useEffect(() => {
    load(managers);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Manager', () => managers.openCreate(), true)}
      manualPagination={true}
      reset={managers.reset}
      loading={managers.loading.getAll}
      limit={managers.pagination.limit}
      pageCount={managers.pagination.pages}
      totalRows={managers.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(managers, p)}
      onSortChange={(p) => sorter(managers, p)}
    />
  );
}
