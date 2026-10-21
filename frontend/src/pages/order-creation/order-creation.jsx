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
import { Textarea } from "@/components/ui/textarea";
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

export default function OrderCreation() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { eventOrders, xeroxOrders, services, shops, branches, departments, search } = useApi();
  const { createPreset } = useLoader();

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

  const loadResources = createPreset(services, shops, branches, departments);

  useEffect(() => {
    loadResources();
  }, []);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const userBranchId = typeof user?.branch === "object" ? user.branch?._id : user?.branch || "";
  const userDeptId = typeof user?.department === "object" ? user.department?._id : user?.department || "";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Requisition Order</h1>
          <p className="text-sm text-muted-foreground">
            Generate standard departmental xerox orders or campus event work orders.
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
            <span className="font-semibold">Work Order</span>
          </TabsTrigger>
        </TabsList>

        {/* Xerox Order Form */}
        <TabsContent value="xerox">
          <XeroxOrderForm
            user={user}
            isSuperAdmin={isSuperAdmin}
            userBranchId={userBranchId}
            userDeptId={userDeptId}
            branches={branches.state || []}
            departments={departments.state || []}
            shops={shops.state || []}
            searchProducts={search?.searchProducts}
            onSubmitSuccess={() => navigate(`/${user?.role}/xerox-order`)}
            onCancel={() => navigate(`/${user?.role}/xerox-order`)}
            xeroxOrders={xeroxOrders}
          />
        </TabsContent>

        {/* Work Order (Event Order) Form */}
        <TabsContent value="work-order">
          <EventOrderForm
            user={user}
            isSuperAdmin={isSuperAdmin}
            userBranchId={userBranchId}
            userDeptId={userDeptId}
            branches={branches.state || []}
            departments={departments.state || []}
            shops={shops.state || []}
            services={services.state || []}
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
function EventOrderForm({
  user,
  isSuperAdmin,
  userBranchId,
  userDeptId,
  branches,
  departments,
  shops,
  services,
  onSubmitSuccess,
  onCancel,
  eventOrders,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);

  const defaultMinDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const form = useForm({
    resolver: zodResolver(eventOrderCreateSchema),
    defaultValues: {
      branch: userBranchId ? String(userBranchId) : "",
      department: userDeptId ? String(userDeptId) : "",
      shop: "",
      eventName: "",
      eventStartDate: defaultMinDate,
      eventEndDate: defaultMinDate,
      eventVenues: [],
      convenors: [],
      coordinators: [],
      approvedReferralNumber: "",
      approvedDate: new Date().toISOString().slice(0, 10),
      purpose: "",
      attachmentEmail: user?.email || "",
      fundingMethod: "management",
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
          size: "Standard",
          customSize: "",
          isCustomSize: false,
          customWidth: 0,
          customHeight: 0,
          customUnit: "ft",
          customRate: 0,
          attachment: null,
          attachmentFile: null,
        },
      ],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control: form.control,
    name: "self_supports",
  });

  const watchedItems = form.watch("items") || [];
  const watchedManagement = Number(form.watch("managementAmount") || 0);
  const watchedRegistration = Number(form.watch("registrationFeeAmount") || 0);
  const watchedSponsors = form.watch("self_supports") || [];
  const watchedFundingMethod = form.watch("fundingMethod");

  const totalCost = watchedItems.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );

  const totalSponsorFunds = watchedSponsors.reduce(
    (sum, s) => sum + (Number(s?.amount) || 0),
    0
  );

  const totalAvailableFunding =
    watchedFundingMethod === "management"
      ? watchedManagement
      : watchedFundingMethod === "self_support"
        ? totalSponsorFunds
        : watchedFundingMethod === "registration_fee"
          ? watchedRegistration
          : watchedManagement + totalSponsorFunds + watchedRegistration;

  const isOverBudget = totalCost > totalAvailableFunding && totalAvailableFunding > 0;

  const handleServiceSelect = (index, serviceId) => {
    const s = services.find((srv) => srv._id === serviceId);
    if (!s) return;
    form.setValue(`items.${index}.item`, s._id);
    form.setValue(`items.${index}.name`, s.name);
    form.setValue(`items.${index}.price`, Number(s.price) || 0);
    form.setValue(`items.${index}.isCustomSize`, Boolean(s.isCustomSize));
  };

  const handleProofChange = (e) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const handleItemFileChange = (index, file) => {
    form.setValue(`items.${index}.attachmentFile`, file);
    if (file) {
      form.setValue(`items.${index}.attachment`, {
        filename: file.name,
        mimetype: file.type,
      });
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { ...rest } = data;
      delete rest.fundingMethod;

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

      const res = await eventOrders.crud.create(formData);
      if (res) {
        toast.success("Event Order created successfully!");
        onSubmitSuccess();
      }
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <IconCalendarEvent className="size-5 text-primary" /> Work Order Specifications
            </CardTitle>
            <CardDescription>
              For seminars, conferences, symposiums, departmental celebrations, and custom work order printing.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Minimum 72h advance notice required
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSuperAdmin && (
                <>
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch / Campus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="shop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Xerox Shop (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign shop (or any available)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((s) => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachmentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification & Creative Email *</FormLabel>
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
              <h3 className="text-base font-semibold text-primary">1. Event Schedule & Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Official Event Title *</FormLabel>
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
                      <FormLabel>Event Start Date *</FormLabel>
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
                  name="eventEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Purpose & Summary *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain event scope, intended audience, and publicity requirements..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Services / Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-primary">2. Required Services & Items</h3>
                  <p className="text-xs text-muted-foreground">Select required printing, signage, mementos or event publicity services.</p>
                </div>
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
                      size: "Standard",
                      customSize: "",
                      isCustomSize: false,
                      customWidth: 0,
                      customHeight: 0,
                      customUnit: "ft",
                      customRate: 0,
                      attachment: null,
                      attachmentFile: null,
                    })
                  }
                >
                  <IconPlus className="size-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {itemFields.map((field, idx) => {
                  const isCustom = form.watch(`items.${idx}.isCustomSize`);
                  return (
                    <div key={field.id} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-primary">Item #{idx + 1}</span>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Service / Product *</Label>
                          <Select onValueChange={(val) => handleServiceSelect(idx, val)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Choose service..." />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((s) => (
                                <SelectItem key={s._id} value={s._id}>
                                  {s.name} (₹{s.price})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            className="mt-1"
                            {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Unit Price (₹) *</Label>
                          <Input
                            type="number"
                            min="0"
                            className="mt-1"
                            {...form.register(`items.${idx}.price`, { valueAsNumber: true })}
                          />
                        </div>
                      </div>

                      {/* Custom Size Details if needed */}
                      {isCustom && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t">
                          <div>
                            <Label className="text-xs">Width</Label>
                            <Input
                              type="number"
                              className="mt-1"
                              placeholder="Width"
                              {...form.register(`items.${idx}.customWidth`, { valueAsNumber: true })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Height</Label>
                            <Input
                              type="number"
                              className="mt-1"
                              placeholder="Height"
                              {...form.register(`items.${idx}.customHeight`, { valueAsNumber: true })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit</Label>
                            <Select
                              onValueChange={(val) => form.setValue(`items.${idx}.customUnit`, val)}
                              defaultValue="ft"
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ft">Feet (ft)</SelectItem>
                                <SelectItem value="inch">Inches (in)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Rate / sq unit</Label>
                            <Input
                              type="number"
                              className="mt-1"
                              placeholder="Rate"
                              {...form.register(`items.${idx}.customRate`, { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                      )}

                      {/* File Attachment for item */}
                      <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <Label className="text-xs font-normal text-muted-foreground">
                          Attach creative design / approved layout:
                        </Label>
                        <Input
                          type="file"
                          className="max-w-xs text-xs h-8"
                          onChange={(e) => handleItemFileChange(idx, e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  );
                })}
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
              <h3 className="text-base font-semibold text-primary">3. Financial Allocation & Sponsors</h3>

              <FormField
                control={form.control}
                name="fundingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Funding Source *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary funding method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="management">Management Budget Only</SelectItem>
                        <SelectItem value="self_support">Sponsors / Self-Supported Only</SelectItem>
                        <SelectItem value="registration_fee">Registration Fees Only</SelectItem>
                        <SelectItem value="combined">Combined Multi-Source Funding</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(watchedFundingMethod === "management" || watchedFundingMethod === "combined") && (
                  <FormField
                    control={form.control}
                    name="managementAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Management Allocated Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(watchedFundingMethod === "registration_fee" || watchedFundingMethod === "combined") && (
                  <FormField
                    control={form.control}
                    name="registrationFeeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Registration Fee Pool (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Sponsor list if self_support or combined */}
              {(watchedFundingMethod === "self_support" || watchedFundingMethod === "combined") && (
                <div className="p-4 rounded-lg border bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Sponsors & Self-Support Sources</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => appendSponsor({ name: "", amount: 0 })}
                    >
                      <IconPlus className="size-3.5" /> Add Sponsor
                    </Button>
                  </div>

                  {sponsorFields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Sponsor / Organization Name"
                          className="text-xs"
                          {...form.register(`self_supports.${idx}.name`)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Amount (₹)"
                          className="text-xs"
                          {...form.register(`self_supports.${idx}.amount`, { valueAsNumber: true })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-8 shrink-0"
                          onClick={() => removeSponsor(idx)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-xs text-muted-foreground font-semibold">
                    Total Sponsor Fund: ₹{totalSponsorFunds.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Budget Balance Banner */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${isOverBudget
                  ? "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300"
                  : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {isOverBudget ? <IconAlertCircle className="size-4" /> : <IconCheck className="size-4" />}
                  <span>
                    Total Allocated Funding: <strong>₹{totalAvailableFunding.toFixed(2)}</strong> | Total Required:{" "}
                    <strong>₹{totalCost.toFixed(2)}</strong>
                  </span>
                </div>
                {isOverBudget && (
                  <Badge variant="destructive" className="text-[10px]">
                    Over Budget By ₹{(totalCost - totalAvailableFunding).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Proof Documents */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-primary">4. Sanction & Proof Attachments</h3>
              <p className="text-xs text-muted-foreground">
                Upload signed approval circulars, budget sanction documents, or authorization letters (PDF / Images).
              </p>
              <div className="p-4 rounded-lg border-2 border-dashed bg-muted/20 text-center space-y-2">
                <IconUpload className="size-8 mx-auto text-muted-foreground" />
                <Label htmlFor="event-proofs" className="cursor-pointer block text-xs font-semibold text-primary">
                  Click to choose proof files
                </Label>
                <input
                  id="event-proofs"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleProofChange}
                />
                {proofFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {proofFiles.map((file, i) => (
                      <Badge key={i} variant="outline" className="text-xs py-1 px-2">
                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel || (() => navigate(`/${user?.role}/event-order`))}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting Work Order..." : "Create Work Order"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
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

  const form = useForm({
    resolver: zodResolver(xeroxOrderCreateSchema),
    defaultValues: {
      branch: userBranchId ? String(userBranchId) : "",
      department: userDeptId ? String(userDeptId) : "",
      shop: "",
      purpose: "",
      attachmentEmail: user?.email || "",
      fundingMethod: "management",
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

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control: form.control,
    name: "self_supports",
  });

  const watchedItems = form.watch("items") || [];
  const watchedSponsors = form.watch("self_supports") || [];
  const watchedFundingMethod = form.watch("fundingMethod");

  const totalCost = watchedItems.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );

  const totalSponsorFunds = watchedSponsors.reduce(
    (sum, s) => sum + (Number(s?.amount) || 0),
    0
  );

  const isOverBudget =
    watchedFundingMethod === "self_support" &&
    totalCost > totalSponsorFunds &&
    totalSponsorFunds > 0;

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (payload.fundingMethod === "management") {
        payload.managementAmount = totalCost;
        payload.self_supports = [];
      } else {
        payload.managementAmount = 0;
      }
      delete payload.fundingMethod;

      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
        }
      });

      const res = await xeroxOrders.crud.create(formData);
      if (res) {
        toast.success("Xerox Order created successfully!");
        onSubmitSuccess();
      }
    } catch (err) {
      // Error handled by CRUD layer
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <IconPrinter className="size-5 text-primary" /> Xerox Order Specifications
            </CardTitle>
            <CardDescription>
              For standard xerox requisition, print services, lab manuals, notes, and department materials.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Standard Xerox Requisition
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSuperAdmin && (
                <>
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch / Campus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="shop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Xerox Shop *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select xerox shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((s) => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachmentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification & Delivery Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@srmist.edu.in" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Request Details (No Referral Number, No Approved Date) */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">1. Request Details</h3>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Title / Purpose *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. End Semester Exam Question Paper Booklets / Lab Manual Printing" {...field} />
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
                  <h3 className="text-base font-semibold text-primary">2. Products & Services</h3>
                  <p className="text-xs text-muted-foreground">
                    Search and select non-event products or services and specify quantities.
                  </p>
                </div>
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

              <div className="space-y-3">
                {itemFields.map((field, idx) => {
                  const currentPrice = Number(form.watch(`items.${idx}.price`)) || 0;
                  const currentQty = Number(form.watch(`items.${idx}.quantity`)) || 0;
                  const itemSubtotal = currentPrice * currentQty;

                  return (
                    <div key={field.id} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-primary">Item #{idx + 1}</span>
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

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6">
                          <Label className="text-xs mb-1.5 block">Search Product / Service *</Label>
                          <BillingItemSearchCombobox
                            value={form.watch(`items.${idx}.item`)}
                            currentItemName={form.watch(`items.${idx}.name`)}
                            searchProducts={searchProducts}
                            queryParams={{ isWorkOrder: false, orderType: "XEROX_ORDER" }}
                            onSelect={(selected) => {
                              form.setValue(`items.${idx}.item`, selected._id, { shouldValidate: true });
                              form.setValue(`items.${idx}.name`, selected.name, { shouldValidate: true });
                              form.setValue(`items.${idx}.type`, selected.type || "InventoryProduct", { shouldValidate: true });
                              form.setValue(`items.${idx}.price`, Number(selected.price) || 0, { shouldValidate: true });
                            }}
                          />
                          {form.formState.errors?.items?.[idx]?.item && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.items[idx].item.message}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs mb-1.5 block">Unit Price</Label>
                          <div className="h-9 px-3 py-2 rounded-md border bg-muted/40 text-xs font-semibold flex items-center">
                            ₹{currentPrice.toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
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
                          <div className="h-9 px-3 py-2 rounded-md border bg-muted/40 text-xs font-bold text-primary flex items-center justify-between">
                            <span>₹{itemSubtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end p-3 bg-muted/40 rounded-lg border">
                <span className="text-sm font-bold">
                  Total Order Amount: ₹{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Funding Allocation (Strictly Management or Self-Support, Static Management Amount) */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary">3. Funding Allocation</h3>
              <p className="text-xs text-muted-foreground">
                Select whether this Xerox order is funded through departmental management funds or self-support sponsors.
              </p>

              <FormField
                control={form.control}
                name="fundingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose funding source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="management">Department Management Fund</SelectItem>
                        <SelectItem value="self_support">Sponsor / Self-Supported</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedFundingMethod === "management" && (
                <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Allocated Management Amount
                    </span>
                    <p className="text-xl font-bold text-primary mt-1">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically calculated and statically allocated from department budget.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Static Allocation
                  </Badge>
                </div>
              )}

              {watchedFundingMethod === "self_support" && (
                <div className="p-4 rounded-lg border bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold">Self-Support Sponsors</span>
                      <p className="text-[11px] text-muted-foreground">Add individual sponsors funding this order</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      onClick={() => appendSponsor({ name: "", amount: 0 })}
                    >
                      <IconPlus className="size-3.5" /> Add Sponsor
                    </Button>
                  </div>

                  {sponsorFields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No sponsors added yet. Click &apos;Add Sponsor&apos; to specify a funding sponsor.
                    </p>
                  )}

                  {sponsorFields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Sponsor Name"
                          className="text-xs"
                          {...form.register(`self_supports.${idx}.name`)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Amount (₹)"
                          className="text-xs"
                          {...form.register(`self_supports.${idx}.amount`, { valueAsNumber: true })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-8 shrink-0"
                          onClick={() => removeSponsor(idx)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-xs pt-2 border-t font-semibold">
                    <span>Total Sponsor Fund:</span>
                    <span>₹{totalSponsorFunds.toFixed(2)}</span>
                  </div>

                  {isOverBudget && (
                    <div className="p-2.5 rounded border border-red-300 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <IconAlertCircle className="size-4" />
                        <span>Sponsor funding (₹{totalSponsorFunds.toFixed(2)}) is less than total cost (₹{totalCost.toFixed(2)}).</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
    </Card>
  );
}
