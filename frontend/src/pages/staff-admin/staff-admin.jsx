import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Staff() {
  const { staffs } = useApi();

  const { useStaffColumns, state } = staffs;
  const { load } = useLoader();

  const columns = useStaffColumns(staffs);

  useEffect(() => {
    load(staffs);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Staff', () => staffs.openCreate(), true)}
      manualPagination={true}
      reset={staffs.reset}
      loading={staffs.loading.getAll}
      limit={staffs.pagination.limit}
      pageCount={staffs.pagination.pages}
      totalRows={staffs.pagination.total}
      onPaginationChange={(p) => paginator(staffs, p)}
      onSortChange={(p) => sorter(staffs, p)}
    />
  );
}