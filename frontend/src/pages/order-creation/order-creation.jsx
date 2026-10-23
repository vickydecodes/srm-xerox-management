import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApi } from "@/core/contexts/api.context";
import { useAuth } from "@/core/contexts/auth.context";
import { useLoader } from "@/core/hooks/useLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@tabler/icons-react";
import { eventOrderCreateSchema } from "@/modules/event-order/event-order.schema";
import { xeroxOrderCreateSchema } from "@/modules/xerox-order/xerox-order.schema";
import { BillingItemSearchCombobox } from "@/modules/search/search.combobox";
import { useBranchStore } from "@/modules/branch/branch.store";
import { useDepartmentStore } from "@/modules/department/department.store";
import { useServiceStore } from "@/modules/service/service.store";
import { useShopStore } from "@/modules/shop/shop.store";

export default function OrderCreation() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { eventOrders, xeroxOrders, services, shops, branches, departments, search } = useApi();
  const { createPreset } = useLoader();

  const branchList = useBranchStore((s) => s.list) || [];
  const deptList = useDepartmentStore((s) => s.list) || [];
  const serviceList = useServiceStore((s) => s.list) || [];
  const shopList = useShopStore((s) => s.list) || [];

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
    { module: services, query: { full: true, isWorkOrder: true, is_work_order: true } },
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
            onSubmitSuccess={() => navigate(`/${user?.role}/xerox-order`)}
            onCancel={() => navigate(`/${user?.role}/xerox-order`)}
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
            services={serviceList.filter(
              (s) =>
                s.isWorkOrder === true ||
                s.is_work_order === true ||
                String(s.isWorkOrder) === "true" ||
                String(s.is_work_order) === "true"
            )}
            searchProducts={search?.searchProducts}
            onSubmitSuccess={() => navigate(`/${user?.role}/event-order`)}
            onCancel={() => navigate(`/${user?.role}/event-order`)}
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
  searchProducts,
  onSubmitSuccess,
  onCancel,
  eventOrders,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [draftOrder, setDraftOrder] = useState(null);

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
      items: [
        {
          type: "Service",
          item: "",
          name: "",
          quantity: 1,
          price: 0,
          size: "",
          customSize: "",
          isCustomSize: false,
          customWidth: 0,
          customHeight: 0,
          customUnit: "ft",
          customRate: 0,
          sizes: [],
          attachment: null,
          attachmentFile: null,
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

  const workOrderServices = (services || []).filter(
    (s) =>
      s.isWorkOrder === true ||
      s.is_work_order === true ||
      String(s.isWorkOrder) === "true" ||
      String(s.is_work_order) === "true"
  );

  const effectiveSearchProducts =
    searchProducts ||
    (async (query = "") => {
      const q = query.toLowerCase().trim();
      if (!q) return workOrderServices;
      return workOrderServices.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    });

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

  const handleAddAnother = (index) => {
    const row = form.getValues(`items.${index}`);
    if (!row || !row.name) return;

    const currentSize = row.size;
    const availableSizes = Array.isArray(row.sizes) ? row.sizes : [];
    const altSizeObj = availableSizes.find(
      (s) => (typeof s === "object" ? s.size : s) !== currentSize
    );

    let nextSize = "";
    let nextPrice = Number(row.customRate) || Number(row.price) || 0;

    if (altSizeObj) {
      nextSize = typeof altSizeObj === "object" ? altSizeObj.size : altSizeObj;
      if (typeof altSizeObj === "object" && altSizeObj.price !== undefined && altSizeObj.price !== null) {
        nextPrice = Number(altSizeObj.price) || 0;
      }
    } else if (currentSize !== "Custom") {
      nextSize = "Custom";
      nextPrice = 0;
    } else if (availableSizes.length > 0) {
      const first = availableSizes[0];
      nextSize = typeof first === "object" ? first.size : first;
      nextPrice = typeof first === "object" && first.price !== undefined ? Number(first.price) || 0 : Number(row.price) || 0;
    } else {
      nextSize = "Standard";
    }

    appendItem({
      type: "Service",
      item: row.item,
      name: row.name,
      quantity: 1,
      price: nextPrice,
      variant: row.variant || null,
      size: nextSize,
      customSize: "",
      customWidth: "",
      customHeight: "",
      customUnit: row.customUnit || "ft",
      customRate: row.customRate || row.price || 0,
      sizes: row.sizes || [],
      hasSizes: true,
      isCustomSize: Boolean(row.isCustomSize),
      isWorkOrder: true,
      customPriceAdded: false,
      attachment: null,
      attachmentFile: null,
    });
    toast.info(`Added new item row for "${row.name}". Select different size as needed.`);
  };

  const handleServiceSelect = (index, service) => {
    const s =
      typeof service === "object" && service !== null
        ? service
        : workOrderServices.find((srv) => String(srv._id || srv.id) === String(service)) ||
          services.find((srv) => String(srv._id || srv.id) === String(service));
    if (!s) return;

    const row = buildEventOrderItemRow(s);
    form.setValue(`items.${index}.type`, "Service", { shouldValidate: true });
    form.setValue(`items.${index}.item`, row.item, { shouldValidate: true });
    form.setValue(`items.${index}.name`, row.name, { shouldValidate: true });
    form.setValue(`items.${index}.price`, row.price, { shouldValidate: true });
    form.setValue(`items.${index}.size`, row.size, { shouldValidate: true });
    form.setValue(`items.${index}.sizes`, row.sizes, { shouldValidate: true });
    form.setValue(`items.${index}.hasSizes`, row.hasSizes, { shouldValidate: true });
    form.setValue(`items.${index}.isCustomSize`, row.isCustomSize, { shouldValidate: true });
    form.setValue(`items.${index}.customRate`, row.customRate, { shouldValidate: true });
    form.setValue(`items.${index}.customUnit`, row.customUnit, { shouldValidate: true });
    form.setValue(`items.${index}.customWidth`, row.customWidth ?? "", { shouldValidate: true });
    form.setValue(`items.${index}.customHeight`, row.customHeight ?? "", { shouldValidate: true });
    form.setValue(`items.${index}.customSize`, row.customSize ?? "", { shouldValidate: true });
    form.setValue(`items.${index}.customPriceAdded`, false, { shouldValidate: true });
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
          if (itemErr?.attachment) msgs.push(`Item #${idx + 1}: ${itemErr.attachment.message || "Attachment is required"}`);
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
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
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

            {/* Services / Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-primary">2. Select Services & Items</h3>
                  <p className="text-xs text-muted-foreground">Select required Service & Items</p>
                </div>
              </div>

              <div className="space-y-3">
                {itemFields.map((field, idx) => {
                  const isCustom = form.watch(`items.${idx}.isCustomSize`);
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
                          {form.watch(`items.${idx}.name`) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/5 px-2.5 gap-1"
                              onClick={() => handleAddAnother(idx)}
                            >
                              <IconPlus className="size-3.5" /> Add another item
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
                        const isCustom = Boolean(form.watch(`items.${idx}.isCustomSize`));
                        const hasSizes = true;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                            {/* 1. Service Search Combobox */}
                            <div className="md:col-span-5">
                              <Label className="text-xs mb-1.5 block">Search Service *</Label>
                              <BillingItemSearchCombobox
                                value={form.watch(`items.${idx}.item`)}
                                currentItemName={form.watch(`items.${idx}.name`)}
                                searchProducts={effectiveSearchProducts}
                                queryParams={{ isWorkOrder: true, orderType: "WORK_ORDER" }}
                                onSelect={(selected) => handleServiceSelect(idx, selected)}
                                placeholder="Search event order services..."
                                searchPlaceholder="Type service name (e.g., banner, binding)..."
                              />
                            </div>

                            {/* 2. Size / Variant Selector */}
                            <div className="md:col-span-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-xs block">Size / Variant</Label>
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
                                    
                                    // Match with variant/size and set price
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
                                    // Custom size selected: calculate from dimensions if already set
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
                                  {(form.watch(`items.${idx}.sizes`) || []).map((sz) => {
                                    const szPrice = typeof sz === "object" ? sz.price : undefined;
                                    const szLabel =
                                      typeof sz === "object"
                                        ? szPrice !== undefined && szPrice !== null && Number(szPrice) > 0
                                          ? `${sz.size} (₹${szPrice})`
                                          : sz.size
                                        : sz;
                                    const szVal = typeof sz === "object" ? sz.size : sz;
                                    return (
                                      <SelectItem key={szVal} value={szVal} className="text-xs">
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

                            {/* 3. Quantity */}
                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1.5 block">Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                className="h-9 text-xs"
                                {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                              />
                            </div>

                            {/* 4. Unit Price (₹) - Strictly read-only */}
                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1.5 block">Unit Price (₹) *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                readOnly
                                tabIndex={-1}
                                className="h-9 text-xs bg-muted/40 font-semibold cursor-not-allowed select-none"
                                {...form.register(`items.${idx}.price`, { valueAsNumber: true })}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Custom Size Details & Calculator when Custom is selected */}
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

                          {/* Live Sq.Ft and Calculated Price Preview */}
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

                      {/* File Attachment for item */}
                      <div className="pt-2 border-t flex flex-col items-start gap-2">
                        <div className="w-full">
                          <Label htmlFor={`item-attachment-${idx}`} className="text-xs font-normal text-muted-foreground block">
                            Attach creative design / approved layout:
                          </Label>
                          {form.formState.errors?.items?.[idx]?.attachment && (
                            <p className="text-xs text-destructive mt-0.5 font-medium">
                              {form.formState.errors.items[idx].attachment.message}
                            </p>
                          )}
                        </div>
                        <Input
                          id={`item-attachment-${idx}`}
                          type="file"
                          className="max-w-xs text-xs h-8"
                          onChange={(e) => handleItemFileChange(idx, e.target.files?.[0] || null)}
                        />
                      </div>
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
                      type: "Service",
                      item: "",
                      name: "",
                      quantity: 1,
                      price: 0,
                      size: "",
                      customSize: "",
                      isCustomSize: false,
                      customWidth: 0,
                      customHeight: 0,
                      customUnit: "ft",
                      customRate: 0,
                      sizes: [],
                      attachment: null,
                      attachmentFile: null,
                    })
                  }
                >
                  <IconPlus className="size-4" /> Add Item
                </Button>
              </div>

              <div className="flex justify-end p-2 bg-muted/40 rounded border">
                <span className="text-sm font-bold">
                  Estimated Items Total: ₹{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Funding Allocation */}
            <div className="space-y-4">
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
              <Button type="button" variant="outline" onClick={onCancel || (() => navigate(`/${user?.role}/event-order`))}>
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
                <span className="block text-xs text-muted-foreground">Event</span>
                <span className="font-medium">{draftOrder?.eventName || "-"}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Event Dates</span>
                <span className="font-medium">
                  {draftOrder?.eventStartDate || "-"}
                  {draftOrder?.eventEndDate ? ` to ${draftOrder.eventEndDate}` : ""}
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
              <div>
                <span className="block text-xs text-muted-foreground">Assigned Shops</span>
                <span className="font-medium">{draftOrder?.shop?.name || "All Shops"}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Venue</span>
                <span className="font-medium">
                  {Array.isArray(draftOrder?.eventVenues) && draftOrder.eventVenues.length
                    ? draftOrder.eventVenues.join(", ")
                    : "-"}
                </span>
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
              <Button type="button" variant="outline" onClick={onCancel || (() => navigate(`/${user?.role}/xerox-order`))}>
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
