import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useEffect } from "react";

export default function Bill() {
  const { bills } = useApi();

  const { useBillColumns, state, load } = bills;

  const columns = useBillColumns(bills);

  const filters = [
    { label: 'Unpaid', action: () => {} },
    { label: 'Paid', action: () => {} },
    { label: 'Cancelled', action: () => {} },
  ];

  useEffect(() => {
    load();
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'code'}
      manualPagination={true}
      loading={bills.loading.getAll}
      limit={bills.pagination.limit}
      pageCount={bills.pagination.pages}
      totalRows={bills.pagination.total}
      filters={filters}
    />
  );
}