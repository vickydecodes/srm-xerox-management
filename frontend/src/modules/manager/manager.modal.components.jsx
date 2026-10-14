import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  managerCreateSchema,
  managerEditSchema,
  resetPasswordSchema,
} from "./manager.schema";
import ManagerForm from "./manager.form";
import { useLoader } from "@/core/hooks/useLoader";
import { useEffect } from "react";

export const View = ({ admin } = {}) => (
  <DialogContent className="w-xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {admin?.name}
        <Badge variant={admin?.active ? "default" : "secondary"}>
          {admin?.active ? "Active" : "Inactive"}
        </Badge>
      </DialogTitle>
      <DialogDescription>Login ID: {admin?.login_id || "-"}</DialogDescription>
    </DialogHeader>

    <div className="grid gap-3 text-sm">
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Email</span>
        <span>{admin?.email || "-"}</span>
      </div>
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Phone</span>
        <span>{admin?.phone || "-"}</span>
      </div>
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Address</span>
        <span>{admin?.address || "-"}</span>
      </div>
      <div className="rounded-md border p-3">
        <span className="text-muted-foreground block">Branch</span>
        <span>{admin?.branch?.name || admin?.branch || "-"}</span>
      </div>
    </div>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

export const Create = ({
  submitFn = () => {},
  closeModal = () => {},
  exported,
} = {}) => {
  const form = useForm({
    resolver: zodResolver(managerCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      branch: "",
      active: true,
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    if (exported?.branches) loadBranches();
  }, []);

  return (
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Manager</DialogTitle>
        <DialogDescription>Enter details of the manager</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ManagerForm
            form={form}
            branches={exported?.branches?.state || []}
          />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Creating..">
              Create Manager
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
  admin,
  submitFn = () => {},
  closeModal = () => {},
  exported,
} = {}) => {
  const form = useForm({
    resolver: zodResolver(managerEditSchema),
    defaultValues: {
      login_id: admin?.login_id || "",
      name: admin?.name || "",
      email: admin?.email || "",
      phone: admin?.phone || "",
      address: admin?.address || "",
      branch: admin?.branch?._id || admin?.branch || "",
      active: admin?.active ?? true,
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Manager</DialogTitle>
        <DialogDescription>Update details of {admin?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <ManagerForm
            form={form}
            isEdit
            branches={exported?.branches?.state || []}
          />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Updating..">
              Update Manager
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
} = {}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const onSubmit = useSubmit({
    run,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Deactivate Manager</DialogTitle>
        <DialogDescription>
          Are you sure you want to move <b>{name}</b> to the recycle bin?
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          variant="destructive"
          onClick={() => onSubmit(id)}
          loading={loading}
          loadingText="Deleting.."
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const ActiveStatus = ({
  id,
  status,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const onSubmit = useSubmit({
    run,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Change Status</DialogTitle>
        <DialogDescription>
          Are you sure you want to {status ? "activate" : "deactivate"} this manager?
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          variant={status ? "default" : "destructive"}
          onClick={() => onSubmit(id, { active: status })}
          loading={loading}
          loadingText="Updating.."
        >
          {status ? "Activate" : "Deactivate"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const Retrieve = ({
  id,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const onSubmit = useSubmit({
    run,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Restore Manager</DialogTitle>
        <DialogDescription>
          Restore this manager back into active operations?
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          variant="default"
          onClick={() => onSubmit(id)}
          loading={loading}
          loadingText="Restoring.."
        >
          Restore
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const Erase = ({
  id,
  submitFn = () => {},
  closeModal = () => {},
} = {}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const onSubmit = useSubmit({
    run,
    onSuccess: closeModal,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Erase Manager</DialogTitle>
        <DialogDescription className="text-destructive">
          This action cannot be undone. This manager will be permanently removed from the database.
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          variant="destructive"
          onClick={() => onSubmit(id)}
          loading={loading}
          loadingText="Erasing.."
        >
          Erase Permanently
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
