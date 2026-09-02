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

export const useShopColumns = (shops) => {
  return [
    {
      accessorKey: "code",
      header: () => Hint("Code", "Shop code"),
      cell: ({ row }) => <span>{row.getValue("code")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Shop name"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "phone",
      header: () => Hint("Phone", "Contact number"),
      cell: ({ row }) => <span>{row.getValue("phone")}</span>,
    },
    {
      accessorKey: "email",
      header: () => Hint("Email", "Email address"),
      cell: ({ row }) => <span>{row.getValue("email") || "-"}</span>,
    },
    {
      accessorKey: "active",
      header: () => Hint("Status", "Whether the shop is active"),
      cell: ({ row }) => (
        <Badge variant={row.getValue("active") ? "default" : "outline"}>
          {row.getValue("active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => Hint("Created", "Shop creation date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "Edit or manage this shop"),
      cell: ({ row }) => {
        const shop = row.original;
        const isDeleted =
          shop.deleted === true || shop.isDeleted === true || !!shop.deletedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => shops.openView(shop)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shops.openEdit(shop)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => shops.openActiveStatus(shop._id, shop.active)}
              >
                {shop.active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => shops.openDelete(shop._id)}
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
