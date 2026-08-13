import { Badge } from "@/components/ui/badge";
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

export const useStaffColumns = (staffs) => {
  return [
    {
      accessorKey: 'login_id',
      header: () => Hint('Login ID', 'Auto-generated login ID'),
      cell: ({ row }) => <span>{row.getValue('login_id')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Staff name'),
      cell: ({ row }) => <span>{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'email',
      header: () => Hint('Email', 'Contact email'),
      cell: ({ row }) => <span>{row.getValue('email')}</span>,
    },
    {
      accessorKey: 'phone',
      header: () => Hint('Phone', 'Contact phone'),
      cell: ({ row }) => <span>{row.getValue('phone')}</span>,
    },
    {
      accessorKey: 'active',
      header: () => Hint('Status', 'Whether this account is active'),
      cell: ({ row }) => (
        <Badge variant={row.getValue('active') ? 'default' : 'outline'}>
          {row.getValue('active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'Manage this staff member'),
      cell: ({ row }) => {
        const staff = row.original;
        const isDeleted = Boolean(staff?.deleted || staff?.deletedAt);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => staffs.openView(staff)}>
                View
              </DropdownMenuItem>

              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => staffs.openEdit(staff)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => staffs.openActiveStatus(staff._id, staff.active)}
                  >
                    {staff.active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {isDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => staffs.openRetrieve(staff._id)}>
                    Retrieve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => staffs.openErase(staff._id)}
                  >
                    Erase Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => staffs.openDelete(staff)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}