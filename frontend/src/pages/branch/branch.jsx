import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import { useEffect } from "react";

export default function Branch() {
  const { branches } = useApi();

  const { useBranchColumns, state, load } = branches;

  const columns = useBranchColumns(branches);

  const filters = [
    { label: 'Active', action: () => {} },
    { label: 'Inactive', action: () => {} },
  ];

  useEffect(() => {
    load();
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Branch', () => branches.openCreate(), true)}
      manualPagination={true}
      loading={branches.loading.getAll}
      limit={branches.pagination.limit}
      pageCount={branches.pagination.pages}
      totalRows={branches.pagination.total}
      filters={filters}
    />
  );
}