import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, productEditSchema } from "./product.schema";
import ProductForm from "./product.form";


const toVariantsMap = (variants = []) =>
  variants.reduce((acc, { key, values }) => {
    if (!key) return acc;
    acc[key] = values
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return acc;
  }, {});


const toVariantsArray = (variants = {}) =>
  Object.entries(variants).map(([key, values]) => ({
    key,
    values: Array.isArray(values) ? values.join(", ") : "",
  }));

export const View = ({ product } = {}) => {
  const variants = product?.variants || {};
  const variantEntries = Object.entries(variants);

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {product?.name || "Product"}
          <Badge variant={product?.active ? "default" : "secondary"}>
            {product?.active ? "Active" : "Inactive"}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Created on{" "}
          {product?.createdAt
            ? new Date(product.createdAt).toLocaleDateString()
            : "—"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        {/* Description */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Description
          </p>
          <p className="text-sm">
            {product?.description?.trim() || "No description provided."}
          </p>
        </div>

        <Separator />

        {/* Variants */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Variants</p>

          {variantEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variants defined.
            </p>
          ) : (
            <div className="grid gap-2">
              {variantEntries.map(([key, values]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 text-sm border-b pb-2 last:border-0"
                >
                  <span className="font-medium capitalize min-w-[80px]">
                    {key}
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(Array.isArray(values) ? values : [values]).map((v) => (
                      <Badge key={v} variant="outline">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export const Create = ({ submitFn = () => {}, closeModal = () => {} } = {}) => {
  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      variants: [],
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    transform: (data) => ({ ...data, variants: toVariantsMap(data.variants) }),
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>Create Product</DialogTitle>
        <DialogDescription>Enter details of the product</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ProductForm form={form} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the product.."
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Edit = ({
  product,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const form = useForm({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      variants: toVariantsArray(product?.variants),
      active: product?.active ?? true,
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    transform: (data) => ({ ...data, variants: toVariantsMap(data.variants) }),
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogDescription>Update details of {product?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ProductForm form={form} />


          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the product.."
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Delete = ({
  id,
  name,
  closeModal = () => {},
  onConfirm = () => {},
}) => (
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Are you sure you want to delete {name}?</DialogTitle>
      <DialogDescription>
        This will be stored as deleted, this product record can be retrieved by
        Admin.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        variant="destructive"
        onClick={() => {
          onConfirm(id);
          closeModal();
        }}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const Erase = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This operation is a permanent delete. All data
        related to this product will be lost.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="destructive"
      >
        Delete Permanently
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const Retrieve = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This will retrieve the product. All related data
        will be restored.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="default"
      >
        Retrieve
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const ActiveStatus = ({
  id,
  status,
  submitFn,
  closeModal,
  exported,
}) => {
  const actionLabel = status ? "Deactivate" : "Activate";
  const isDeactivating = Boolean(status);

  const onConfirm = async () => {
    await submitFn(id, {
      active: !status,
    });
    closeModal();
  };

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>{actionLabel} Product</DialogTitle>
        <DialogDescription>
          Confirm the status change for this product.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border p-4 my-2">
        {isDeactivating ? (
          <div className="space-y-1 text-sm">
            <p>
              This will <strong className="text-destructive">deactivate</strong>{" "}
              the product.
            </p>
            <p className="text-muted-foreground">
              It will no longer be available for use until it is activated
              again.
            </p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p>
              This will <strong className="text-primary">activate</strong> the
              product.
            </p>
            <p className="text-muted-foreground">
              The product will become available again.
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={exported?.loading?.edit}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant={isDeactivating ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
          loading={exported?.loading?.edit}
          loadingText="Updating..."
        >
          {actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
