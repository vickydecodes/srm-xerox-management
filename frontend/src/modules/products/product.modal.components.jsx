import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, productEditSchema } from "./product.schema";
import ProductForm from "./product.form";

// variants array (form shape) -> Map-like object (backend shape)
const toVariantsMap = (variants = []) =>
  variants.reduce((acc, { key, values }) => {
    if (!key) return acc;
    acc[key] = values
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return acc;
  }, {});

// Map-like object (backend shape) -> variants array (form shape)
const toVariantsArray = (variants = {}) =>
  Object.entries(variants).map(([key, values]) => ({
    key,
    values: Array.isArray(values) ? values.join(", ") : "",
  }));

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
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <ProductForm form={form} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the product..">
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Edit = ({ product, submitFn = () => {}, closeModal = () => {} } = {}) => {
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
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <ProductForm form={form} />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="mb-0">Active</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the product..">
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
        This will be stored as deleted, this product record can be retrieved by Admin.
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
        <strong>Note:</strong> This operation is Permenent Delete. All the data related to this branch
        will be lost.
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
        <strong>Note:</strong> this operation is retrieve All the data related to this branch will be
        back.
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
export const ActiveStatus = ({
  id, 
  status,
  submitFn,
  closeModal,
  exported, 
}) => {
  const actionLabel = status ? 'Deactivate' : 'Activate';

  const onConfirm = async () => {
    await submitFn(id, {
      active: !status,
    });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} Branch</DialogTitle>

        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> the Branch.
              <br />
              Students will no longer be able to Join this Branch.
            </>
          ) : (
            <>
              This will <strong>activate</strong> the Branch.
              <br />
              The Branch will become available again.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={exported?.loading?.edit}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant={status ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
        >
          {exported?.loading?.edit ? 'Updating...' : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};