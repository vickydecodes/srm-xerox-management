import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Department() {
  const { departments } = useApi();

  const { useDepartmentColumns, state } = departments;
  const { load } = useLoader();

  const columns = useDepartmentColumns(departments);

  const filters = [
    { label: 'Latest', action: departments.filters.latest },
    { label: 'Oldest', action: departments.filters.oldest },
    { label: 'A - Z', action: () => departments.filters.ascending('name') },
    { label: 'Z - A', action: () => departments.filters.descending('name') },
  ];

  useEffect(() => {
    load(departments);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Department', () => departments.openCreate(), true)}
      manualPagination={true}
      reset={departments.reset}
      loading={departments.loading.getAll}
      page={departments.pagination.page}
      limit={departments.pagination.limit}
      pageCount={departments.pagination.pages}
      totalRows={departments.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(departments, p)}
      onSortChange={(p) => sorter(departments, p)}
    />
  );
}