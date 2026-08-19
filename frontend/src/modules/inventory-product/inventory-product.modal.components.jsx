import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useLoader } from "@/core/hooks/useLoader";
import { inventoryProductSchema } from "./inventory-product.schema";
import { InventoryProductForm } from "./inventory-product.form";
import { Button } from "@/components/ui/button";

const findMatchingVariantId = (product, selectedAttributes) => {
  if (!product || !product.variants || !selectedAttributes) return null;
  const match = product.variants.find((v) => {
    const vAttrs = v.attributes || {};
    const vEntries = typeof vAttrs.entries === 'function' 
      ? [...vAttrs.entries()] 
      : Object.entries(vAttrs);
    if (vEntries.length === 0) return false;
    return vEntries.every(([k, val]) => String(selectedAttributes[k]) === String(val));
  });
  return match ? match._id : null;
};

export const Create = ({ exported, submitFn, closeModal }) => {
  const { createPreset } = useLoader();
  const preset = createPreset(exported.products);

  useEffect(() => {
    preset();
  }, []);

  const products = exported.products.state;

  const form = useForm({
    resolver: zodResolver(inventoryProductSchema),
    defaultValues: {
      product: "",
      variant: {},
      quantity: 1,
      price: 0,
      active: true,
    },
    mode: "onSubmit",
  });

  const { run, loading, ErrorAlert, clearError } = useAsync((data) => submitFn(data));

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    transform: (data) => {
      const selectedProduct = products.find(p => String(p._id) === String(data.product));
      const variantId = findMatchingVariantId(selectedProduct, data.variant);
      return {
        ...data,
        variant: variantId,
      };
    },
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>Add Product to Inventory</DialogTitle>
        <DialogDescription>
          Select a product, pick a variant combination, and set the price & quantity
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <InventoryProductForm form={form} products={products} />
          {ErrorAlert}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Adding product...">
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Edit = ({ inventoryProduct, exported, submitFn = () => {}, closeModal = () => {} } = {}) => {
  const { createPreset } = useLoader();
  const preset = createPreset(exported.products);

  console.log(inventoryProduct)

  useEffect(() => {
    preset();
  }, []);

  const products = exported.products.state;

  const form = useForm({
    resolver: zodResolver(inventoryProductSchema),
    defaultValues: {
      product: inventoryProduct?.product?._id ?? inventoryProduct?.product ?? "",
      variant: inventoryProduct?.variant ?? {},
      quantity: inventoryProduct?.quantity ?? 0,
      price: inventoryProduct?.price ?? 0,
      active: inventoryProduct?.active ?? true,
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    transform: (data) => {
      const selectedProduct = products.find(p => String(p._id) === String(data.product));
      const variantId = findMatchingVariantId(selectedProduct, data.variant);
      return {
        ...data,
        variant: variantId,
      };
    },
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>Edit Inventory Product</DialogTitle>
        <DialogDescription>
          Update details of {inventoryProduct?.product?.name || "this item"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <InventoryProductForm form={form} products={products} isEdit />
          {ErrorAlert}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving..">
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Delete = ({ id, name, closeModal = () => {}, onConfirm = () => {} }) => (
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Are you sure you want to delete {name}?</DialogTitle>
      <DialogDescription>
        This will be stored as deleted, this inventory product record can be retrieved by Admin.
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
        <strong>Note:</strong> This operation is Permenent Delete. All the data related to this
        inventory product will be lost.
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
        variant="success"
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
        <strong>Note:</strong> this operation is retrieve All the data related to this inventory
        product will be back.
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
        Retrieve
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const ActiveStatus = ({ id, status, submitFn, closeModal, loading = false }) => {
  const actionLabel = status ? "Deactivate" : "Activate";

  const onConfirm = async () => {
    await submitFn(id, {
      active: !status,
    });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} Inventory Product</DialogTitle>

        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> the inventory product.
              <br />
              It will no longer be available for billing.
            </>
          ) : (
            <>
              This will <strong>activate</strong> the inventory product.
              <br />
              It will become available for billing again.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={loading}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant={status ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
        >
          {loading ? "Updating..." : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};