import DataTable from "@/components/ui/datatable";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { createbtn } from "@/core/utils/datatable.helper.util";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";

export default function ShopAdmin() {
  const { shopAdmins } = useApi();

  const { useShopAdminColumns, state } = shopAdmins;
  const { load } = useLoader();

  const columns = useShopAdminColumns(shopAdmins);

  useEffect(() => {
    load(shopAdmins);
  }, []);

  return (
    <DataTable
      data={state}
      columns={columns}
      searchKey={'name'}
      create={createbtn('Create Shop Admin', () => shopAdmins.openCreate(), true)}
      manualPagination={true}
      reset={shopAdmins.reset}
      loading={shopAdmins.loading.getAll}
      limit={shopAdmins.pagination.limit}
      pageCount={shopAdmins.pagination.pages}
      totalRows={shopAdmins.pagination.total}
      onPaginationChange={(p) => paginator(shopAdmins, p)}
      onSortChange={(p) => sorter(shopAdmins, p)}
    />
  );
}