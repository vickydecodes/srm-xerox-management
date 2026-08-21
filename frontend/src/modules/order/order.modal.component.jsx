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
import { Mail } from "lucide-react";

const statusStyles = {
  draft: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400",
  ready_for_pickup: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
  completed: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
};

const approvalStatusStyles = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
};

export const View = ({ order, exported, closeModal } = {}) => {
  const { user } = useAuth();
  const { orders } = exported;
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchAdmin = user?.role === "branch_admin";
  const isDeptAdmin = user?.role === "department_admin";
  const isShopOrStaff = user?.role === "shop_admin" || user?.role === "staff";

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

  const canDeliver = order?.status === "ready_for_pickup" && (isSuperAdmin || isShopOrStaff);

  const canReadyForPickup = order?.status === "in_progress" && (isSuperAdmin || isShopOrStaff);

  const canProcess =
    order?.status === "pending" &&
    superAdminStatus === "approved" &&
    (isSuperAdmin || isShopOrStaff);

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {order?.code || "Draft Order"}
          <Badge
            variant="outline"
            className={statusStyles[order?.status] || "border-gray-200 text-gray-700"}
          >
            {order?.status ? order.status.replace(/_/g, " ").toUpperCase() : "-"}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {order?.department?.name || "-"} · {order?.branch?.name || "-"} · Shop: {order?.shop?.name || "-"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">Purpose</span>
            <span>{order?.purpose || "-"}</span>
          </div>
          <div className="rounded-md border p-3">
            <span className="text-muted-foreground block">Attachment Sender Email</span>
            <span className="font-mono">{order?.attachmentEmail || "-"}</span>
          </div>
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
              variant="outline"
              className={approvalStatusStyles[order?.branchAdminApproval?.status || "pending"]}
            >
              {(order?.branchAdminApproval?.status || "pending").toUpperCase()}
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
              variant="outline"
              className={approvalStatusStyles[order?.superAdminApproval?.status || "pending"]}
            >
              {(order?.superAdminApproval?.status || "pending").toUpperCase()}
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
          {canDeliver && (
            <Button
              onClick={async () => {
                await orders.deliver(order._id);
                if (closeModal) closeModal();
              }}
            >
              Mark as Delivered
            </Button>
          )}
          {canReadyForPickup && (
            <Button
              onClick={async () => {
                await orders.readyForPickup(order._id);
                if (closeModal) closeModal();
              }}
            >
              Mark Ready for Pickup
            </Button>
          )}
          {canProcess && (
            <Button
              onClick={async () => {
                await orders.inProgress(order._id);
                if (closeModal) closeModal();
              }}
            >
              Start Processing
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
      shop: "",
      branch: userBranchId,
      department: userDeptId,
      purpose: "",
      attachmentEmail: user?.email || "",
      managementAmount: 0,
      sponsors: [],
      items: [],
    },
  });

  const { createPreset } = useLoader();
  const loadBranches = createPreset(exported?.branches);
  const loadDepartments = createPreset(exported?.departments);
  const loadSettings = createPreset(exported?.settings);
  const loadShops = createPreset(exported?.shops);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({ run, form, onSuccess: closeModal });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    if (exported?.settings) loadSettings();
    if (exported?.shops) loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collegeEmail = exported?.settings?.config?.srmCollegeEmail || "srmxerox@srmist.edu.in";

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Order</DialogTitle>
        <DialogDescription>Raise a new order</DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 text-sm text-indigo-900 flex items-start gap-3 shadow-sm dark:border-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200 my-2">
        <Mail className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 dark:text-indigo-400" />
        <div className="flex-1">
          <h5 className="font-semibold mb-1 text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Important Instruction</h5>
          <p className="text-xs leading-relaxed text-indigo-600 dark:text-indigo-400">
            Please email your attachments/files to:{" "}
            <strong className="text-indigo-900 font-bold select-all underline decoration-dashed dark:text-indigo-200">{collegeEmail}</strong>.
            Ensure you fill the email from which you sent them in the field below.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <OrderForm
            form={form}
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
            shops={exported?.shops?.state || []}
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
      shop: order?.shop?._id || order?.shop || "",
      branch: order?.branch?._id || order?.branch || "",
      department: order?.department?._id || order?.department || "",
      purpose: order?.purpose || "",
      attachmentEmail: order?.attachmentEmail || "",
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
  const loadSettings = createPreset(exported?.settings);
  const loadShops = createPreset(exported?.shops);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({ run, form, onSuccess: closeModal });

  useEffect(() => {
    if (exported?.branches) loadBranches();
    if (exported?.departments) loadDepartments();
    if (exported?.settings) loadSettings();
    if (exported?.shops) loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collegeEmail = exported?.settings?.config?.srmCollegeEmail || "srmxerox@srmist.edu.in";

  return (
    <DialogContent className="w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Order {order?.code}</DialogTitle>
        <DialogDescription>Update this order before approval</DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 text-sm text-indigo-900 flex items-start gap-3 shadow-sm dark:border-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200 my-2">
        <Mail className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 dark:text-indigo-400" />
        <div className="flex-1">
          <h5 className="font-semibold mb-1 text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Important Instruction</h5>
          <p className="text-xs leading-relaxed text-indigo-600 dark:text-indigo-400">
            Please email your attachments/files to:{" "}
            <strong className="text-indigo-900 font-bold select-all underline decoration-dashed dark:text-indigo-200">{collegeEmail}</strong>.
            Ensure you fill the email from which you sent them in the field below.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <OrderForm
            form={form}
            branches={exported?.branches?.state || []}
            departments={exported?.departments?.state || []}
            shops={exported?.shops?.state || []}
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
