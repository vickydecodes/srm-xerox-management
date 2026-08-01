import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Hint } from "@/core/utils/tooltip.util";
import formatDate from "@/core/utils/formatdate.util";

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
      accessorKey: 'status',
      header: () => Hint('Status', 'Payment status'),
      cell: ({ row }) => {
        const status = row.getValue('status');
        return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => Hint('Date', 'Bill creation date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate ? formatDate(row.getValue('createdAt')) : row.getValue('createdAt')}
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'View or delete this bill'),
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => bills.openDelete(bill.id, bill.code)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};