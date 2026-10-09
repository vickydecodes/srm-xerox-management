import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/core/contexts/api.context";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LowStockAlert({ inventoryPath }) {
  const { inventoryProducts } = useApi();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!inventoryProducts?.crud?.getAll) return undefined;

    inventoryProducts.crud
      .getAll(
        { full: "true" },
        { __options: { skipStore: true, toast: false } },
      )
      .then((result) => {
        if (!mounted) return;
        const inventory = Array.isArray(result) ? result : result?.data || [];
        setProducts(
          inventory.filter(
            (product) => product.active !== false && Number(product.quantity) < 100,
          ),
        );
      })
      .catch((requestError) => {
        if (mounted) {
          setError(requestError?.message || "Unable to load inventory stock levels.");
        }
      });

    return () => {
      mounted = false;
    };
    // The API module object is rebuilt by ApiProvider on store updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col rounded-lg border border-destructive/30 bg-card shadow-sm">
        <div className="flex items-center gap-3 p-5">
          <IconAlertTriangle className="size-5 shrink-0 text-destructive" />
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Inventory stock alert unavailable
            </h2>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="low-stock-title"
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <IconAlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h2
              id="low-stock-title"
              className="text-sm font-medium text-foreground"
            >
              Low inventory stock
            </h2>
            <p className="text-xs text-muted-foreground">
              {products.length} {products.length === 1 ? "product is" : "products are"} below 100 units.
            </p>
          </div>
        </div>
      </header>

      <div className="max-h-72 w-full min-w-0 overflow-auto">
        <Table className="w-full text-left text-sm">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-5 py-3 text-xs text-muted-foreground">Product</TableHead>
              <TableHead className="w-36 px-5 py-3 text-xs text-muted-foreground">Stock remaining</TableHead>
              <TableHead className="w-36 px-5 py-3 text-right text-xs text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {products.map((product) => {
            const name =
              typeof product.product === "object"
                ? product.product?.name
                : product.product;

            return (
              <TableRow key={product._id} className="hover:bg-muted/30">
                <TableCell className="px-5 py-3 font-medium">
                  {name || "Inventory product"}
                </TableCell>
                <TableCell className="px-5 py-3 tabular-nums">
                  <span className="inline-flex min-w-12 justify-center rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {product.quantity}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(inventoryPath, {
                        state: { editInventoryProduct: product },
                      })
                    }
                  >
                    Edit product
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
