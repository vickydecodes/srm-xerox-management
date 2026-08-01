import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Branch() {
  const { branches } = useApi();

  const { useBranchColumns, state } = branches;
  const { load } = useLoader();

  const columns = useBranchColumns(branches);

  const filters = [
    { label: 'Latest', action: branches.filters.latest },
    { label: 'Oldest', action: branches.filters.oldest },
    { label: 'A - Z', action: () => branches.filters.ascending('name') },
    { label: 'Z - A', action: () => branches.filters.descending('name') },
  ];

  useEffect(() => {
    load(branches);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Branch', () => branches.openCreate(), true)}
      manualPagination={true}
      reset={branches.reset}
      loading={branches.loading.getAll}
      limit={branches.pagination.limit}
      pageCount={branches.pagination.pages}
      totalRows={branches.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(branches, p)}
      onSortChange={(p) => sorter(branches, p)}
    />
  );
}