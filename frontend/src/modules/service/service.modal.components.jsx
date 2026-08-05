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
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceCreateSchema, serviceEditSchema } from "./service.schema";
import ServiceForm from "./service.form";
import { useLoader } from "@/core/hooks/useLoader";
import { useEffect } from "react";

export const Create = ({ submitFn = () => {}, closeModal = () => {} } = {}) => {
  const form = useForm({
    resolver: zodResolver(serviceCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      price: 0,
      active: true,
      materials: [],
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
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Service</DialogTitle>
        <DialogDescription>Enter details of the service</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ServiceForm form={form} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the service.."
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
  service,
  submitFn = () => {},
  closeModal = () => {},
  exported,
} = {}) => {
  const form = useForm({
    resolver: zodResolver(serviceEditSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      unit: service?.unit || "",
      price: service?.price || 0,
      active: service?.active ?? true,
      materials: service?.materials || [],
    },
  });

  const { createPreset } = useLoader();

  const editModal = createPreset(exported.products);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    editModal();
  }, []);

  const products = exported.products.state;

  console.log(products);

  return (
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogDescription>Update details of {service?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ServiceForm form={form} isEdit />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the service.."
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
        <DialogTitle>
          Are you sure? {id} {name}
        </DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this service record can be retrieved
          by Admin.
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

export const View = ({ service } = {}) => {
  const materials = service?.materials || [];

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {service?.name || "Service"}
          <Badge variant={service?.active ? "default" : "secondary"}>
            {service?.active ? "Active" : "Inactive"}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {service?.code && (
            <span className="font-mono text-xs mr-2">{service.code}</span>
          )}
          Created on{" "}
          {service?.createdAt
            ? new Date(service.createdAt).toLocaleDateString()
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
            {service?.description?.trim() || "No description provided."}
          </p>
        </div>

        <Separator />

        {/* Unit & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Unit</p>
            <p className="text-sm">{service?.unit || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p className="text-sm font-semibold">
              {service?.price != null ? Number(service.price).toFixed(2) : "—"}
            </p>
          </div>
        </div>

        <Separator />

        {/* Materials */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Materials</p>

          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No materials added.</p>
          ) : (
            <div className="grid gap-2">
              {materials.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                >
                  <span className="font-mono text-xs">
                    {item.product?._id ||
                      item.product?.name ||
                      item.product ||
                      "—"}
                  </span>
                  <span className="text-muted-foreground">
                    Qty: {item.quantity ?? "—"}
                  </span>
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

export const Erase = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This operation is Permenent Delete. All the data
        related to this branch will be lost.
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
        <strong>Note:</strong> this operation is retrieve All the data related
        to this branch will be back.
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
        <DialogTitle>{actionLabel} Service</DialogTitle>
        <DialogDescription>
          Confirm the status change for this Service.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border p-4 my-2">
        {isDeactivating ? (
          <div className="space-y-1 text-sm">
            <p>
              This will <strong className="text-destructive">deactivate</strong>{" "}
              the Service.
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
              Service.
            </p>
            <p className="text-muted-foreground">
              The Service will become available again.
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
