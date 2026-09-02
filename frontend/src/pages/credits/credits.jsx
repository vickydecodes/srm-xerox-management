import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Credits() {
  const { credits } = useApi();

  const { useCreditColumns, state } = credits;
  const { load } = useLoader();

  const columns = useCreditColumns(credits);

  const filters = [
    { label: 'Latest', action: credits.filters.latest },
    { label: 'Oldest', action: credits.filters.oldest },
  ];

  useEffect(() => {
    load(credits);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'remarks'}
      create={createbtn('Create New Credit', () => credits.openCreate(), true)}
      manualPagination={true}
      reset={credits.reset}
      loading={credits.loading.getAll}
      page={credits.pagination.page}
      limit={credits.pagination.limit}
      pageCount={credits.pagination.pages}
      totalRows={credits.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(credits, p)}
      onSortChange={(p) => sorter(credits, p)}
    />
  );
}
