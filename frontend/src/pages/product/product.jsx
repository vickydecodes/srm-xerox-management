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
    { label: 'Latest', action: products.filters.latest },
    { label: 'Oldest', action: products.filters.oldest },
    { label: 'A - Z', action: () => products.filters.ascending('name') },
    { label: 'Z - A', action: () => products.filters.descending('name') },
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
      onPaginationChange={(p) => paginator(products, p)}
      onSortChange={(p) => sorter(products, p)}
    />)
}