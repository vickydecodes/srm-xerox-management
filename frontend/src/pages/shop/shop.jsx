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
    { label: "Latest", action: (f) => shops.filters.latest(f) },
    { label: "Oldest", action: (f) => shops.filters.oldest(f) },
    { label: "A - Z", action: (f) => shops.filters.ascending("name", f) },
    { label: "Z - A", action: (f) => shops.filters.descending("name", f) },
  ];

  const customConfigs = [
    {
      title: "Status",
      filters: [
        { label: "Active", action: () => shops.filters.filterByField("active", true) },
        { label: "Inactive", action: () => shops.filters.filterByField("active", false) },
      ],
    },
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
      customs={customConfigs}
      onPaginationChange={(p) => paginator(shops, p)}
      onSortChange={(p) => sorter(shops, p)}
    />
  );
}