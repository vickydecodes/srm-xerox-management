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
import { departmentAdminCreateSchema, departmentAdminEditSchema,resetPasswordSchema } from "./department-admin.schema";
import DepartmentAdminForm from "./department-admin.form";
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
        <span className="text-muted-foreground block">Department</span>
        <span>{admin?.department?.name || admin?.department || "-"}</span>
      </div>
    </div>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

export const Create = ({ submitFn = () => {}, closeModal = () => {}, exported } = {}) => {
  const form = useForm({
    resolver: zodResolver(departmentAdminCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      branch: "",
      department: "",
      active: true,
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);
  const loadDepartments = createPreset(exported?.departments);

  const { run, loading, ErrorAlert, clearError } = useAsync((formData) => {
    const { branch, ...rest } = formData; // branch was only for filtering; drop before submit
    return submitFn(rest);
  });

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Department Admin</DialogTitle>
        <DialogDescription>Enter details of the department admin</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <DepartmentAdminForm
            form={form}
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
          />
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

export const Edit = ({ admin, submitFn = () => {}, closeModal = () => {}, exported } = {}) => {
  const form = useForm({
    resolver: zodResolver(departmentAdminEditSchema),
    defaultValues: {
      login_id: admin?.login_id || "",
      name: admin?.name || "",
      email: admin?.email || "",
      phone: admin?.phone || "",
      address: admin?.address || "",
      branch: admin?.department?.branch?._id || admin?.department?.branch || "",
      department: admin?.department?._id || admin?.department || "",
      active: admin?.active ?? true,
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);
  const loadDepartments = createPreset(exported?.departments);

  const { run, loading, ErrorAlert, clearError } = useAsync((formData) => {
    const { branch, ...rest } = formData;
    return submitFn(rest);
  });

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent className="w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Department Admin</DialogTitle>
        <DialogDescription>Update details of {admin?.name}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <DepartmentAdminForm
            form={form}
            isEdit
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
          />
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

export const Delete = ({ id, name, submitFn = () => {}, closeModal = () => {} }) => {
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
          This will be stored as deleted, this department admin record can be retrieved by Admin.
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
          <strong>Note:</strong> This operation is a permanent delete. All data related to this
          department admin will be lost.
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
          <strong>Note:</strong> This will restore the department admin and all related data.
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

export const ResetPassword = ({ id, name, submitFn = () => {}, closeModal = () => {} } = {}) => {
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync((data) =>
    submitFn(id, data.newPassword)
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
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" {...field} />
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
                  <Input type="password" placeholder="Re-enter new password" {...field} />
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

export const ActiveStatus = ({ id, status, submitFn, closeModal, exported }) => {
  const actionLabel = status ? 'Deactivate' : 'Activate';

  const onConfirm = async () => {
    await submitFn(id, { active: !status });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} department admin</DialogTitle>
        <DialogDescription>
          {status ? (
            <>This will <strong>deactivate</strong> this department admin's account.</>
          ) : (
            <>This will <strong>activate</strong> this department admin's account.</>
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