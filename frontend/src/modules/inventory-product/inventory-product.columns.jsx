import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Hint } from "@/core/utils/tooltip.util"

export const useInventoryProductColumns = (inventoryProducts) => {
  return [
    {
      accessorKey: 'product',
      header: () => Hint('Product', 'The linked product'),
      cell: ({ row }) => {
        const product = row.getValue('product');
        return <span>{product?.name || product}</span>;
      },
    },

    {
      accessorKey: 'quantity',
      header: () => Hint('Quantity', 'Stock quantity available'),
      cell: ({ row }) => <span>{row.getValue('quantity')}</span>,
    },
    {
      accessorKey: 'price',
      header: () => Hint('Price', 'Price per unit'),
      cell: ({ row }) => <span>{Number(row.getValue('price') || 0).toFixed(2)}</span>,
    },
    {
      accessorKey: 'active',
      header: () => Hint('Active', 'Whether this inventory product is active'),
      cell: ({ row }) => (
        <Badge variant={row.getValue('active') ? 'default' : 'outline'}>
          {row.getValue('active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'Edit or manage this inventory product'),
      cell: ({ row }) => {
        const inventoryProduct = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => inventoryProducts.openEdit(inventoryProduct)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  inventoryProducts.openActiveStatus(inventoryProduct._id, inventoryProduct.active)
                }
              >
                {inventoryProduct.active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => inventoryProducts.openDelete(inventoryProduct)}
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => inventoryProducts.openErase(inventoryProduct._id)}
              >
                Erase Permanently
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => inventoryProducts.openRetrieve(inventoryProduct._id)}>
                Retrieve
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}