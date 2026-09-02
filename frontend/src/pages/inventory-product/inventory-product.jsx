import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconInfoCircle } from "@tabler/icons-react";

export default function InventoryProduct() {
  const { inventoryProducts } = useApi();

  const { useInventoryProductColumns, state } = inventoryProducts;
  const { load } = useLoader();

  const columns = useInventoryProductColumns(inventoryProducts);

  const filters = [
    { label: 'Latest', action: (f) => inventoryProducts.filters.latest(f) },
    { label: 'Oldest', action: (f) => inventoryProducts.filters.oldest(f) },
    { label: 'Price: Low - High', action: (f) => inventoryProducts.filters.ascending('price', f) },
    { label: 'Price: High - Low', action: (f) => inventoryProducts.filters.descending('price', f) },
    { label: 'Quantity: Low - High', action: (f) => inventoryProducts.filters.ascending('quantity', f) },
    { label: 'Quantity: High - Low', action: (f) => inventoryProducts.filters.descending('quantity', f) },
  ];

  const customConfigs = [
    {
      title: 'Status',
      filters: [
        { label: 'Active', action: () => inventoryProducts.filters.filterByField('active', true) },
        { label: 'Inactive', action: () => inventoryProducts.filters.filterByField('active', false) },
      ],
    },
  ];

  useEffect(() => {
    load(inventoryProducts);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Alert className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-950/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200">
        <IconInfoCircle className="h-4 w-4 text-indigo-500" />
        <AlertTitle className="text-indigo-800 dark:text-indigo-300 font-semibold">Inventory System Notice</AlertTitle>
        <AlertDescription className="text-indigo-600 dark:text-indigo-400">
          Only one primary inventory is allowed in this system. All product variations created below will automatically map to this central default inventory.
        </AlertDescription>
      </Alert>

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
        customs={customConfigs}
        onPaginationChange={(p) => paginator(inventoryProducts, p)}
        onSortChange={(p) => sorter(inventoryProducts, p)}
      />
    </div>
  );
}