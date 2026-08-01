import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Hint } from "@/core/utils/tooltip.util"

export const useServiceColumns = (services) => {
  return [
    {
      accessorKey: 'code',
      header: () => Hint('Code', 'Auto-generated service code'),
      cell: ({ row }) => <span>{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Name of the service'),
      cell: ({ row }) => <span>{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'unit',
      header: () => Hint('Unit', 'Unit of measurement for this service'),
      cell: ({ row }) => <span>{row.getValue('unit')}</span>,
    },
    {
      accessorKey: 'price',
      header: () => Hint('Price', 'Price of the service'),
      cell: ({ row }) => <span>{row.getValue('price')}</span>,
    },
    {
      accessorKey: 'active',
      header: () => Hint('Active', 'Whether this service is currently active'),
      cell: ({ row }) => <span>{row.getValue('active') ? 'Active' : 'Inactive'}</span>,
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'Edit or delete this service'),
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => services.openEdit(service)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => services.openDelete(service)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}