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

export const useBranchColumns = (branches) => {
  return [
    {
      accessorKey: 'code',
      header: () => Hint('Code', 'Branch code'),
      cell: ({ row }) => <span>{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Branch name'),
      cell: ({ row }) => <span>{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'active',
      header: () => Hint('Status', 'Whether the branch is active'),
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
        const branch = row.original;
        const isErased = Boolean(branch.deletedAt);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => branches.openEdit(branch)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => branches.openActiveStatus(branch._id, branch.active)}
              >
                {branch.active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isErased ? (
                <DropdownMenuItem onClick={() => branches.openRetrieve(branch._id)}>
                  Retrieve
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => branches.openDelete(branch._id, branch.name)}
                  >
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => branches.openErase(branch._id)}
                  >
                    Erase Permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};