import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentCreateSchema } from "./department.schema";
import DepartmentForm from "./department.form";


export const Create = ({ submitFn = () => {}, closeModal = () => {}, data } = {}) => {
  const form = useForm({
    resolver: zodResolver(departmentCreateSchema),
    defaultValues: data ?? {
      id: '',
      name: '',
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
        <DialogTitle>{data ? "Edit Department" : "Create Department"}</DialogTitle>
        <DialogDescription>Enter details of Department</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <DepartmentForm form={form} isEdit={!!data} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the branch..">
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
          This will be stored as deleted, this branch record can be retrieved by Admin.
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