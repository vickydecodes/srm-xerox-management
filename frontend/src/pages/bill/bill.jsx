import DataTable from "@/components/ui/datatable";
import { Button } from "@/components/ui/button";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useUI } from "@/core/contexts/ui.context";
import { DepartmentReportModal } from "@/modules/department/department-report.modal";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import paginator from "@/core/utils/paginate.util";
import sorter from "@/core/utils/sorter.util";
import { useEffect } from "react";
import { useAuth } from "@/core/contexts/auth.context";

export default function Bill() {
  const { bills } = useApi();
  const { user } = useAuth();
  const { openModal } = useUI();
  const isSuperOrShop = user?.role === 'super_admin' || user?.role === 'shop_admin' || user?.role === 'staff';
  const isDeptAdmin = user?.role === 'department_admin';
  const deptId = typeof user?.department === 'object' ? user.department?._id || user.department?.id : user?.department;

  const handleOpenReport = () => {
    if (deptId) {
      openModal(DepartmentReportModal, { departmentId: deptId, department: user?.department });
    } else {
      toast.error('No department assigned to your account');
    }
  };

  const { useBillColumns, state } = bills;
  const { load } = useLoader();

  const columns = useBillColumns(bills);

  const filters = [
    { label: 'Latest', action: (f) => bills.filters.latest(f) },
    { label: 'Oldest', action: (f) => bills.filters.oldest(f) },
    { label: 'Highest Amount', action: (f) => bills.filters.descending('total', f) },
    { label: 'Lowest Amount', action: (f) => bills.filters.ascending('total', f) },
  ];

  const customConfigs = [
    {
      title: 'Status',
      filters: [
        { label: 'Paid', action: () => bills.filters.filterByField('status', 'PAID') },
        { label: 'Unpaid', action: () => bills.filters.filterByField('status', 'UNPAID') },
        { label: 'Cancelled', action: () => bills.filters.filterByField('status', 'CANCELLED') },
      ],
    },
    ...(isSuperOrShop
      ? [
          {
            title: 'Payment Method',
            filters: [
              { label: 'Cash', action: () => bills.filters.filterByField('paymentMethod', 'CASH') },
              { label: 'UPI', action: () => bills.filters.filterByField('paymentMethod', 'UPI') },
              { label: 'Credit', action: () => bills.filters.filterByField('paymentMethod', 'CREDIT') },
            ],
          },
        ]
      : []),
  ];

  useEffect(() => {
    load(bills);
  }, []);

  return (
    <div className="space-y-4">
      {isDeptAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card border border-border/60 rounded-lg shadow-2xs">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Department Bills & Expenditure
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and audit your department invoices, item counts, and counter spend.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenReport}
            className="flex items-center gap-2 text-xs font-semibold h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <FileText className="size-3.5" />
            Generate Report
          </Button>
        </div>
      )}

      <DataTable
        data={state}
        columns={columns}
        searchKey={'code'}
        manualPagination={true}
        reset={bills.reset}
        loading={bills.loading.getAll}
        page={bills.pagination.page}
        limit={bills.pagination.limit}
        pageCount={bills.pagination.pages}
        totalRows={bills.pagination.total}
        filters={filters}
        customs={customConfigs}
        create={
          isDeptAdmin
            ? {
                provision: true,
                permission: true,
                label: 'Generate Report',
                action: handleOpenReport,
              }
            : undefined
        }
        onPaginationChange={(p) => paginator(bills, p)}
        onSortChange={(p) => sorter(bills, p)}
      />
    </div>
  );
}