import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import { useEffect } from "react";

export default function Department() {
  const { departments } = useApi();

  const { useDepartmentColumns, state, load } = departments;

  const columns = useDepartmentColumns(departments);

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
      create={createbtn('Create Department', () => departments.openCreate(), true)}
      manualPagination={true}
      loading={departments.loading.getAll}
      limit={departments.pagination.limit}
      pageCount={departments.pagination.pages}
      totalRows={departments.pagination.total}
      filters={filters}
    />
  )
}