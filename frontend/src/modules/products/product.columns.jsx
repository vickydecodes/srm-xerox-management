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

export const useProductColumns = (products) => {
  return [
    {
      accessorKey: 'code',
      header: () => Hint('Code', 'Auto-generated product code'),
      cell: ({ row }) => <span>{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Product name'),
      cell: ({ row }) => <span>{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'description',
      header: () => Hint('Description', 'Product description'),
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.getValue('description') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'variants',
      header: () => Hint('Variants', 'Available variant groups'),
      cell: ({ row }) => {
        const variants = row.getValue('variants') || {};
        const keys = Object.keys(variants);
        if (!keys.length) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {keys.map((k) => (
              <Badge key={k} variant="secondary">{k}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'active',
      header: () => Hint('Status', 'Whether the product is active'),
      cell: ({ row }) => (
        <Badge variant={row.getValue('active') ? 'default' : 'outline'}>
          {row.getValue('active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'More actions'),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => products.openEdit(product)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => products.openDelete(product.id, product.name)}
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