import { useEffect, useState } from "react";
import { useAuth } from "@/core/contexts/auth.context";
import { useApi } from "@/core/contexts/api.context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { IconFileInvoice } from "@tabler/icons-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";

import SaDashboard from "./sa.dashboard";
import BaDashboard from "./ba.dashboard";
import DaDashboard from "./da.dashboard";
import ShopDashboard from "./shop.dashboard";
import StaffDashboard from "./staff.dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboard } = useApi();
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  const fetchDashboard = () => {
    if (dashboard && user?.role) {
      dashboard.fetch(user.role, dateRange);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role, dateRange]);

  const data = dashboard?.data;
  const loading = dashboard?.loading;

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

  const renderRoleDashboard = () => {
    const props = { data, refreshData: fetchDashboard };
    switch (user.role) {
      case "super_admin":
        return <SaDashboard {...props} />;
      case "branch_admin":
        return <BaDashboard {...props} />;
      case "department_admin":
        return <DaDashboard {...props} />;
      case "shop_admin":
        return <ShopDashboard {...props} />;
      case "staff":
        return <StaffDashboard {...props} />;
      default:
        return <p className="text-muted-foreground text-sm">No dashboard view defined for this role.</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 animate-in fade-in duration-300">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-semibold animate-pulse">Assembling dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1 text-left">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Hey, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getRoleLabel(user.role)} Dashboard
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button
            onClick={() => navigate(`/${user.role}/bill-creation`)}
            className="flex items-center gap-2 text-sm h-9 px-4 bg-foreground hover:bg-foreground/90 text-background rounded-md shadow-sm transition-colors"
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* Render the role-specific dashboard */}
      {renderRoleDashboard()}
    </div>
  );
}
