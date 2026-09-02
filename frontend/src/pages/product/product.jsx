import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function Product() {
  const { products } = useApi();

  const { useProductColumns, state } = products;
  const {load} = useLoader();


  console.log(state)

  const columns = useProductColumns(products);

  const filters = [
    { label: 'Latest', action: (f) => products.filters.latest(f) },
    { label: 'Oldest', action: (f) => products.filters.oldest(f) },
    { label: 'A - Z', action: (f) => products.filters.ascending('name', f) },
    { label: 'Z - A', action: (f) => products.filters.descending('name', f) },
  ];

  const customConfigs = [
    {
      title: 'Status',
      filters: [
        { label: 'Active', action: () => products.filters.filterByField('active', true) },
        { label: 'Inactive', action: () => products.filters.filterByField('active', false) },
      ],
    },
  ];

  useEffect(() => {
    load(products)
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Product', () => products.openCreate(), true)}
      manualPagination={true}
      reset={products.reset}
      loading={products.loading.getAll}
      page={products.pagination.page}
      limit={products.pagination.limit}
      pageCount={products.pagination.pages}
      totalRows={products.pagination.total}
      filters={filters}
      customs={customConfigs}
      onPaginationChange={(p) => paginator(products, p)}
      onSortChange={(p) => sorter(products, p)}
    />)
}