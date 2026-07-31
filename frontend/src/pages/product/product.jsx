import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { createbtn } from "@/core/utils/datatable.helper.util";
import { useEffect } from "react";

export default function Product() {
  const { products } = useApi();

  const { useProductColumns, state, load } = products;

  const columns = useProductColumns(products);

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
      create={createbtn('Create Product', () => products.openCreate(), true)}
      manualPagination={true}
      loading={products.loading.getAll}
      limit={products.pagination.limit}
      pageCount={products.pagination.pages}
      totalRows={products.pagination.total}
      filters={filters}
    />
  );
}