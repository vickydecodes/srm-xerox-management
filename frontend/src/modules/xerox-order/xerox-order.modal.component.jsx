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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/core/contexts/auth.context";
import { approvalSchema } from "./xerox-order.schema";
import { toast } from "sonner";
import formatdate from "@/core/utils/formatdate.util";

const statusStyles = {
  draft: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400",
  ready_for_pickup: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",
  completed: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
};

export const View = ({ order, exported, closeModal } = {}) => {
  const { user } = useAuth();
  const { xeroxOrders } = exported || {};
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchAdmin = user?.role === "branch_admin" || user?.role === "manager";
  const isDeptAdmin = user?.role === "department_admin";
  const isShopOrStaff = user?.role === "shop_admin" || user?.role === "staff";

  const branchStatus = order?.branchAdminApproval?.status || "pending";
  const superAdminStatus = order?.superAdminApproval?.status || "pending";

  const canSubmit = order?.status === "draft" && (isSuperAdmin || isDeptAdmin);
  const canBranchApprove =
    order?.status !== "draft" &&
    order?.status !== "completed" &&
    branchStatus !== "approved" &&
    (isSuperAdmin || isBranchAdmin);

  const canSuperAdminApprove =
    order?.status !== "draft" &&
    order?.status !== "completed" &&
    branchStatus === "approved" &&
    isSuperAdmin;

  const canDeliver =
    order?.status === "ready_for_pickup" && (isSuperAdmin || isShopOrStaff);

  const canProcess =
    order?.status === "pending" &&
    superAdminStatus === "approved" &&
    (isSuperAdmin || isShopOrStaff);

  const canConvertToBill =
    (order?.status === "in_progress" || order?.status === "approved" || order?.status === "pending") &&
    (isSuperAdmin || isShopOrStaff);

  const totalCost = (order?.items || []).reduce(
    (sum, item) => sum + (Number(item?.quantity || 1) * Number(item?.price || 0)),
    0
  );

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Xerox Order: {order?.code || "Draft"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Created on {formatdate(order?.createdAt)} • {order?.department?.name || "Department"}
            </DialogDescription>
          </div>
          <Badge variant="outline" className={statusStyles[order?.status] || ""}>
            {order?.status ? order.status.replace(/_/g, " ").toUpperCase() : "DRAFT"}
          </Badge>
        </div>
      </DialogHeader>

      <div className="space-y-5 text-sm">
        {/* Order Details Card */}
        <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
          <h4 className="font-semibold text-primary">Printing Request Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Purpose / Work Title</span>
              <span className="font-medium text-foreground text-sm">{order?.purpose || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Assigned Shop</span>
              <span className="font-medium text-foreground">{order?.shop?.name || "All Shops"}</span>
            </div>
            {order?.approvedReferralNumber && (
              <div>
                <span className="text-muted-foreground block">Approval Ref & Date</span>
                <span className="font-medium text-foreground">
                  {order.approvedReferralNumber} ({order?.approvedDate ? formatdate(order.approvedDate) : "-"})
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block">Notification Email</span>
              <span className="font-medium text-foreground">{order?.attachmentEmail || "-"}</span>
            </div>
          </div>
        </div>

        {/* Ordered Products & Services */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-primary">Products & Services</h4>
            <span className="text-xs font-semibold text-foreground">
              Total: ₹{totalCost.toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Item / Service</th>
                  <th className="p-2 text-center">Type</th>
                  <th className="p-2 text-center">Quantity</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2 text-center">Attachment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(order?.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <div className="font-medium text-foreground">{item.name}</div>
                      {(item.paperSize || item.colorMode || item.binding) && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {[item.paperSize, item.colorMode, item.printSide, item.binding].filter(Boolean).join(" • ")}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {item.type === "InventoryProduct" ? "Product" : item.type || "Service"}
                      </Badge>
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {item.quantity || item.copies || 1}
                    </td>
                    <td className="p-2 text-right font-medium">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-right font-semibold text-primary">
                      ₹{(Number(item.quantity || item.copies || 1) * Number(item.price || 0)).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      {item.attachment ? (
                        <a
                          href={item.attachment.fileData || item.attachment.proof}
                          download={item.attachment.filename || "document"}
                          className="text-primary underline text-[11px]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.attachment.filename || "View File"}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funding Breakdown (With Management & Self-Support) */}
        <div className="rounded-lg border p-4 bg-muted/10 space-y-2">
          <h4 className="font-semibold text-primary">Funding Allocation</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded bg-background border">
              <span className="text-muted-foreground block">Management Amount</span>
              <span className="font-bold text-sm">₹{Number(order?.managementAmount || 0).toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded bg-background border">
              <span className="text-muted-foreground block">Self Support</span>
              <span className="font-bold text-sm">
                ₹{((order?.self_supports || []).reduce((s, x) => s + Number(x?.amount || 0), 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Proof Documents (if any exist) */}
        {order?.proofs && order.proofs.length > 0 && (
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-primary">Approval Proof Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {order.proofs.map((proof, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded border bg-background text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate font-medium">{proof.filename || `Proof #${idx + 1}`}</span>
                    <Badge variant={proof.verified ? "default" : "secondary"} className="text-[10px]">
                      {proof.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <a
                    href={proof.proof}
                    download={proof.filename || "proof"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-xs ml-2 shrink-0"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval History */}
        {order?.approvalHistory && order.approvalHistory.length > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-primary">Approval History</h4>
            <div className="space-y-2 text-xs">
              {order.approvalHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 border">
                  <div>
                    <span className="font-medium capitalize">{h.status}: </span>
                    <span className="text-muted-foreground italic">"{h.remarks || "No remarks"}"</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatdate(h.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t">
        <DialogClose asChild>
          <Button variant="outline" size="sm">Close</Button>
        </DialogClose>
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button
              size="sm"
              onClick={async () => {
                await xeroxOrders?.submit(order._id);
                if (closeModal) closeModal();
              }}
            >
              Submit for Approval
            </Button>
          )}
          {canBranchApprove && (
            <Button
              size="sm"
              onClick={() => {
                if (closeModal) closeModal();
                xeroxOrders?.openApprovalDialog(order, "branch");
              }}
            >
              Branch Admin Approval
            </Button>
          )}
          {canSuperAdminApprove && (
            <Button
              size="sm"
              onClick={() => {
                if (closeModal) closeModal();
                xeroxOrders?.openApprovalDialog(order, "super_admin");
              }}
            >
              Super Admin Approval
            </Button>
          )}
          {canProcess && (
            <Button
              size="sm"
              onClick={async () => {
                await xeroxOrders?.inProgress(order._id);
                if (closeModal) closeModal();
              }}
            >
              Start Processing
            </Button>
          )}
          {canConvertToBill && (
            <Button
              size="sm"
              onClick={() => {
                xeroxOrders?.convertToBill(order);
                if (closeModal) closeModal();
              }}
            >
              Convert to Bill
            </Button>
          )}
          {canDeliver && (
            <Button
              size="sm"
              onClick={async () => {
                await xeroxOrders?.deliver(order._id);
                if (closeModal) closeModal();
              }}
            >
              Mark Delivered
            </Button>
          )}
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export const BranchAdminApproval = ({ id, order, submitFn, closeModal } = {}) => {
  const form = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: { status: "approved", remarks: "" },
  });

  const onSubmit = async (data) => {
    try {
      await submitFn(id, data);
      toast.success(`Xerox Order branch approval: ${data.status}`);
      if (closeModal) closeModal();
    } catch {}
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Branch Admin Approval</DialogTitle>
        <DialogDescription>
          Approve or reject Xerox Order {order?.code || ""}.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision</FormLabel>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" value="approved" checked={field.value === "approved"} onChange={() => field.onChange("approved")} />
                    <span className="text-sm font-medium text-emerald-600">Approve</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" value="rejected" checked={field.value === "rejected"} onChange={() => field.onChange("rejected")} />
                    <span className="text-sm font-medium text-red-600">Reject</span>
                  </label>
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
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter any review remarks..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button type="submit">Submit Decision</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const SuperAdminApproval = ({ id, order, submitFn, closeModal } = {}) => {
  const form = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: { status: "approved", remarks: "", verifyProofs: true },
  });

  const onSubmit = async (data) => {
    try {
      await submitFn(id, data);
      toast.success(`Xerox Order super admin approval: ${data.status}`);
      if (closeModal) closeModal();
    } catch {}
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Super Admin Approval</DialogTitle>
        <DialogDescription>
          Final approval for Xerox Order {order?.code || ""}.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision</FormLabel>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" value="approved" checked={field.value === "approved"} onChange={() => field.onChange("approved")} />
                    <span className="text-sm font-medium text-emerald-600">Approve</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" value="rejected" checked={field.value === "rejected"} onChange={() => field.onChange("rejected")} />
                    <span className="text-sm font-medium text-red-600">Reject</span>
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verifyProofs"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-xs font-normal cursor-pointer">
                  Mark all submitted proof documents as verified
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter final approval remarks..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button type="submit">Submit Final Approval</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const Delete = ({ id, code, submitFn, closeModal } = {}) => (
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Delete Xerox Order?</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete order {code || ""}? This can be restored later.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={closeModal}>Cancel</Button>
      <Button
        variant="destructive"
        onClick={async () => {
          await submitFn(id);
          if (closeModal) closeModal();
        }}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const Retrieve = ({ id, submitFn, closeModal } = {}) => (
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Restore Xerox Order</DialogTitle>
      <DialogDescription>
        Restore this previously soft-deleted xerox order?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={closeModal}>Cancel</Button>
      <Button
        onClick={async () => {
          await submitFn(id);
          if (closeModal) closeModal();
        }}
      >
        Restore
      </Button>
    </DialogFooter>
  </DialogContent>
);

export const Erase = ({ id, submitFn, closeModal } = {}) => (
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle className="text-destructive">Permanently Erase Order</DialogTitle>
      <DialogDescription>
        This action cannot be undone. All data relating to this xerox order will be permanently deleted.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={closeModal}>Cancel</Button>
      <Button
        variant="destructive"
        onClick={async () => {
          await submitFn(id);
          if (closeModal) closeModal();
        }}
      >
        Erase Permanently
      </Button>
    </DialogFooter>
  </DialogContent>
);
