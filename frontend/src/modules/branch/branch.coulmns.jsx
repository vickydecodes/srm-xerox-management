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
import formatdate from "@/core/utils/formatdate.util";

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
      accessorKey: 'createdAt',
      header: () => Hint('Created', 'Branch creation date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatdate(row.getValue('createdAt'))}</span>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'More actions'),
      cell: ({ row }) => {
        const branch = row.original;
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => branches.openDelete(branch.id, branch.name)}
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