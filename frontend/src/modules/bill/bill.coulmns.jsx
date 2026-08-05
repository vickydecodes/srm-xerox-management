import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal } from "lucide-react";
import { Hint } from "@/core/utils/tooltip.util";

const statusVariant = {
  UNPAID: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
};

export const useBillColumns = (bills) => {
  return [
    {
      accessorKey: 'code',
      header: () => Hint('Code', 'Auto-generated bill code'),
      cell: ({ row }) => <span>{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'items',
      header: () => Hint('Items', 'Number of items in this bill'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {(row.getValue('items') || []).length} item(s)
        </span>
      ),
    },
    {
      accessorKey: 'total',
      header: () => Hint('Total', 'Final billed amount'),
      cell: ({ row }) => <span>{Number(row.getValue('total') || 0).toFixed(2)}</span>,
    },
    {
      accessorKey: 'paymentMethod',
      header: () => Hint('Payment Method', 'How this bill was settled'),
      cell: ({ row }) => {
        const paymentMethod = row.getValue('paymentMethod');
        const bill = row.original;
        
        if (paymentMethod === 'CREDIT') {
          const branchName = typeof bill.branch === 'object' ? bill.branch?.name : 'N/A';
          const branchCode = typeof bill.branch === 'object' ? bill.branch?.code : 'N/A';
          const deptName = typeof bill.department === 'object' ? bill.department?.name : 'N/A';
          const deptCode = typeof bill.department === 'object' ? bill.department?.code : 'N/A';
          
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 border-dashed border-primary/50 hover:border-primary">
                  CREDIT
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold leading-none text-primary">Credit Details</h4>
                    <p className="text-xs text-muted-foreground">
                      Associated branch and department information
                    </p>
                  </div>
                  <div className="grid gap-2 border-t pt-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <span className="text-xs font-medium text-muted-foreground">Branch</span>
                      <span className="col-span-2 text-xs font-semibold">{branchName} ({branchCode})</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <span className="text-xs font-medium text-muted-foreground">Department</span>
                      <span className="col-span-2 text-xs font-semibold">{deptName} ({deptCode})</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        }
        
        return <Badge variant="secondary">{paymentMethod}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: () => Hint('Status', 'Payment status'),
      cell: ({ row }) => {
        const status = row.getValue('status');
        return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>;
      },
    },

    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'View or manage this bill'),
      cell: ({ row }) => {
        const bill = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => bills.openView(bill)}>
                View
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => bills.openEdit(bill)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => bills.togglePaymentStatus(bill)}>
                Mark as {bill.status === 'PAID' ? 'Unpaid' : 'Paid'}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => bills.openActiveStatus(bill._id, bill.active)}
              >
                {bill.active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />


              <DropdownMenuItem onClick={() => bills.openRetrieve(bill._id)}>
                Retrieve
              </DropdownMenuItem>


              <DropdownMenuItem
                variant="destructive"
                onClick={() => bills.openDelete(bill._id, bill.code)}
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => bills.openErase(bill._id)}
              >
                Erase Permanently
              </DropdownMenuItem>


            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};