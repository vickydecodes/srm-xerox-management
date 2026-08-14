import { useState } from "react";
import { useAuth } from "@/core/contexts/auth.context";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconHash,
  IconShield,
  IconCalendar,
  IconCopy,
  IconCheck,
  IconKey,
  IconGitBranch,
  IconCircleCheck,
  IconFingerprint,
  IconActivity,
  IconBuilding,
} from "@tabler/icons-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const handleCopyLoginId = () => {
    if (user?.login_id) {
      navigator.clipboard.writeText(user.login_id);
      setCopied(true);
      toast.success("Login ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "branch_admin":
        return "Branch Admin";
      case "department_admin":
        return "Department Admin";
      case "shop_admin":
        return "Shop Admin";
      case "staff":
        return "Staff Member";
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "super_admin":
        return "default";
      case "branch_admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case "super_admin":
        return "Complete administrative control over all branches, users, billing metrics, inventory catalogs, and system configurations.";
      case "branch_admin":
        return "Oversees operational structures, department assignments, and administrative roles associated with the assigned branch.";
      case "department_admin":
        return "Responsible for managing product inventory, workflow policies, and personnel assigned to the department.";
      case "shop_admin":
        return "Manages local shop stock records, processes billing logs, and coordinates daily register sales.";
      case "staff":
        return "Authorized to create customer invoices, lookup product pricing, and coordinate general services.";
      default:
        return "Standard operational authorization role.";
    }
  };

  const getRoleCapabilities = (role) => {
    switch (role) {
      case "super_admin":
        return [
          "Full System Configuration",
          "Create and Manage Branches",
          "Manage Branch & Shop Admins",
          "Global Product & Service Catalog",
          "Access All Billing Logs & Analytics",
          "System Security & Password Resets",
        ];
      case "branch_admin":
        return [
          "Manage Assigned Branch Settings",
          "Manage Departments within Branch",
          "Create & Manage Department Admins",
          "View Branch-wide Billing Reports",
          "Monitor Branch Inventory Levels",
        ];
      case "department_admin":
        return [
          "Manage Department Operations",
          "Assign Staff Members to Department",
          "Configure Department Catalog Settings",
          "View Department Sales Reports",
        ];
      case "shop_admin":
        return [
          "Manage Shop Inventory & Stock",
          "Generate Billing & Invoices",
          "Update Product Availability Status",
          "Manage Daily Cash Register Logs",
        ];
      case "staff":
        return [
          "Create Invoices & Bills",
          "View Product and Service Prices",
          "Update Inventory Stock Levels",
          "Access Assigned Department Register",
        ];
      default:
        return ["General System Access"];
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const getAvatarInitials = () => {
    if (!user.name) return "";
    const nameLower = user.name.toLowerCase().trim();
    if (nameLower === "super admin" || nameLower === "superadmin") {
      return "SA";
    }
    const parts = user.name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* V6: Centered Minimalist Stack Header */}
      <Card className="relative overflow-hidden border border-border shadow-sm bg-card animate-in fade-in duration-200">
        <CardContent className="pt-8 pb-8 px-6 md:px-8 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-4xl font-extrabold shadow-md transition-all duration-300 group-hover:scale-105 select-none ring-4 ring-primary/10">
              {getAvatarInitials() || <IconUser className="w-12 h-12" />}
            </div>
            <div className="absolute bottom-1 right-1 bg-primary h-5 w-5 rounded-full border-2 border-card animate-pulse shadow-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight leading-none">{user.name}</h1>
              <Badge variant={getRoleBadgeVariant(user.role)} className="px-2.5 py-0.5 capitalize text-xs font-bold">
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
              <IconMail className="w-4 h-4 text-primary shrink-0" />
              {user.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Details and Side Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Detailed Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border border-border bg-card">
            <CardHeader className="px-6 md:px-8 pt-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <IconUser className="w-5.5 h-5.5 text-primary" />
                Personal Profile Information
              </CardTitle>
              <CardDescription>Verified system credentials and contact records.</CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 md:px-8 pb-8 space-y-6">
              {/* Details Boxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Login ID Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/40 hover:border-primary/20 transition duration-200 group/item">
                  <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition duration-300">
                    <IconHash className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Login ID</span>
                    <div className="flex items-center justify-between gap-2 mt-0.5 relative">
                      <span className="font-extrabold text-foreground truncate select-all">{user.login_id}</span>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition cursor-pointer shrink-0"
                          onClick={handleCopyLoginId}
                          title="Copy Login ID"
                        >
                          {copied ? <IconCheck className="w-4 h-4 text-primary" /> : <IconCopy className="w-4 h-4" />}
                        </Button>
                        {copied && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded shadow-md font-semibold whitespace-nowrap animate-in fade-in duration-200">
                            Copied!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Role Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/40 hover:border-primary/20 transition duration-200 group/item">
                  <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition duration-300">
                    <IconShield className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Access Role</span>
                    <p className="font-extrabold text-foreground capitalize mt-0.5 truncate">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>

                {/* Phone Number Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/40 hover:border-primary/20 transition duration-200 group/item">
                  <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition duration-300">
                    <IconPhone className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Phone Number</span>
                    <p className="mt-0.5">
                      <a href={`tel:${user.phone}`} className="font-extrabold text-primary hover:underline transition truncate block">
                        {user.phone}
                      </a>
                    </p>
                  </div>
                </div>

                {/* Assigned Branch Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/40 hover:border-primary/20 transition duration-200 group/item">
                  <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition duration-300">
                    <IconBuilding className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Assigned Branch</span>
                    <p className="font-extrabold text-foreground mt-0.5 truncate">
                      {user.branch?.name || "Main Headquarters (Global)"}
                    </p>
                  </div>
                </div>

              </div>

              {/* Address Box */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/50 border border-border/40 hover:border-primary/20 transition duration-200 group/item">
                <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition duration-300 shrink-0">
                  <IconMapPin className="w-5.5 h-5.5" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Residential Address</span>
                  <p className="text-foreground font-bold mt-1 leading-relaxed">
                    {user.address || "No residential address specified in record."}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Capabilities Card */}
          <Card className="shadow-md border border-border bg-card">
            <CardHeader className="px-6 md:px-8 pt-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <IconFingerprint className="w-5.5 h-5.5 text-primary" />
                Access Scope & Capabilities
              </CardTitle>
              <CardDescription>
                Your security clearance grants the following administrative capabilities within the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 md:px-8 pb-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getRoleDescription(user.role)}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {getRoleCapabilities(user.role).map((cap, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <IconCircleCheck className="w-5 h-5 text-primary shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Security Actions */}
        <div className="space-y-6">
          
          {/* Status Details Card */}
          <Card className="shadow-md border border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconActivity className="w-5 h-5 text-primary" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-muted-foreground">Operational Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Active
                </span>
              </div>
              
              <Separator />

              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <IconCalendar className="w-4 h-4 text-primary" />
                  Member Since
                </span>
                <p className="text-sm font-extrabold text-foreground">
                  {formattedDate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Action Cards */}
          <Card className="shadow-md border border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconKey className="w-5 h-5 text-primary" />
                Account Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep your access secure by updating your credentials regularly. When updating, you will be prompted to re-authenticate.
              </p>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 cursor-pointer font-bold py-5 hover:bg-primary/5 hover:text-primary hover:border-primary transition duration-200"
                onClick={() => navigate(`/${user.role}/changepassword`)}
              >
                <IconKey className="w-4 h-4 shrink-0" />
                Change Password
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
