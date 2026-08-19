import { useEffect } from "react";
import { useAuth } from "@/core/contexts/auth.context";
import { useApi } from "@/core/contexts/api.context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { IconFileInvoice } from "@tabler/icons-react";

import SaDashboard from "./sa.dashboard";
import BaDashboard from "./ba.dashboard";
import DaDashboard from "./da.dashboard";
import ShopDashboard from "./shop.dashboard";
import StaffDashboard from "./staff.dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboard } = useApi();

  const fetchDashboard = () => {
    if (dashboard && user?.role) {
      dashboard.fetch(user.role);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role]);

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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome Banner */}
      <Card className="border border-border shadow-sm bg-card relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-secondary" />
        <CardContent className="py-6 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Hello, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back to your {getRoleLabel(user.role)} Dashboard. Here's a summary of the Xerox operational activities.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/${user.role}/bill-creation`)}
            className="flex items-center gap-2 cursor-pointer font-bold px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow transition duration-200"
          >
            <IconFileInvoice className="w-4.5 h-4.5" />
            New Invoice
          </Button>
        </CardContent>
      </Card>

      {/* Render the role-specific dashboard */}
      {renderRoleDashboard()}
    </div>
  );
}
