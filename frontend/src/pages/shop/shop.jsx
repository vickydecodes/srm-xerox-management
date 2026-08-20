import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Shop() {
  const { shops } = useApi();

  const { useShopColumns, state } = shops;
  const { load } = useLoader();

  const columns = useShopColumns(shops);

  const filters = [
    { label: "Latest", action: shops.filters.latest },
    { label: "Oldest", action: shops.filters.oldest },
    { label: "A - Z", action: () => shops.filters.ascending("name") },
    { label: "Z - A", action: () => shops.filters.descending("name") },
  ];

  useEffect(() => {
    load(shops);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={"name"}
      create={createbtn("Create Shop", () => shops.openCreate(), true)}
      manualPagination={true}
      reset={shops.reset}
      loading={shops.loading.getAll}
      page={shops.pagination.page}
      limit={shops.pagination.limit}
      pageCount={shops.pagination.pages}
      totalRows={shops.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(shops, p)}
      onSortChange={(p) => sorter(shops, p)}
    />
  );
}