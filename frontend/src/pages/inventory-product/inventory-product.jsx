import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function InventoryProduct() {
  const { inventoryProducts } = useApi();

  const { useInventoryProductColumns, state } = inventoryProducts;
  const { load } = useLoader();

  const columns = useInventoryProductColumns(inventoryProducts);

  const filters = [
    { label: 'Latest', action: inventoryProducts.filters.latest },
    { label: 'Oldest', action: inventoryProducts.filters.oldest },
    { label: 'Price: Low - High', action: () => inventoryProducts.filters.ascending('price') },
    { label: 'Price: High - Low', action: () => inventoryProducts.filters.descending('price') },
    { label: 'Quantity: Low - High', action: () => inventoryProducts.filters.ascending('quantity') },
    { label: 'Quantity: High - Low', action: () => inventoryProducts.filters.descending('quantity') },
  ];

  useEffect(() => {
    load(inventoryProducts);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'product'}
      create={createbtn('Create Inventory Product', () => inventoryProducts.openCreate(), true)}
      manualPagination={true}
      reset={inventoryProducts.reset}
      loading={inventoryProducts.loading.getAll}
      page={inventoryProducts.pagination.page}
      limit={inventoryProducts.pagination.limit}
      pageCount={inventoryProducts.pagination.pages}
      totalRows={inventoryProducts.pagination.total}
      filters={filters}
      onPaginationChange={(p) => paginator(inventoryProducts, p)}
      onSortChange={(p) => sorter(inventoryProducts, p)}
    />
  );
}