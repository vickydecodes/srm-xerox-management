import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useApi } from "@/core/contexts/api.context";
import { useAuth } from "@/core/contexts/auth.context";
import { useLoader } from "@/core/hooks/useLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  IconCalendarEvent,
  IconPrinter,
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconUpload,
  IconAlertCircle,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { eventOrderCreateSchema } from "@/modules/event-order/event-order.schema";
import { xeroxOrderCreateSchema } from "@/modules/xerox-order/xerox-order.schema";
import { BillingItemSearchCombobox } from "@/modules/search/search.combobox";
import { useBranchStore } from "@/modules/branch/branch.store";
import { useDepartmentStore } from "@/modules/department/department.store";
import { useServiceStore } from "@/modules/service/service.store";
import { useShopStore } from "@/modules/shop/shop.store";
import formatdate from "@/core/utils/formatdate.util";

export default function OrderCreation() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { eventOrders, xeroxOrders, services, shops, branches, departments, search } = useApi();
  const { createPreset } = useLoader();

  const branchList = useBranchStore((s) => s.list) || branches?.state || [];
  const deptList = useDepartmentStore((s) => s.list) || departments?.state || [];
  const storeServices = useServiceStore((s) => s.list);
  const servicesLoading = useServiceStore((s) => s.loading?.getAll || s.loading?.global || false);
  const serviceList = storeServices && storeServices.length > 0 ? storeServices : services?.state || [];
  const shopList = useShopStore((s) => s.list) || shops?.state || [];

  const tabParam = searchParams.get("tab");
  const getNormalizedTab = (t) => {
    if (t === "xerox") return "xerox";
    if (t === "work-order" || t === "event" || t === "work") return "work-order";
    return "xerox";
  };
  const [activeTab, setActiveTab] = useState(getNormalizedTab(tabParam));

  useEffect(() => {
    if (tabParam) {
      setActiveTab(getNormalizedTab(tabParam));
    }
  }, [tabParam]);

  const loadResources = createPreset(
    services,
    shops,
    branches,
    departments
  );

  useEffect(() => {
    loadResources();
  }, []);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const userBranchId = typeof user?.branch === "object" ? (user.branch?._id || user.branch?.id) : user?.branch || "";
  const userDeptId = typeof user?.department === "object" ? (user.department?._id || user.department?.id) : user?.department || "";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Requisition Order</h1>
          <p className="text-sm text-muted-foreground">
            Generate standard departmental Xerox orders or campus Event Orders.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full sm:w-[480px] grid-cols-2 p-1 bg-muted/60">
          <TabsTrigger value="xerox" className="flex items-center gap-2 py-2">
            <IconPrinter className="size-4 text-primary" />
            <span className="font-semibold">Xerox Order</span>
          </TabsTrigger>
          <TabsTrigger value="work-order" className="flex items-center gap-2 py-2">
            <IconCalendarEvent className="size-4 text-primary" />
            <span className="font-semibold">Event Order</span>
          </TabsTrigger>
        </TabsList>

        {/* Xerox Order Form */}
        <TabsContent value="xerox">
          <XeroxOrderForm
            user={user}
            isSuperAdmin={isSuperAdmin}
            userBranchId={userBranchId}
            userDeptId={userDeptId}
            branches={branchList}
            departments={deptList}
            shops={shopList}
            searchProducts={search?.searchProducts}
            onSubmitSuccess={() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/xerox-order`)}
            onCancel={() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/xerox-order`)}
            xeroxOrders={xeroxOrders}
          />
        </TabsContent>

        {/* Event Order Form */}
        <TabsContent value="work-order">
          <EventOrderForm
            user={user}
            isSuperAdmin={isSuperAdmin}
            userBranchId={userBranchId}
            userDeptId={userDeptId}
            branches={branchList}
            departments={deptList}
            shops={shopList}
            services={(serviceList || []).filter(
              (s) =>
                s &&
                (s.isWorkOrder === true ||
                s.is_work_order === true ||
                s.details?.isWorkOrder === true ||
                String(s.isWorkOrder) === "true" ||
                String(s.is_work_order) === "true" ||
                String(s.details?.isWorkOrder) === "true")
            )}
            servicesLoading={servicesLoading}
            searchProducts={search?.searchProducts}
            onSubmitSuccess={() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/event-order`)}
            onCancel={() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/event-order`)}
            eventOrders={eventOrders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==========================================
// EVENT ORDER FORM COMPONENT
// ==========================================
// Event Order Item Row Builder
// ==========================================
const buildEventOrderItemRow = (selectedItem) => {
  const rawSizes = selectedItem.sizes || selectedItem.details?.sizes || [];

  const itemIsCustom = Boolean(
    selectedItem.isCustomSize ?? selectedItem.details?.isCustomSize ?? true
  );

  let itemSizes = Array.isArray(rawSizes) ? [...rawSizes] : [];
  if (itemSizes.length > 0) {
    itemSizes = itemSizes.filter((s) =>
      typeof s === "object" ? s.size !== "Standard" : s !== "Standard"
    );
  }

  const firstSize = itemSizes.length > 0 ? itemSizes[0] : null;
  const initialSize = firstSize
    ? typeof firstSize === "object"
      ? firstSize.size
      : firstSize
    : itemIsCustom
      ? "Custom"
      : "Standard";

  let initialPrice = Number(selectedItem.price) || 0;
  if (
    firstSize &&
    typeof firstSize === "object" &&
    firstSize.price !== undefined &&
    firstSize.price !== null &&
    Number(firstSize.price) > 0
  ) {
    initialPrice = Number(firstSize.price) || 0;
  } else if (initialSize === "Custom") {
    initialPrice = 0;
  }

  const dimMatch =
    typeof initialSize === "string"
      ? initialSize.match(/^(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)$/)
      : null;
  const initialWidth = dimMatch ? Number(dimMatch[2]) : "";
  const initialHeight = dimMatch ? Number(dimMatch[1]) : "";
  const initialUnit =
    selectedItem.unit === "inch" || selectedItem.details?.unit === "inch"
      ? "inch"
      : "ft";
  const initialCustomSize = dimMatch
    ? `${dimMatch[1]}×${dimMatch[2]} ${initialUnit}`
    : "";

  return {
    type: "Service",
    item: selectedItem._id || selectedItem.id,
    name: selectedItem.name,
    quantity: 1,
    price: initialPrice,
    variant: selectedItem.variant || null,
    size: initialSize,
    customSize: initialCustomSize,
    customWidth: initialWidth,
    customHeight: initialHeight,
    customUnit: initialUnit,
    customRate:
      Number(selectedItem.price) ||
      (firstSize && typeof firstSize === "object" && Number(firstSize.price)) ||
      0,
    sizes: itemSizes,
    hasSizes: true,
    isCustomSize: itemIsCustom,
    isWorkOrder: true,
    customPriceAdded: false,
    attachment: null,
    attachmentFile: null,
  };
};

function EventOrderForm({
  user,
  isSuperAdmin,
  userBranchId,
  userDeptId,
  branches,
  departments,
  shops,
  services,
  servicesLoading = false,
  searchProducts,
  onSubmitSuccess,
  onCancel,
  eventOrders,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [draftOrder, setDraftOrder] = useState(null);
  const [serviceRequirements, setServiceRequirements] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const defaultMinDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const form = useForm({
    resolver: zodResolver(eventOrderCreateSchema),
    defaultValues: {
      branch: userBranchId ? String(userBranchId) : "",
      department: userDeptId ? String(userDeptId) : "",
      eventName: "",
      eventStartDate: defaultMinDate,
      eventEndDate: defaultMinDate,
      eventVenues: [],
      convenors: [],
      coordinators: [],
      approvedReferralNumber: "",
      approvedDate: new Date().toISOString().slice(0, 10),
      attachmentEmail: "",
      fundingMethod: "department",
      managementAmount: 0,
      self_supports: [],
      registrationFeeAmount: 0,
      items: [],
    },
  });

  useEffect(() => {
    const bId =
      user?.branch?._id ||
      user?.branch?.id ||
      (typeof user?.branch === "string" ? user.branch : "") ||
      userBranchId ||
      branches[0]?._id ||
      branches[0]?.id;
    if (bId && !form.getValues("branch")) {
      form.setValue("branch", String(bId));
    }
    const dId =
      user?.department?._id ||
      user?.department?.id ||
      (typeof user?.department === "string" ? user.department : "") ||
      userDeptId ||
      departments[0]?._id ||
      departments[0]?.id;
    if (dId && !form.getValues("department")) {
      form.setValue("department", String(dId));
    }
  }, [user, userBranchId, userDeptId, branches, departments, form]);

  const branchName =
    user?.branch?.name ||
    user?.branchObj?.name ||
    user?.department?.branch?.name ||
    user?.department?.branchObj?.name ||
    branches.find((b) => String(b._id || b.id) === String(user?.branch?._id || user?.branch?.id || user?.branch || userBranchId))?.name ||
    (typeof user?.branch === "string" && !user?.branch.match(/^[0-9a-fA-F]{24}$/) && user?.branch.trim() ? user.branch : "") ||
    user?.branchName ||
    (branches[0]?.name || "Main Campus");

  const deptName =
    user?.department?.name ||
    user?.dept?.name ||
    user?.departmentObj?.name ||
    user?.department?.dept_name ||
    departments.find((d) => String(d._id || d.id) === String(user?.department?._id || user?.department?.id || user?.department || userDeptId))?.name ||
    (typeof user?.department === "string" && !user?.department.match(/^[0-9a-fA-F]{24}$/) && user?.department.trim() ? user.department : "") ||
    user?.departmentName ||
    user?.deptName ||
    (departments[0]?.name || "Department Requisition");

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items") || [];
  const watchedFundingMethod = form.watch("fundingMethod") || "department";

  const totalCost = watchedItems.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );

  const workOrderServices = useMemo(() => {
    return (services || []).filter(
      (s) =>
        s &&
        (s.isWorkOrder === true ||
        s.is_work_order === true ||
        s.details?.isWorkOrder === true ||
        String(s.isWorkOrder) === "true" ||
        String(s.is_work_order) === "true" ||
        String(s.details?.isWorkOrder) === "true")
    );
  }, [services]);

  const unselectedCount = useMemo(() => {
    return workOrderServices.filter(
      (s) => !serviceRequirements[String(s._id || s.id || "")]
    ).length;
  }, [workOrderServices, serviceRequirements]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return workOrderServices;
    const q = serviceSearch.toLowerCase().trim();
    return workOrderServices.filter(
      (s) =>
        s?.name?.toLowerCase().includes(q) ||
        s?.code?.toLowerCase().includes(q) ||
        s?.description?.toLowerCase().includes(q)
    );
  }, [workOrderServices, serviceSearch]);

  const alphabetizedServices = useMemo(
    () =>
      [...filteredServices].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" })
      ),
    [filteredServices]
  );

  const handleMarkRemainingNotRequired = () => {
    setServiceRequirements((prev) => {
      const updated = { ...prev };
      workOrderServices.forEach((s) => {
        const sId = String(s._id || s.id || "");
        if (sId && !updated[sId]) {
          updated[sId] = "not_required";
        }
      });
      return updated;
    });
    toast.info("All remaining services marked as Not Required.");
  };

  const recalcCustomPrice = (index, width, height, unit = "ft", rate) => {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const r = Number(rate) || 0;
    const isInch = unit === "inch" || unit === "in";

    if (w > 0 && h > 0) {
      const sqft = isInch
        ? Math.round(((w * h) / 144) * 100) / 100
        : Math.round(w * h * 100) / 100;
      const calculatedPrice = r > 0 ? Math.round(sqft * r * 100) / 100 : 0;
      const label = `${h}×${w} ${unit}${sqft > 0 ? ` (${sqft} sq.ft)` : ""}`;

      if (calculatedPrice > 0) {
        form.setValue(`items.${index}.price`, calculatedPrice, {
          shouldValidate: true,
        });
      }
      form.setValue(`items.${index}.customSize`, label, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customWidth`, width, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customHeight`, height, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customUnit`, unit, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customPriceAdded`, true, {
        shouldValidate: true,
      });
    } else {
      const label = w > 0 && h > 0 ? `${h}×${w} ${unit}` : "";
      form.setValue(`items.${index}.customSize`, label);
    }
  };

  const handleServiceRequirementChange = (service, requirement) => {
    if (!service) return;
    const sId = String(service._id || service.id || "");
    if (!sId) return;

    setServiceRequirements((prev) => {
      const updated = { ...prev };
      if (!requirement) {
        delete updated[sId];
      } else {
        updated[sId] = requirement;
      }
      return updated;
    });

    const currentItems = form.getValues("items") || [];

    if (requirement === "required") {
      const exists = currentItems.some((i) => String(i.item) === sId);
      if (!exists) {
        const newRow = buildEventOrderItemRow(service);
        if (newRow) appendItem(newRow, { shouldFocus: false });
      }
    } else {
      const remainingItems = currentItems.filter((i) => String(i.item) !== sId);
      replaceItems(remainingItems);
    }
  };

  const handleAddServiceInstance = (serviceName, serviceItemId) => {
    const parentService = workOrderServices.find(
      (s) => String(s._id || s.id) === String(serviceItemId)
    );
    if (parentService) {
      appendItem(buildEventOrderItemRow(parentService), { shouldFocus: false });
      toast.info(`Added another item row for "${parentService.name}".`);
    } else {
      appendItem({
        type: "Service",
        item: serviceItemId,
        name: serviceName,
        quantity: 1,
        price: 0,
        size: "Standard",
        customSize: "",
        customWidth: 0,
        customHeight: 0,
        customUnit: "ft",
        customRate: 0,
        sizes: [],
        hasSizes: true,
        isCustomSize: false,
        isWorkOrder: true,
        customPriceAdded: false,
        attachment: null,
        attachmentFile: null,
      }, { shouldFocus: false });
      toast.info(`Added another item row for "${serviceName}".`);
    }
  };

  const handleRemoveItemRow = (idx, serviceItemId) => {
    const currentItems = form.getValues("items") || [];
    removeItem(idx);

    const remainingForService = currentItems.filter(
      (item, i) => i !== idx && String(item.item) === String(serviceItemId)
    );
    if (remainingForService.length === 0) {
      setServiceRequirements((prev) => ({
        ...prev,
        [String(serviceItemId)]: "not_required",
      }));
    }
  };

  const handleProofChange = (e) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const handleItemFileChange = (index, file) => {
    form.setValue(`items.${index}.attachmentFile`, file, { shouldValidate: true });
    if (file) {
      form.setValue(`items.${index}.attachment`, {
        filename: file.name,
        mimetype: file.type,
      }, { shouldValidate: true });
    } else {
      form.setValue(`items.${index}.attachment`, null, { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { ...rest } = data;
      const isDept = rest.fundingMethod === "department" || rest.fundingMethod === "management";
      if (isDept) {
        rest.managementAmount = totalCost;
        rest.self_supports = [];
      } else {
        rest.managementAmount = 0;
        rest.self_supports = [{ name: "Self Support", amount: totalCost }];
      }
      delete rest.fundingMethod;
      delete rest.registrationFeeAmount;
      delete rest.shop;
      delete rest.code;

      // Ensure eventDate is present for backend API
      rest.eventDate = rest.eventStartDate || rest.eventDate;

      const itemAttachmentFiles = [];
      if (Array.isArray(rest.items)) {
        rest.items = rest.items.map((item, idx) => {
          const { attachmentFile, ...cleanItem } = item;
          if (attachmentFile) {
            itemAttachmentFiles.push({ index: idx, file: attachmentFile });
          }
          return cleanItem;
        });
      }

      const formData = new FormData();
      Object.entries(rest).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
        }
      });

      if (proofFiles.length > 0) {
        proofFiles.forEach((file) => formData.append("proofs", file));
      }

      itemAttachmentFiles.forEach(({ index, file }) => {
        formData.append(`item_attachment_${index}`, file);
      });

      const createdDraft = await eventOrders.crud.create(formData);
      if (createdDraft) {
        setDraftOrder(createdDraft);
      } else {
        toast.error("The draft was created but its details could not be loaded. Check the Event Orders list.");
        onSubmitSuccess();
      }
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  const closeDraftDialog = () => {
    setDraftOrder(null);
    onSubmitSuccess();
  };

  const submitDraft = async () => {
    const draftOrderId = draftOrder?._id || draftOrder?.id;
    if (!draftOrderId) {
      toast.error("The draft order could not be submitted because its ID is missing.");
      return;
    }

    setSubmitting(true);
    try {
      await eventOrders.submit(draftOrderId);
      closeDraftDialog();
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    setAttemptedSubmit(true);

    if (workOrderServices.length > 0) {
      const unselectedServices = workOrderServices.filter(
        (s) => !serviceRequirements[String(s._id || s.id)]
      );
      if (unselectedServices.length > 0) {
        e.preventDefault();
        toast.error(
          `Please mark each service as either Required or Not Required ("${unselectedServices[0].name}" is pending).`
        );
        return;
      }

      const hasRequired = Object.values(serviceRequirements).some(
        (v) => v === "required"
      );
      if (!hasRequired) {
        e.preventDefault();
        toast.error("Please mark at least one service as Required.");
        return;
      }
    }

    const currentItems = form.getValues("items") || [];
    if (currentItems.length === 0) {
      e.preventDefault();
      toast.error("Please configure at least one required service item.");
      return;
    }

    form.handleSubmit(onSubmit, onInvalid)(e);
  };

  const onInvalid = (errors) => {
    console.error("Event Order validation errors:", errors);
    const msgs = [];
    if (errors.eventName) msgs.push(errors.eventName.message || "Event Name is required");
    if (errors.eventStartDate) msgs.push(errors.eventStartDate.message || "Event Start Date is required");
    if (errors.approvedReferralNumber) msgs.push(errors.approvedReferralNumber.message || "Approved Referral Number is required");
    if (errors.approvedDate) msgs.push(errors.approvedDate.message || "Approved Date is required");
    if (errors.attachmentEmail) msgs.push(errors.attachmentEmail.message || "Valid Email is required");
    if (errors.items) {
      if (typeof errors.items.message === "string") {
        msgs.push(errors.items.message);
      } else if (Array.isArray(errors.items)) {
        errors.items.forEach((itemErr, idx) => {
          if (itemErr?.attachment) msgs.push(`Item #${idx + 1}: ${itemErr.attachment.message || "Attach approved draft is required"}`);
          if (itemErr?.item) msgs.push(`Item #${idx + 1}: Please select a service`);
        });
      }
    }
    toast.error(msgs[0] || "Please check required fields in the form");
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <IconCalendarEvent className="size-5 text-primary" /> Event Order Specifications
            </CardTitle>
            <CardDescription>
              For seminars, conferences, symposiums, departmental celebrations, and custom event printing.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Minimum 72h advance notice required
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* General Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block font-medium">Branch / Campus</Label>
                <Input
                  readOnly
                  disabled
                  value={branchName}
                  className="bg-muted/40 font-medium cursor-default focus-visible:ring-0 select-none text-foreground"
                />
                <Input type="hidden" {...form.register("branch")} />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Department</Label>
                <Input
                  readOnly
                  disabled
                  value={deptName}
                  className="bg-muted/40 font-medium cursor-default focus-visible:ring-0 select-none text-foreground"
                />
                <Input type="hidden" {...form.register("department")} />
              </div>

              <FormField
                control={form.control}
                name="attachmentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Your E mail</FormLabel>
                    <FormControl>
                      <Input placeholder="name@srmist.edu.in" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Event Specifics */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">1. Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. International Conference on Computational Intelligence 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date *</FormLabel>
                      <FormControl>
                        <Input type="date" min={defaultMinDate} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                

                <FormField
                  control={form.control}
                  name="approvedReferralNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval Referral Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SRM/CSE/EVT/2026/042" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approvedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 2: Event Order Services Checklist */}
            <div id="section-event-services-checklist" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-primary">2. Event Order Services</h3>
                  <p className="text-xs text-muted-foreground">
                    Please mark each service as either <span className="font-semibold text-foreground">Required</span> or <span className="font-semibold text-foreground">Not Required</span> (mandatory for all services).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    {Object.values(serviceRequirements).filter((v) => v === "required").length} Required
                  </Badge>
                  {workOrderServices.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(serviceRequirements).length} of {workOrderServices.length} Selected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Search & Quick Action Toolbar */}
              {workOrderServices.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="relative max-w-xs w-full">
                    <Input
                      placeholder="Search event services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="h-8 text-xs bg-background pr-7"
                    />
                    {serviceSearch && (
                      <button
                        type="button"
                        onClick={() => setServiceSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {unselectedCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs self-start sm:self-auto cursor-pointer"
                      onClick={handleMarkRemainingNotRequired}
                    >
                      Mark {unselectedCount} Remaining as Not Required
                    </Button>
                  )}
                </div>
              )}

              {servicesLoading && workOrderServices.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg bg-muted/10 flex items-center justify-center gap-2">
                  <IconLoader2 className="size-4 animate-spin text-primary" /> Loading event order services...
                </div>
              ) : workOrderServices.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg bg-muted/10">
                  No event order services configured. Please contact administrator.
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg bg-muted/10">
                  No services match &ldquo;{serviceSearch}&rdquo;.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card divide-y">
                  {alphabetizedServices.map((service, serviceIndex) => {
                    if (!service) return null;
                    const sId = String(service._id || service.id || "");
                    if (!sId) return null;
                    const currentReq = serviceRequirements[sId];
                    const isUnselected = attemptedSubmit && !currentReq;
                    const isRequired = currentReq === "required";

                    // Match all item rows in form belonging to this service
                    const serviceItemEntries = itemFields
                      .map((field, idx) => ({ field, idx }))
                      .filter(({ idx }) => String(form.watch(`items.${idx}.item`) || "") === sId);

                    return (
                      <div
                        key={sId}
                        className={cn(
                          "transition-colors",
                          isRequired ? "bg-primary/[0.02]" : "hover:bg-muted/20",
                          isUnselected ? "border-2 border-destructive/60 bg-destructive/5 rounded-md m-1" : ""
                        )}
                      >
                        {/* Service Header Row with Checkboxes */}
                        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-foreground">
                            {serviceIndex + 1}. Do you need {service.name}?
                          </span>

                          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 shrink-0">
                            <label
                              htmlFor={`req-required-${sId}`}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors select-none",
                                isRequired
                                  ? "border-emerald-500/50 bg-background text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs"
                                  : "border-transparent hover:bg-background/70 text-foreground"
                              )}
                            >
                              <Checkbox
                                id={`req-required-${sId}`}
                                aria-label={`Required for ${service.name}`}
                                checked={isRequired}
                                onCheckedChange={(checked) => {
                                  handleServiceRequirementChange(service, checked ? "required" : null);
                                }}
                                className={cn(
                                  isRequired && "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 text-white"
                                )}
                              />
                              <span>Required</span>
                            </label>

                            <label
                              htmlFor={`req-not-required-${sId}`}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors select-none",
                                currentReq === "not_required"
                                  ? "border-neutral-500/50 bg-background text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs"
                                  : "border-transparent hover:bg-background/70 text-muted-foreground"
                              )}
                            >
                              <Checkbox
                                id={`req-not-required-${sId}`}
                                aria-label={`Not Required for ${service.name}`}
                                checked={currentReq === "not_required"}
                                onCheckedChange={(checked) => {
                                  handleServiceRequirementChange(service, checked ? "not_required" : null);
                                }}
                                className={cn(
                                  currentReq === "not_required" && "data-[state=checked]:bg-neutral-700 data-[state=checked]:border-neutral-700 text-white"
                                )}
                              />
                              <span>Not Required</span>
                            </label>
                          </div>
                        </div>

                        {/* When Required: Inline Configuration for this Service */}
                        {isRequired && (
                          <div className="px-3.5 pb-4 pt-1 space-y-3 bg-muted/20 border-t border-border/50 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                <IconCalendarEvent className="size-3.5" />
                                {service.name} Specifications
                              </span>
                              <Badge variant="outline" className="text-[11px] font-normal bg-background">
                                {serviceItemEntries.length} {serviceItemEntries.length === 1 ? "Configuration" : "Configurations"}
                              </Badge>
                            </div>

                            {serviceItemEntries.map(({ field, idx }, entryIdx) => {
                              const isCustom = form.watch(`items.${idx}.isCustomSize`);
                              const itemName = form.watch(`items.${idx}.name`);
                              const itemServiceId = form.watch(`items.${idx}.item`);
                              const currentAttachment = form.watch(`items.${idx}.attachment`);

                              return (
                                <div
                                  key={field.id}
                                  className="p-3.5 rounded-lg border bg-background space-y-3 shadow-2xs"
                                >
                                  {/* Sub-header if multiple rows for this service */}
                                  {serviceItemEntries.length > 1 && (
                                    <div className="flex items-center justify-between pb-1.5 border-b border-border/50 text-xs">
                                      <span className="font-semibold text-muted-foreground">
                                        Configuration #{entryIdx + 1}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive size-6 hover:bg-destructive/10 cursor-pointer"
                                        title="Remove this configuration"
                                        onClick={() => handleRemoveItemRow(idx, itemServiceId)}
                                      >
                                        <IconTrash className="size-3.5" />
                                      </Button>
                                    </div>
                                  )}

                                  {/* Main Specifications Row */}
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    {/* 1. Size / Variant Selector */}
                                    <div className="md:col-span-3">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <Label className="text-xs block font-medium">Size / Variant</Label>
                                        {form.watch(`items.${idx}.size`) === "Custom" && (
                                          <span className="text-[10px] text-primary font-medium">Custom Specs</span>
                                        )}
                                      </div>
                                      <Select
                                        value={form.watch(`items.${idx}.size`) || undefined}
                                        onValueChange={(val) => {
                                          form.setValue(`items.${idx}.size`, val, { shouldValidate: true });
                                          if (val !== "Custom") {
                                            const dimMatch =
                                              typeof val === "string"
                                                ? val.match(/^(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)$/)
                                                : null;
                                            if (dimMatch) {
                                              const d1 = Number(dimMatch[1]);
                                              const d2 = Number(dimMatch[2]);
                                              const u = form.watch(`items.${idx}.customUnit`) || "ft";
                                              const sqft = Math.round(d1 * d2 * 100) / 100;
                                              form.setValue(`items.${idx}.customWidth`, d2, { shouldValidate: true });
                                              form.setValue(`items.${idx}.customHeight`, d1, { shouldValidate: true });
                                              form.setValue(
                                                `items.${idx}.customSize`,
                                                `${d1}×${d2} ${u}${sqft > 0 ? ` (${sqft} sq.ft)` : ""}`,
                                                { shouldValidate: true }
                                              );
                                            } else {
                                              form.setValue(`items.${idx}.customSize`, "");
                                              form.setValue(`items.${idx}.customWidth`, "");
                                              form.setValue(`items.${idx}.customHeight`, "");
                                            }
                                            form.setValue(`items.${idx}.customPriceAdded`, false);

                                            const allSizes = form.watch(`items.${idx}.sizes`) || [];
                                            const matchedSize = allSizes.find((sz) =>
                                              typeof sz === "object" ? sz.size === val : sz === val
                                            );
                                            if (
                                              matchedSize &&
                                              typeof matchedSize === "object" &&
                                              matchedSize.price !== undefined &&
                                              matchedSize.price !== null &&
                                              Number(matchedSize.price) > 0
                                            ) {
                                              form.setValue(`items.${idx}.price`, Number(matchedSize.price) || 0, { shouldValidate: true });
                                            } else if (form.watch(`items.${idx}.customRate`)) {
                                              form.setValue(`items.${idx}.price`, Number(form.watch(`items.${idx}.customRate`)) || 0, { shouldValidate: true });
                                            }
                                          } else {
                                            const w = form.watch(`items.${idx}.customWidth`);
                                            const h = form.watch(`items.${idx}.customHeight`);
                                            const u = form.watch(`items.${idx}.customUnit`) || "ft";
                                            const r = Number(form.watch(`items.${idx}.customRate`)) || Number(form.watch(`items.${idx}.price`)) || 0;
                                            form.setValue(`items.${idx}.customRate`, r);
                                            recalcCustomPrice(idx, w, h, u, r);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-9 text-xs bg-background">
                                          <SelectValue placeholder="Select size / variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(form.watch(`items.${idx}.sizes`) || []).map((sz, szIdx) => {
                                            if (!sz) return null;
                                            const szPrice = typeof sz === "object" ? sz.price : undefined;
                                            const szLabel =
                                              typeof sz === "object"
                                                ? szPrice !== undefined && szPrice !== null && Number(szPrice) > 0
                                                  ? `${sz.size || "Standard"} (₹${szPrice})`
                                                  : (sz.size || "Standard")
                                                : String(sz);
                                            const szVal = typeof sz === "object" ? (sz?.size || `size-${szIdx}`) : String(sz);
                                            if (!szVal) return null;
                                            return (
                                              <SelectItem key={`${szVal}-${szIdx}`} value={szVal} className="text-xs">
                                                {szLabel}
                                              </SelectItem>
                                            );
                                          })}
                                          {((form.watch(`items.${idx}.sizes`) || []).length === 0) && (
                                            <SelectItem value="Standard" className="text-xs">
                                              Standard {form.watch(`items.${idx}.customRate`) ? `(₹${form.watch(`items.${idx}.customRate`)})` : ""}
                                            </SelectItem>
                                          )}
                                          <SelectItem value="Custom" className="text-xs font-semibold text-primary">
                                            Custom (Enter Dimensions)
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* 2. Quantity */}
                                    <div className="md:col-span-2">
                                      <Label className="text-xs mb-1.5 block font-medium">Quantity *</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        className="h-9 text-xs bg-background"
                                        {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                                      />
                                    </div>

                                    {/* 3. Unit Price (₹) */}
                                    <div className="md:col-span-2">
                                      <Label className="text-xs mb-1.5 block font-medium">Unit Price (₹) *</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        readOnly
                                        tabIndex={-1}
                                        className="h-9 text-xs bg-muted/50 font-semibold cursor-not-allowed select-none"
                                        {...form.register(`items.${idx}.price`, { valueAsNumber: true })}
                                      />
                                    </div>

                                    {/* 4. File Upload Button in the SAME ROW with label "Attach approved draft" */}
                                    <div className="md:col-span-5">
                                      <Label htmlFor={`item-attachment-${idx}`} className="text-xs mb-1.5 block font-medium">
                                        Approved Draft *
                                      </Label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          id={`item-attachment-${idx}`}
                                          type="file"
                                          aria-label="Attach approved draft"
                                          className="hidden"
                                          onChange={(e) => handleItemFileChange(idx, e.target.files?.[0] || null)}
                                        />
                                        <Button
                                          type="button"
                                          variant={currentAttachment ? "secondary" : "outline"}
                                          className={cn(
                                            "h-9 flex-1 text-xs gap-1.5 justify-start truncate border cursor-pointer",
                                            form.formState.errors?.items?.[idx]?.attachment
                                              ? "border-destructive text-destructive bg-destructive/5 hover:bg-destructive/10"
                                              : currentAttachment
                                                ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/50"
                                                : "border-dashed border-primary/40 text-primary hover:bg-primary/5"
                                          )}
                                          onClick={() => {
                                            document.getElementById(`item-attachment-${idx}`)?.click();
                                          }}
                                        >
                                          {currentAttachment ? (
                                            <IconCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                          ) : (
                                            <IconUpload className="size-4 shrink-0 text-primary" />
                                          )}
                                          <span className="truncate">
                                            {currentAttachment
                                              ? currentAttachment.filename || "Draft attached"
                                              : "Attach approved draft"}
                                          </span>
                                        </Button>

                                        {currentAttachment && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 text-destructive shrink-0 hover:bg-destructive/10 cursor-pointer"
                                            title="Remove attached file"
                                            onClick={() => {
                                              handleItemFileChange(idx, null);
                                              const inputEl = document.getElementById(`item-attachment-${idx}`);
                                              if (inputEl) inputEl.value = "";
                                            }}
                                          >
                                            <IconTrash className="size-4" />
                                          </Button>
                                        )}
                                      </div>
                                      {form.formState.errors?.items?.[idx]?.attachment && (
                                        <p className="text-[11px] text-destructive mt-1 font-medium">
                                          {form.formState.errors.items[idx].attachment.message || "Attach approved draft is required"}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Custom Dimensions when Custom size is selected */}
                                  {form.watch(`items.${idx}.size`) === "Custom" && (
                                    <div className="rounded-md border p-3 bg-muted/30 space-y-2 mt-2">
                                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                        <span>📐 Custom Dimensions & Sizing</span>
                                        <div className="flex items-center gap-1.5">
                                          <Label className="text-[11px] text-muted-foreground">Unit:</Label>
                                          <Select
                                            value={form.watch(`items.${idx}.customUnit`) || "ft"}
                                            onValueChange={(newUnit) => {
                                              form.setValue(`items.${idx}.customUnit`, newUnit);
                                              recalcCustomPrice(
                                                idx,
                                                form.watch(`items.${idx}.customWidth`),
                                                form.watch(`items.${idx}.customHeight`),
                                                newUnit,
                                                form.watch(`items.${idx}.customRate`)
                                              );
                                            }}
                                          >
                                            <SelectTrigger className="h-6 w-[100px] text-xs bg-background">
                                              <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="ft" className="text-xs">Feet (ft)</SelectItem>
                                              <SelectItem value="inch" className="text-xs">Inches (in)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                        <div>
                                          <Label className="text-[11px] text-muted-foreground">Length / Height</Label>
                                          <Input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            placeholder="Length"
                                            className="h-8 text-xs bg-background mt-1"
                                            value={form.watch(`items.${idx}.customHeight`) ?? ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              form.setValue(`items.${idx}.customHeight`, val);
                                              recalcCustomPrice(
                                                idx,
                                                form.watch(`items.${idx}.customWidth`),
                                                val,
                                                form.watch(`items.${idx}.customUnit`) || "ft",
                                                form.watch(`items.${idx}.customRate`)
                                              );
                                            }}
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-[11px] text-muted-foreground">Width</Label>
                                          <Input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            placeholder="Width"
                                            className="h-8 text-xs bg-background mt-1"
                                            value={form.watch(`items.${idx}.customWidth`) ?? ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              form.setValue(`items.${idx}.customWidth`, val);
                                              recalcCustomPrice(
                                                idx,
                                                val,
                                                form.watch(`items.${idx}.customHeight`),
                                                form.watch(`items.${idx}.customUnit`) || "ft",
                                                form.watch(`items.${idx}.customRate`)
                                              );
                                            }}
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-[11px] text-muted-foreground">
                                            Rate / sq.{form.watch(`items.${idx}.customUnit`) || "ft"} (₹)
                                          </Label>
                                          <Input
                                            type="number"
                                            readOnly
                                            tabIndex={-1}
                                            placeholder="Rate"
                                            className="h-8 text-xs bg-muted/50 font-semibold cursor-not-allowed mt-1"
                                            value={form.watch(`items.${idx}.customRate`) ?? ""}
                                          />
                                        </div>
                                      </div>

                                      {(() => {
                                        const w = Number(form.watch(`items.${idx}.customWidth`)) || 0;
                                        const h = Number(form.watch(`items.${idx}.customHeight`)) || 0;
                                        const u = form.watch(`items.${idx}.customUnit`) || "ft";
                                        const r = Number(form.watch(`items.${idx}.customRate`)) || 0;
                                        if (w > 0 && h > 0) {
                                          const sqft =
                                            u === "inch"
                                              ? Math.round(((w * h) / 144) * 100) / 100
                                              : Math.round(w * h * 100) / 100;
                                          const calculatedPrice = r > 0 ? (sqft * r).toFixed(2) : 0;
                                          return (
                                            <div className="text-xs text-primary flex items-center justify-between font-medium bg-background px-3 py-1.5 rounded border border-primary/20">
                                              <span>📐 Area: <strong>{sqft} sq.ft</strong> ({h} × {w} {u})</span>
                                              {r > 0 ? (
                                                <span>@ ₹{r}/sq.{u} = <strong>₹{calculatedPrice}</strong></span>
                                              ) : (
                                                <span>Base rate: ₹{r}</span>
                                              )}
                                            </div>
                                          );
                                        }
                                        return (
                                          <p className="text-[11px] text-muted-foreground italic">
                                            Enter length and width to calculate sq.ft area and pricing.
                                          </p>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {/* Subtotal for this configuration */}
                                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Configuration Subtotal:{" "}
                                      <strong className="text-foreground">
                                        ₹{((Number(form.watch(`items.${idx}.quantity`)) || 0) * (Number(form.watch(`items.${idx}.price`)) || 0)).toFixed(2)}
                                      </strong>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add another configuration for this specific service */}
                            <div className="pt-1 flex items-center justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/5 hover:border-primary/60 gap-1.5 font-medium cursor-pointer"
                                onClick={() => handleAddServiceInstance(service.name, sId)}
                              >
                                <IconPlus className="size-3.5" /> Add {service.name}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Section 3: Funding Allocation */}
            <div className="space-y-4">
              <div className="flex justify-end p-2.5 bg-muted/40 rounded border">
                <span className="text-sm font-bold">
                  Estimated Items Total: ₹{totalCost.toFixed(2)}
                </span>
              </div>

              <h3 className="text-base font-semibold text-primary">3. Funding Allocation</h3>
              <p className="text-xs text-muted-foreground">
                Select whether this Event Order is funded through Department budget or Self Support. Whichever source is selected covers the full order amount.
              </p>

              <FormField
                control={form.control}
                name="fundingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="department">Management </SelectItem>
                        <SelectItem value="self_support">Self Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedFundingMethod === "department" && (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Management
                    </span>
                    <p className="text-xl font-bold text-primary mt-1">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      100% full amount allocated from department budget.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Full Department Coverage
                  </Badge>
                </div>
              )}

              {watchedFundingMethod === "self_support" && (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Self Support
                    </span>
                    <p className="text-xl font-bold text-primary mt-1">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      100% full amount covered through self support.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Full Self Support Coverage
                  </Badge>
                </div>
              )}

              
            </div>

            <Separator />


            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel || (() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/event-order`))}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting Event Order..." : "Create Event Order"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <Dialog
        open={Boolean(draftOrder)}
        onOpenChange={(open) => {
          if (!open) closeDraftDialog();
        }}
      >
        <DialogContent className="max-w-lg" showCloseButton={!submitting}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Draft Event Order</DialogTitle>
              <Badge variant="outline">
                {(draftOrder?.status || "draft").replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            <DialogDescription>
              Your Event Order has been saved as a draft. Review it below, then submit it for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3">
              <div>
                <span className="block text-xs text-muted-foreground">Event Name</span>
                <span className="font-medium">{draftOrder?.eventName || "-"}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Event Date</span>
                <span className="font-medium">
                  {formatdate(draftOrder?.eventStartDate || draftOrder?.eventDate)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Department</span>
                <span className="font-medium">{draftOrder?.department?.name || deptName}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Branch / Campus</span>
                <span className="font-medium">{draftOrder?.branch?.name || branchName}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-muted-foreground">Assigned Shops</span>
                <span className="font-medium">{draftOrder?.shop?.name || "All Shops"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span>Services & Items</span>
                <span>
                  Total: ₹
                  {(draftOrder?.items || [])
                    .reduce(
                      (sum, item) =>
                        sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {(draftOrder?.items || []).map((item, index) => (
                  <div key={`${item.item || item.name}-${index}`} className="flex justify-between gap-3">
                    <span>
                      {item.name || "Order item"}
                      {item.size || item.customSize ? ` (${item.customSize || item.size})` : ""}
                      {" "}× {item.quantity || 1}
                    </span>
                    <span className="shrink-0">
                      ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDraftDialog} disabled={submitting}>
              Keep as Draft
            </Button>
            <Button type="button" onClick={submitDraft} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==========================================
// XEROX ORDER FORM COMPONENT
// ==========================================
function XeroxOrderForm({
  user,
  isSuperAdmin,
  userBranchId,
  userDeptId,
  branches,
  departments,
  shops,
  searchProducts,
  onSubmitSuccess,
  onCancel,
  xeroxOrders,
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [draftOrder, setDraftOrder] = useState(null);

  const form = useForm({
    resolver: zodResolver(xeroxOrderCreateSchema),
    defaultValues: {
      branch: userBranchId ? String(userBranchId) : "",
      department: userDeptId ? String(userDeptId) : "",
      purpose: "",
      attachmentEmail: "",
      fundingMethod: "department",
      managementAmount: 0,
      self_supports: [],
      items: [
        {
          type: "InventoryProduct",
          item: "",
          name: "",
          price: 0,
          quantity: 1,
        },
      ],
    },
  });

  useEffect(() => {
    const bId =
      user?.branch?._id ||
      user?.branch?.id ||
      (typeof user?.branch === "string" ? user.branch : "") ||
      userBranchId ||
      branches[0]?._id ||
      branches[0]?.id;
    if (bId && !form.getValues("branch")) {
      form.setValue("branch", String(bId));
    }
    const dId =
      user?.department?._id ||
      user?.department?.id ||
      (typeof user?.department === "string" ? user.department : "") ||
      userDeptId ||
      departments[0]?._id ||
      departments[0]?.id;
    if (dId && !form.getValues("department")) {
      form.setValue("department", String(dId));
    }
  }, [user, userBranchId, userDeptId, branches, departments, form]);

  const branchName =
    user?.branch?.name ||
    user?.branchObj?.name ||
    user?.department?.branch?.name ||
    user?.department?.branchObj?.name ||
    branches.find((b) => String(b._id || b.id) === String(user?.branch?._id || user?.branch?.id || user?.branch || userBranchId))?.name ||
    (typeof user?.branch === "string" && !user?.branch.match(/^[0-9a-fA-F]{24}$/) && user?.branch.trim() ? user.branch : "") ||
    user?.branchName ||
    (branches[0]?.name || "Main Campus");

  const deptName =
    user?.department?.name ||
    user?.dept?.name ||
    user?.departmentObj?.name ||
    user?.department?.dept_name ||
    departments.find((d) => String(d._id || d.id) === String(user?.department?._id || user?.department?.id || user?.department || userDeptId))?.name ||
    (typeof user?.department === "string" && !user?.department.match(/^[0-9a-fA-F]{24}$/) && user?.department.trim() ? user.department : "") ||
    user?.departmentName ||
    user?.deptName ||
    (departments[0]?.name || "Department Requisition");

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items") || [];
  const watchedFundingMethod = form.watch("fundingMethod") || "department";

  const totalCost = watchedItems.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );

  const handleAddAnotherXerox = (index) => {
    const row = form.getValues(`items.${index}`);
    if (!row || !row.name) return;

    const currentSize = row.size;
    const availableSizes = Array.isArray(row.sizes) ? row.sizes : [];
    const altSizeObj = availableSizes.find(
      (s) => (typeof s === "object" ? s.size : s) !== currentSize
    );

    let nextSize = "";
    let nextPrice = Number(row.price) || 0;

    if (altSizeObj) {
      nextSize = typeof altSizeObj === "object" ? altSizeObj.size : altSizeObj;
      if (typeof altSizeObj === "object" && altSizeObj.price !== undefined && altSizeObj.price !== null) {
        nextPrice = Number(altSizeObj.price) || 0;
      }
    } else if (availableSizes.length > 0) {
      const first = availableSizes[0];
      nextSize = typeof first === "object" ? first.size : first;
      nextPrice = typeof first === "object" && first.price !== undefined ? Number(first.price) || 0 : Number(row.price) || 0;
    }

    appendItem({
      type: row.type || "InventoryProduct",
      item: row.item,
      name: row.name,
      price: nextPrice,
      quantity: 1,
      size: nextSize,
      sizes: row.sizes || [],
    });
    toast.info(`Added new item row for "${row.name}". Select different size as needed.`);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      const isDept = payload.fundingMethod === "department" || payload.fundingMethod === "management";
      if (isDept) {
        payload.managementAmount = totalCost;
        payload.self_supports = [];
      } else {
        payload.managementAmount = 0;
        payload.self_supports = [{ name: "Self Support", amount: totalCost }];
      }
      delete payload.fundingMethod;
      delete payload.shop;
      delete payload.code;

      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
        }
      });

      const createdDraft = await xeroxOrders.crud.create(formData);
      if (createdDraft) {
        setDraftOrder(createdDraft);
      } else {
        toast.error("The draft was created but its details could not be loaded. Check the Xerox orders list.");
        onSubmitSuccess();
      }
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  const closeDraftDialog = () => {
    setDraftOrder(null);
    onSubmitSuccess();
  };

  const submitDraft = async () => {
    const draftOrderId = draftOrder?._id || draftOrder?.id;
    if (!draftOrderId) {
      toast.error("The draft order could not be submitted because its ID is missing.");
      return;
    }

    setSubmitting(true);
    try {
      await xeroxOrders.submit(draftOrderId);
      closeDraftDialog();
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors) => {
    console.error("Xerox Order validation errors:", errors);
    const msgs = [];
    if (errors.purpose) msgs.push(errors.purpose.message || "Work Title / Purpose is required");
    if (errors.attachmentEmail) msgs.push(errors.attachmentEmail.message || "Valid email is required");
    if (errors.items) {
      if (typeof errors.items.message === "string") {
        msgs.push(errors.items.message);
      } else if (Array.isArray(errors.items)) {
        errors.items.forEach((itemErr, idx) => {
          if (itemErr?.item) msgs.push(`Item #${idx + 1}: Please select a product or service`);
        });
      }
    }
    toast.error(msgs[0] || "Please check required fields in the form");
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <IconPrinter className="size-5 text-primary" /> Xerox Order 
            </CardTitle>
            <CardDescription>
              For standard xerox, print services, lab manuals, notes, and department materials.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Standard Xerox Requisition
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block font-medium">Branch / Campus</Label>
                <Input
                  readOnly
                  disabled
                  value={branchName}
                  className="bg-muted/40 font-medium cursor-default focus-visible:ring-0 select-none text-foreground"
                />
                <Input type="hidden" {...form.register("branch")} />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Department</Label>
                <Input
                  readOnly
                  disabled
                  value={deptName}
                  className="bg-muted/40 font-medium cursor-default focus-visible:ring-0 select-none text-foreground"
                />
                <Input type="hidden" {...form.register("department")} />
              </div>

              <FormField
                control={form.control}
                name="attachmentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your E-mail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Request Details (No Referral Number, No Approved Date) */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">1.Purpose</h3>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of the Order</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Exam Question Paper Printing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Products & Services (Search via BillingItemSearchCombobox + Quantity) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-primary">2. Select Service</h3>
                  <p className="text-xs text-muted-foreground">
                    Search and select services and specify quantities.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {itemFields.map((field, idx) => {
                  const currentPrice = Number(form.watch(`items.${idx}.price`)) || 0;
                  const currentQty = Number(form.watch(`items.${idx}.quantity`)) || 0;
                  const itemSubtotal = currentPrice * currentQty;

                  return (
                    <div key={field.id} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-primary">Item #{idx + 1}</span>
                          {form.watch(`items.${idx}.name`) && (
                            <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                              — {form.watch(`items.${idx}.name`)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {form.watch(`items.${idx}.name`) && (form.watch(`items.${idx}.sizes`) || []).length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/5 px-2.5 gap-1"
                              onClick={() => handleAddAnotherXerox(idx)}
                            >
                              <IconPlus className="size-3.5" /> Add another size as separate item
                            </Button>
                          )}
                          {itemFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive size-7"
                              onClick={() => removeItem(idx)}
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const itemSizes = form.watch(`items.${idx}.sizes`) || [];
                        const hasSizes = itemSizes.length > 0;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className={hasSizes ? "md:col-span-4" : "md:col-span-6"}>
                              <Label className="text-xs mb-1.5 block">Search Product / Service *</Label>
                              <BillingItemSearchCombobox
                                value={form.watch(`items.${idx}.item`)}
                                currentItemName={form.watch(`items.${idx}.name`)}
                                searchProducts={searchProducts}
                                queryParams={{ isWorkOrder: false, orderType: "XEROX_ORDER" }}
                                onSelect={(selected) => {
                                  const rawSizes = selected.sizes || selected.details?.sizes || [];
                                  const itemSizes = Array.isArray(rawSizes) ? rawSizes : [];
                                  let initialPrice = Number(selected.price) || 0;
                                  let initialSize = "";
                                  if (itemSizes.length > 0) {
                                    const first = itemSizes[0];
                                    initialSize = typeof first === "object" ? first.size : first;
                                    if (typeof first === "object" && first.price !== undefined && first.price !== null) {
                                      initialPrice = Number(first.price) || 0;
                                    }
                                  }

                                  form.setValue(`items.${idx}.item`, selected._id || selected.id, { shouldValidate: true });
                                  form.setValue(`items.${idx}.name`, selected.name, { shouldValidate: true });
                                  form.setValue(`items.${idx}.type`, selected.type || "InventoryProduct", { shouldValidate: true });
                                  form.setValue(`items.${idx}.price`, initialPrice, { shouldValidate: true });
                                  form.setValue(`items.${idx}.size`, initialSize, { shouldValidate: true });
                                  form.setValue(`items.${idx}.sizes`, itemSizes, { shouldValidate: true });
                                }}
                              />
                              {form.formState.errors?.items?.[idx]?.item && (
                                <p className="text-xs text-destructive mt-1">
                                  {form.formState.errors.items[idx].item.message}
                                </p>
                              )}
                            </div>

                            {hasSizes && (
                              <div className="md:col-span-3">
                                <Label className="text-xs mb-1.5 block">Size / Option</Label>
                                <Select
                                  value={form.watch(`items.${idx}.size`) || undefined}
                                  onValueChange={(val) => {
                                    form.setValue(`items.${idx}.size`, val, { shouldValidate: true });
                                    const allSizes = form.watch(`items.${idx}.sizes`) || [];
                                    const matched = allSizes.find((sz) =>
                                      typeof sz === "object" ? sz.size === val : sz === val
                                    );
                                    if (matched && typeof matched === "object" && matched.price !== undefined && matched.price !== null) {
                                      form.setValue(`items.${idx}.price`, Number(matched.price) || 0, { shouldValidate: true });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-xs bg-background">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(form.watch(`items.${idx}.sizes`) || []).map((sz) => {
                                      const szVal = typeof sz === "object" ? sz.size : sz;
                                      const szPrice = typeof sz === "object" ? sz.price : undefined;
                                      return (
                                        <SelectItem key={szVal} value={szVal} className="text-xs">
                                          {szVal} {szPrice !== undefined && szPrice !== null ? `(₹${szPrice})` : ""}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className={hasSizes ? "md:col-span-2" : "md:col-span-2"}>
                              <Label className="text-xs mb-1.5 block">Unit Price</Label>
                              <div className="h-9 px-3 py-2 rounded-md border bg-muted/40 text-xs font-semibold flex items-center select-none cursor-not-allowed">
                                ₹{currentPrice.toFixed(2)}
                              </div>
                            </div>

                            <div className={hasSizes ? "md:col-span-1" : "md:col-span-2"}>
                              <Label htmlFor={`item-qty-${idx}`} className="text-xs mb-1.5 block">Quantity *</Label>
                              <Input
                                id={`item-qty-${idx}`}
                                type="number"
                                min="1"
                                className="h-9 text-xs"
                                {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1.5 block">Subtotal</Label>
                              <div className="h-9 px-3 py-2 rounded-md border bg-muted/40 text-xs font-bold text-primary flex items-center justify-between select-none">
                                <span>₹{itemSubtotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    appendItem({
                      type: "InventoryProduct",
                      item: "",
                      name: "",
                      price: 0,
                      quantity: 1,
                    })
                  }
                >
                  <IconPlus className="size-4" /> Add Item
                </Button>
              </div>

              <div className="flex justify-end p-3 bg-muted/40 rounded-lg border">
                <span className="text-sm font-bold">
                  Total Order Amount: ₹{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Funding Allocation (Department or Self-Support) */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">3. Funding Allocation</h3>
              <p className="text-xs text-muted-foreground">
                Select whether this Xerox order is funded through Management budget or Self Support. Whichever source is selected covers the full order amount.
              </p>

              <FormField
                control={form.control}
                name="fundingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose funding source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="department">Management</SelectItem>
                        <SelectItem value="self_support">Self Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedFundingMethod === "department" && (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Department Allocation
                    </span>
                    <p className="text-xl font-bold text-primary mt-1">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      100% full amount allocated from department budget.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Full Department Coverage
                  </Badge>
                </div>
              )}

              {watchedFundingMethod === "self_support" && (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Self Support Allocation
                    </span>
                    <p className="text-xl font-bold text-primary mt-1">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      100% full amount covered through self support.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Full Self Support Coverage
                  </Badge>
                </div>
              )}

              {/* Funding Balance Banner */}
              <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCheck className="size-4" />
                  <span>
                    Total Funding: <strong>₹{totalCost.toFixed(2)}</strong> (Full amount covered by {watchedFundingMethod === "self_support" ? "Self Support" : "Department"})
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[10px]">
                  Fully Covered
                </Badge>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel || (() => navigate(user?.role === "department_admin" ? "/department_admin/" : `/${user?.role}/xerox-order`))}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting Xerox Order..." : "Create Xerox Order"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <Dialog
        open={Boolean(draftOrder)}
        onOpenChange={(open) => {
          if (!open) closeDraftDialog();
        }}
      >
        <DialogContent className="max-w-lg" showCloseButton={!submitting}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Draft Xerox Order</DialogTitle>
              <Badge variant="outline">
                {(draftOrder?.status || "draft").replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            <DialogDescription>
              Your order has been saved as a draft. Review it below, then submit it for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3">
              <div>
                <span className="block text-xs text-muted-foreground">Purpose</span>
                <span className="font-medium">{draftOrder?.purpose || "-"}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Department</span>
                <span className="font-medium">{draftOrder?.department?.name || deptName}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Branch / Campus</span>
                <span className="font-medium">{draftOrder?.branch?.name || branchName}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Assigned Shops</span>
                <span className="font-medium">{draftOrder?.shop?.name || "All Shops"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span>Items</span>
                <span>
                  Total: ₹
                  {(draftOrder?.items || [])
                    .reduce(
                      (sum, item) =>
                        sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {(draftOrder?.items || []).map((item, index) => (
                  <div key={`${item.item || item.name}-${index}`} className="flex justify-between gap-3">
                    <span>{item.name || "Order item"} × {item.quantity || 1}</span>
                    <span className="shrink-0">
                      ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDraftDialog} disabled={submitting}>
              Keep as Draft
            </Button>
            <Button type="button" onClick={submitDraft} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
