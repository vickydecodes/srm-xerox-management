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
    { label: 'Latest', action: (f) => services.filters.latest(f) },
    { label: 'Oldest', action: (f) => services.filters.oldest(f) },
    { label: 'A - Z', action: (f) => services.filters.ascending('name', f) },
    { label: 'Z - A', action: (f) => services.filters.descending('name', f) },
  ];

  const customConfigs = [
    {
      title: 'Status',
      filters: [
        { label: 'Active', action: () => services.filters.filterByField('active', true) },
        { label: 'Inactive', action: () => services.filters.filterByField('active', false) },
      ],
    },
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
      customs={customConfigs}
      onPaginationChange={(p) => paginator(services, p)}
      onSortChange={(p) => sorter(services, p)}
    />
  );
}