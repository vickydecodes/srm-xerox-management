import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Service() {
  const { services } = useApi();

  const { useServiceColumns, state } = services;
  const { load } = useLoader();

  const columns = useServiceColumns(services);

  const filters = [
    { label: 'Latest', action: services.filters.latest },
    { label: 'Oldest', action: services.filters.oldest },
    { label: 'A - Z', action: () => services.filters.ascending('name') },
    { label: 'Z - A', action: () => services.filters.descending('name') },
  ];

  useEffect(() => {
    load(services);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Service', () => services.openCreate(), true)}
      manualPagination={true}
      reset={services.reset}
      loading={services.loading.getAll}
      page={services.pagination.page}
      limit={services.pagination.limit}
      pageCount={services.pagination.pages}
      totalRows={services.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(services, p)}
      onSortChange={(p) => sorter(services, p)}
    />
  );
}