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
import {FormField,FormLabel,FormMessage,FormControl,FormItem} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffCreateSchema, staffEditSchema,resetPasswordSchema } from "./staff-admin.schema";
import StaffForm from "./staff-admin.form";

export const View = ({ staff } = {}) => (
  <DialogContent className="w-xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {staff?.name}
        <Badge variant={staff?.active ? "default" : "secondary"}>
          {staff?.active ? "Active" : "Inactive"}
        </Badge>
      </DialogTitle>
      <DialogDescription>Login ID: {staff?.login_id || "-"}</DialogDescription>
    </DialogHeader>

    <div className="grid gap-3 text-sm">
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Email</span>
        <span>{staff?.email || "-"}</span>
      </div>
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Phone</span>
        <span>{staff?.phone || "-"}</span>
      </div>
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Address</span>
        <span>{staff?.address || "-"}</span>
      </div>
    </div>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

export const Create = ({ submitFn = () => {}, closeModal = () => {} } = {}) => {
  const form = useForm({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      active: true,
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
        <DialogTitle>Create Staff</DialogTitle>
        <DialogDescription>Enter details of the staff member</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <StaffForm form={form} />
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

export const ResetPassword = ({
  id,
  name,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync((data) =>
    submitFn(id, data.newPassword),
  );

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogDescription>Set a new password for {name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Resetting..">
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Edit = ({
  staff,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const form = useForm({
    resolver: zodResolver(staffEditSchema),
    defaultValues: {
      login_id: staff?.login_id || "",
      name: staff?.name || "",
      email: staff?.email || "",
      phone: staff?.phone || "",
      address: staff?.address || "",
      active: staff?.active ?? true,
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
        <DialogTitle>Edit Staff</DialogTitle>
        <DialogDescription>Update details of {staff?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <StaffForm form={form} isEdit />
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
          This will be stored as deleted, this staff record can be retrieved by
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

export const Erase = ({ id, submitFn, closeModal }) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleErase = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogDescription>
          <strong>Note:</strong> This operation is a permanent delete. All data
          related to this staff member will be lost.
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleErase} loading={loading} variant="destructive">
          Delete Permanently
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const Retrieve = ({ id, submitFn, closeModal }) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleRetrieve = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogDescription>
          <strong>Note:</strong> This will restore the staff member and all
          related data.
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleRetrieve} loading={loading} variant="default">
          Retrieve
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const ActiveStatus = ({
  id,
  status,
  submitFn,
  closeModal,
  exported,
}) => {
  const actionLabel = status ? "Deactivate" : "Activate";

  const onConfirm = async () => {
    await submitFn(id, { active: !status });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} staff</DialogTitle>
        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> this staff member's account.
            </>
          ) : (
            <>
              This will <strong>activate</strong> this staff member's account.
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
          variant={status ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
        >
          {exported?.loading?.edit ? "Updating..." : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
