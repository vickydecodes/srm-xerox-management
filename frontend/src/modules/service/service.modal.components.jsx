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
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceCreateSchema, serviceEditSchema } from "./service.schema";
import ServiceForm from "./service.form";

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
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <ServiceForm form={form} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the service..">
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Edit = ({ service, submitFn = () => {}, closeModal = () => {} } = {}) => {
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
        <DialogTitle>Edit Service</DialogTitle>
        <DialogDescription>Update details of {service?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <ServiceForm form={form} isEdit />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the service..">
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Delete = ({ id, name, submitFn = () => {}, closeModal = () => {} }) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleDelete = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Are you sure? {id} {name}</DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this service record can be retrieved by Admin.
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