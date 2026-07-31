import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import { useEffect } from "react";

export default function Service() {
  const { services } = useApi();

  const { useServiceColumns, state, load } = services;

  const columns = useServiceColumns(services);

  const filters = [
    { label: 'filter 1', action: () => { } },
    { label: 'filter 2', action: () => { } }
  ]

  useEffect(() => {
    load()
  }, [])

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Service', () => services.openCreate(), true)}
      manualPagination={true}
      loading={services.loading.getAll}
      limit={services.pagination.limit}
      pageCount={services.pagination.pages}
      totalRows={services.pagination.total}
      filters={filters}
    />
  )
}