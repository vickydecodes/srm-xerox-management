import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";


export default function BranchAdmin() {
  const { branchAdmins } = useApi();

  const { useBranchAdminColumns, state } = branchAdmins;
  const { load } = useLoader();

  const columns = useBranchAdminColumns(branchAdmins);

  const filters = [
    { label: 'Active', action: () => branchAdmins.filters.filterByStatus?.(true) },
    { label: 'Inactive', action: () => branchAdmins.filters.filterByStatus?.(false) },
  ];

  useEffect(() => {
    load(branchAdmins);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Branch Admin', () => branchAdmins.openCreate(), true)}
      manualPagination={true}
      reset={branchAdmins.reset}
      loading={branchAdmins.loading.getAll}
      limit={branchAdmins.pagination.limit}
      pageCount={branchAdmins.pagination.pages}
      totalRows={branchAdmins.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(branchAdmins, p)}
      onSortChange={(p) => sorter(branchAdmins, p)}
    />
  );
}