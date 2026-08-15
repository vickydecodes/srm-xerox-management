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
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/core/contexts/auth.context";
import {
  orderCreateSchema,
  orderEditSchema,
  approvalSchema,
} from "./order.schema";
import OrderForm from "./order.form";
import { useLoader } from "@/core/hooks/useLoader";
import { useEffect } from "react";

const statusVariant = {
  draft: "outline",
  pending: "secondary",
  in_progress: "default",
  completed: "default",
  rejected: "destructive",
};

export const View = ({ order, exported, closeModal } = {}) => {
  const { user } = useAuth();
  const { orders } = exported;
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchAdmin = user?.role === "branch_admin";
  const isDeptAdmin = user?.role === "department_admin";

  const branchStatus = order?.branchAdminApproval?.status || "pending";
  const superAdminStatus = order?.superAdminApproval?.status || "pending";

  const canSubmit = order?.status === "draft" && (isSuperAdmin || isDeptAdmin);

  const canBranchApprove =
    order?.status !== "draft" &&
    order?.status !== "completed" &&
    (isSuperAdmin || isBranchAdmin);

  const canSuperAdminApprove =
    order?.status !== "draft" &&
    order?.status !== "completed" &&
    branchStatus === "approved" &&
    isSuperAdmin;

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {order?.code || "Draft Order"}
          <Badge variant={statusVariant[order?.status] || "outline"}>
            {order?.status}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {order?.department?.name || "-"} · {order?.branch?.name || "-"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 text-sm">
        <div className="rounded-md border p-3">
          <span className="text-muted-foreground block">Purpose</span>
          <span>{order?.purpose || "-"}</span>
        </div>
        <div className="rounded-md border p-3">
          <span className="text-muted-foreground block mb-2">Items</span>
          {order?.items?.length ? (
            order.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between border-b py-1 last:border-b-0"
              >
                <span>
                  {item.name}{" "}
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </span>
                <span>{item.total?.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <span>No items</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">Management Amount</span>
            <span>{Number(order?.managementAmount || 0).toFixed(2)}</span>
          </div>
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">Sponsors</span>
            <span>
              {order?.sponsors?.length
                ? order.sponsors.map((s) => `${s.name} (${s.amount})`).join(", ")
                : "-"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">
              Branch Admin Approval
            </span>
            <Badge
              variant={
                statusVariant[order?.branchAdminApproval?.status] || "outline"
              }
            >
              {order?.branchAdminApproval?.status || "pending"}
            </Badge>
            {order?.branchAdminApproval?.remarks && (
              <p className="text-xs text-muted-foreground mt-1">
                {order.branchAdminApproval.remarks}
              </p>
            )}
          </div>
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">Super Admin Approval</span>
            <Badge
              variant={statusVariant[order?.superAdminApproval?.status] || "outline"}
            >
              {order?.superAdminApproval?.status || "pending"}
            </Badge>
            {order?.superAdminApproval?.remarks && (
              <p className="text-xs text-muted-foreground mt-1">
                {order.superAdminApproval.remarks}
              </p>
            )}
          </div>
        </div>

        {order?.approvalHistory && order.approvalHistory.length > 0 && (
          <div className="rounded-md border p-3 mt-3">
            <span className="text-muted-foreground block mb-2 font-medium">
              Approval History Track
            </span>
            <div className="relative pl-4 border-l border-muted space-y-3">
              {order.approvalHistory.map((history, idx) => (
                <div key={idx} className="relative text-xs">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[21px] top-1 size-2 rounded-full border bg-background ${
                      history.status === "approved"
                        ? "border-emerald-500 bg-emerald-50"
                        : history.status === "rejected"
                        ? "border-red-500 bg-red-50"
                        : history.status === "submitted"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-400 bg-gray-50"
                    }`}
                  />
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>
                      {history.approver?.role === "branch_admin"
                        ? "Branch Admin"
                        : history.approver?.role === "super_admin"
                        ? "Super Admin"
                        : history.approver?.role === "department_admin"
                        ? "Department Admin"
                        : "User"}
                      :{" "}
                      <span
                        className={
                          history.status === "approved"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : history.status === "rejected"
                            ? "text-red-600 dark:text-red-400"
                            : history.status === "submitted"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {history.status === "draft"
                          ? "Draft Created"
                          : history.status === "submitted"
                          ? "Submitted for Approval"
                          : history.status.toUpperCase()}
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {new Date(history.date).toLocaleString()}
                    </span>
                  </div>
                  {history.approver && (
                    <div className="text-muted-foreground text-[10px]">
                      By: {history.approver.name || history.approver.email}
                    </div>
                  )}
                  {history.remarks && (
                    <p className="bg-muted/50 p-1.5 rounded mt-1 text-muted-foreground break-all italic">
                      "{history.remarks}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex items-center justify-between gap-2 mt-4">
        <div className="flex gap-2">
          {canSubmit && (
            <Button
              onClick={async () => {
                await orders.submit(order._id);
                if (closeModal) closeModal();
              }}
            >
              Submit Order
            </Button>
          )}
          {canBranchApprove && (
            <Button
              onClick={() => {
                if (closeModal) closeModal();
                orders.openApprovalDialog(order, "branch");
              }}
            >
              Branch Admin Approval
            </Button>
          )}
          {canSuperAdminApprove && (
            <Button
              onClick={() => {
                if (closeModal) closeModal();
                orders.openApprovalDialog(order, "super_admin");
              }}
            >
              Super Admin Approval
            </Button>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};;

export const Create = ({
  submitFn = () => { },
  closeModal = () => { },
  exported,
} = {}) => {
  const { user } = useAuth();

  const userBranchId = typeof user?.branch === "object" ? user.branch?._id : user?.branch || "";
  const userDeptId = typeof user?.department === "object" ? user.department?._id : user?.department || "";

  const form = useForm({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      branch: userBranchId,
      department: userDeptId,
      purpose: "",
      managementAmount: 0,
      sponsors: [],
      items: [],
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);
  const loadDepartments = createPreset(exported?.departments);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({ run, form, onSuccess: closeModal });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Order</DialogTitle>
        <DialogDescription>Raise a new order</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <OrderForm
            form={form}
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
            BillingItemSearchCombobox={
              exported?.search?.BillingItemSearchCombobox
            }
            searchProducts={exported?.search?.searchProducts}
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

export const Edit = ({
  order,
  submitFn = () => { },
  closeModal = () => { },
  exported,
} = {}) => {
  const form = useForm({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      branch: order?.branch?._id || order?.branch || "",
      department: order?.department?._id || order?.department || "",
      purpose: order?.purpose || "",
      managementAmount: order?.managementAmount || 0,
      sponsors: order?.sponsors || [],
      items:
        order?.items?.map((i) => ({
          type: i.type,
          item: i.item?._id || i.item || "",
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
        })) || [],
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);
  const loadDepartments = createPreset(exported?.departments);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({ run, form, onSuccess: closeModal });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Order {order?.code}</DialogTitle>
        <DialogDescription>Update this order before approval</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <OrderForm
            form={form}
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
            BillingItemSearchCombobox={
              exported?.search?.BillingItemSearchCombobox
            }
            searchProducts={exported?.search?.searchProducts}
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

export const Delete = ({
  id,
  code,
  submitFn = () => { },
  closeModal = () => { },
}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleDelete = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Are you sure? {code}</DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this order can be retrieved by Admin.
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
  const { run, loading, ErrorAlert } = useAsync(useAsync(submitFn));
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
          related to this order will be lost.
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
          <strong>Note:</strong> This will restore the order and all related
          data.
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

const ApprovalForm = ({
  title,
  id,
  submitFn = () => { },
  closeModal = () => { },
}) => {
  const form = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: { status: "approved", remarks: "" },
  });

  const { run, loading, ErrorAlert, clearError } = useAsync((data) =>
    submitFn(id, data),
  );
  useClearError(form, clearError);
  const onSubmit = useSubmit({ run, form, onSuccess: closeModal });

  return (
    <DialogContent className="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Approve or reject this order</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "approved" ? "default" : "outline"}
                    onClick={() => field.onChange("approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={
                      field.value === "rejected" ? "destructive" : "outline"
                    }
                    onClick={() => field.onChange("rejected")}
                  >
                    Reject
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional remarks" {...field} />
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
            <Button type="submit" loading={loading} loadingText="Submitting..">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const BranchAdminApproval = (props) => (
  <ApprovalForm title="Branch Admin Approval" {...props} />
);

export const SuperAdminApproval = (props) => (
  <ApprovalForm title="Super Admin Approval" {...props} />
);
