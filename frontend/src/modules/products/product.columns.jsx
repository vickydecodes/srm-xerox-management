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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export const useProductColumns = (products) => {
  return [
    {
      accessorKey: "code",
      header: () => Hint("Code", "Auto-generated product code"),
      cell: ({ row }) => <span>{row.getValue("code")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Product name"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
{
  accessorKey: "variants",
  header: () => Hint("Variants", "Available product variants"),
  cell: ({ row }) => {
    const variants = row.original.variants || {};
    const entries = Object.entries(variants);

    if (entries.length === 0) {
      return (
        <Badge variant="outline">
          No Variants
        </Badge>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {entries.length} Variant{entries.length > 1 ? "s" : ""}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 space-y-4">
          <div>
            <h4 className="font-medium">Product Variants</h4>
            <p className="text-sm text-muted-foreground">
              Available options for this product.
            </p>
          </div>

          <div className="space-y-3">
            {entries.map(([key, values]) => (
              <div key={key}>
                <p className="text-sm font-medium capitalize mb-2">
                  {key}
                </p>

                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
},
    {
      accessorKey: "active",
      header: () => Hint("Status", "Whether the product is active"),
      cell: ({ row }) => (
        <Badge variant={row.getValue("active") ? "default" : "outline"}>
          {row.getValue("active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "More actions"),
      cell: ({ row }) => {
        const product = row.original;
        // Adjust this condition to match your API field
        const isDeleted =
          product.deleted === true ||
          product.isDeleted === true ||
          !!product.deletedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* Always visible */}
              <DropdownMenuItem onClick={() => products.openView(product)}>
                View
              </DropdownMenuItem>

              {/* Only when NOT deleted */}
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => products.openEdit(product)}>
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => products.openActiveStatus(product)}
                  >
                    Active Status
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      products.openDelete(product._id, product.name)
                    }
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {/* Only when soft-deleted */}
              {isDeleted && (
                <DropdownMenuItem
                  onClick={() => products.openRetrieve(product._id)}
                >
                  Retrieve
                </DropdownMenuItem>
              )}

              {/* Permanent delete – available in both states */}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => products.openErase(product._id)}
              >
                Erase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};