import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function DepartmentAdmin() {
  const { departmentAdmins } = useApi();

  const { useDepartmentAdminColumns, state } = departmentAdmins;
  const { load } = useLoader();

  const columns = useDepartmentAdminColumns(departmentAdmins);

  useEffect(() => {
    load(departmentAdmins);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Department Admin', () => departmentAdmins.openCreate(), true)}
      manualPagination={true}
      reset={departmentAdmins.reset}
      loading={departmentAdmins.loading.getAll}
      limit={departmentAdmins.pagination.limit}
      pageCount={departmentAdmins.pagination.pages}
      totalRows={departmentAdmins.pagination.total}
      onPaginationChange={(p) => paginator(departmentAdmins, p)}
      onSortChange={(p) => sorter(departmentAdmins, p)}
    />
  );
}