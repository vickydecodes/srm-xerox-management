import { IconKey, IconLogout2, IconUser, IconLayoutDashboard, IconClipboardList, IconCreditCard } from "@tabler/icons-react";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import Order from "@/pages/order/order";
import Credits from "@/pages/credits/credits";

export const departmentAdminRoutes = {
  role: "department_admin",
  routes: [
    {
      path: "/department_admin/",
      label: "Dashboard",
      title: "Dashboard",
      description: "Overview of department billing and operations.",
      element: <Dashboard />,
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/changepassword",
      label: "Change Password",
      title: "Change Password",
      description: "Update your administrator password",
      element: <ChangePassword />,
      icon: <IconKey className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/profile",
      label: "Profile",
      title: "User Profile",
      description: "View and manage your profile details",
      element: <Profile />,
      icon: <IconUser className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/order",
      label: "Order",
      title: "Order Management",
      description: "View and manage department orders",
      element: <Order />,
      icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/credits",
      label: "Credit Tracker",
      title: "Credit Tracking & Balances",
      description: "Track credit allocations, department spending, user spending, and credit payments.",
      icon: <IconCreditCard className="h-5 w-5 shrink-0" />,
      element: <Credits />,
    },
  ],
  logout: {
    label: "Logout",
    title: "Logout",
    description: "Sign out of your administrator account.",
    icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
    path: "/",
  },
};
