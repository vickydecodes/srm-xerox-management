import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentCreateSchema } from "./department.schema";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
          <DepartmentForm form={form} isEdit={data} />
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

export const View = ({ department } = {}) => {
  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {department?.name || "Department"}
          {department?.active !== undefined && (
            <Badge variant={department.active ? "default" : "secondary"}>
              {department.active ? "Active" : "Inactive"}
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          Created on{" "}
          {department?.createdAt
            ? new Date(department.createdAt).toLocaleDateString()
            : "—"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        {/* ID */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">ID</p>
          <p className="text-sm font-mono">{department?.id || "—"}</p>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p className="text-sm">{department?.name || "—"}</p>
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