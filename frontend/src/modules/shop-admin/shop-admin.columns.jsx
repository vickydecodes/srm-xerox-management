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

export const useShopAdminColumns = (shopAdmins) => {
  return [
    {
      accessorKey: 'login_id',
      header: () => Hint('Login ID', 'Auto-generated login ID'),
      cell: ({ row }) => <span>{row.getValue('login_id')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Shop admin name'),
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
      header: () => Hint('Actions', 'Manage this shop admin'),
      cell: ({ row }) => {
        const admin = row.original;
        const isDeleted = Boolean(admin?.deleted || admin?.deletedAt);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => shopAdmins.openView(admin)}>
                View
              </DropdownMenuItem>

              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => shopAdmins.openEdit(admin)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => shopAdmins.openResetPassword(admin)}
                  >
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => shopAdmins.openActiveStatus(admin._id, admin.active)}
                  >
                    {admin.active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {isDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => shopAdmins.openRetrieve(admin._id)}>
                    Retrieve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => shopAdmins.openErase(admin._id)}
                  >
                    Erase Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => shopAdmins.openDelete(admin)}
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