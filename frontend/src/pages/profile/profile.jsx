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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  IconBuilding,
  IconGitBranch,
  IconShoppingCart,
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
          <p className="text-muted-foreground font-medium animate-pulse">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  const handleCopyLoginId = () => {
    if (!user?.login_id) return;
    navigator.clipboard.writeText(user.login_id);
    setCopied(true);
    toast.success("Login ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleLabel = (role) => {
    const map = {
      super_admin: "Super Admin",
      branch_admin: "Branch Admin",
      department_admin: "Department Admin",
      shop_admin: "Shop Admin",
      staff: "Staff Member",
    };
    return map[role] || role;
  };

  const getAvatarInitials = () => {
    if (!user.name) return "U";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const showBranch = user.role === "branch_admin";
  const showDepartment = user.role === "department_admin";
  const showShop = user.role === "shop_admin";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-md ring-4 ring-primary/10 mb-4">
            {getAvatarInitials()}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {getRoleLabel(user.role)}
            </Badge>
          </div>

          <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1.5">
            <IconMail className="w-4 h-4 shrink-0" />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[260px] cursor-default">
                    {user.email}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – Personal info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconUser className="w-5 h-5 text-primary" />
                Profile details
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Login ID */}
                <InfoRow
                  icon={<IconHash className="w-5 h-5" />}
                  label="Login ID"
                  value={
                    <div className="flex items-center gap-2 min-w-0">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-semibold truncate cursor-default">
                              {user.login_id || "—"}
                            </span>
                          </TooltipTrigger>
                          {user.login_id && (
                            <TooltipContent>
                              <p>{user.login_id}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {user.login_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copy login ID"
                          className="h-7 w-7 shrink-0"
                          onClick={handleCopyLoginId}
                        >
                          {copied ? (
                            <IconCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <IconCopy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  }
                />

                {/* Role */}
                <InfoRow
                  icon={<IconShield className="w-5 h-5" />}
                  label="Role"
                  value={getRoleLabel(user.role)}
                />

                {/* Phone */}
                <InfoRow
                  icon={<IconPhone className="w-5 h-5" />}
                  label="Phone"
                  value={
                    user.phone ? (
                      <a
                        href={`tel:${user.phone}`}
                        className="text-primary hover:underline font-semibold"
                      >
                        {user.phone}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />

                {/* Email */}
                <InfoRow
                  icon={<IconMail className="w-5 h-5" />}
                  label="Email"
                  value={user.email || "—"}
                />

                {/* Branch – branch_admin only */}
                {showBranch && (
                  <InfoRow
                    icon={<IconBuilding className="w-5 h-5" />}
                    label="Branch"
                    value={user.branch?.name || "Main Headquarters (Global)"}
                  />
                )}

                {/* Department – department_admin only */}
                {showDepartment && (
                  <InfoRow
                    icon={<IconGitBranch className="w-5 h-5" />}
                    label="Department"
                    value={user.department?.name || "Not assigned"}
                  />
                )}

                {/* Shop – shop_admin only */}
                {showShop && (
                  <InfoRow
                    icon={<IconShoppingCart className="w-5 h-5" />}
                    label="Shop"
                    value={user.shop?.name || "Not assigned"}
                  />
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <IconMapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                    Address
                  </p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-medium mt-1 leading-relaxed line-clamp-2 cursor-default">
                          {user.address || "No address provided"}
                        </p>
                      </TooltipTrigger>
                      {user.address && (
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="break-words">{user.address}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right – Status + security */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IconCalendar className="w-4 h-4 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {user.active !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Member since
                </p>
                <p className="text-sm font-semibold mt-1">{formattedDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IconKey className="w-4 h-4 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate(`/${user.role}/changepassword`)}
              >
                <IconKey className="w-4 h-4" />
                Change password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  const text =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : null;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
          {label}
        </p>

        {text ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-semibold text-sm mt-0.5 truncate cursor-default">
                  {text}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="break-words">{text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="font-semibold text-sm mt-0.5 truncate">{value}</div>
        )}
      </div>
    </div>
  );
}