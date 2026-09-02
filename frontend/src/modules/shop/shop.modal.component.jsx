import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shopCreateSchema, shopEditSchema } from "./shop.schema";
import ShopForm from "./shop.form";

export const Create = ({
  submitFn = () => {},
  closeModal = () => {},
  data,
} = {}) => {
  const form = useForm({
    resolver: zodResolver(data ? shopEditSchema : shopCreateSchema),
    defaultValues: data
      ? {
          code: data.code || "",
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        }
      : {
          code: "",
          name: "",
          phone: "",
          email: "",
        },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);
  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>{data ? "Edit Shop" : "Create Shop"}</DialogTitle>
        <DialogDescription>Enter details of Shop</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ShopForm form={form} isEdit={!!data} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the shop.."
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
  submitFn = () => {},
  closeModal = () => {},
}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleDelete = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Are you sure? {name}</DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this shop record can be retrieved by
          Admin.
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button variant="destructive" loading={loading} onClick={handleDelete}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const Erase = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This operation is Permanent Delete. All the data
        related to this shop will be lost.
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
        <strong>Note:</strong> This operation will retrieve all the data related
        to this shop.
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
  loading = false,
}) => {
  const actionLabel = status ? "Deactivate" : "Activate";

  const onConfirm = async () => {
    await submitFn(id, { active: !status });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} Shop</DialogTitle>
        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> the Shop.
            </>
          ) : (
            <>
              This will <strong>activate</strong> the Shop.
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
        >
          {loading ? "Updating..." : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const View = ({ shop } = {}) => {
  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {shop?.name || "Shop"}
          {shop?.active !== undefined && (
            <Badge variant={shop.active ? "default" : "secondary"}>
              {shop.active ? "Active" : "Inactive"}
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          Code: {shop?.code || "—"} · Created on{" "}
          {shop?.createdAt
            ? new Date(shop.createdAt).toLocaleDateString()
            : "—"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <p className="text-sm">{shop?.phone || "—"}</p>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="text-sm">{shop?.email || "—"}</p>
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
