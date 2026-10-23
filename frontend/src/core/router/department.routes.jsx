import {
  IconKey,
  IconLogout2,
  IconUser,
  IconLayoutDashboard,
  IconCreditCard,
  IconReceipt,
  IconPlus,
  IconClipboardList,
} from "@tabler/icons-react";
import { Navigate } from "react-router-dom";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import DepartmentOrdersPage from "@/pages/order/department-orders";
import OrderCreation from "@/pages/order-creation/order-creation";
import Credits from "@/pages/credits/credits";
import Bill from "@/pages/bill/bill";

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
      path: "/department_admin/order-creation",
      label: "Create Order",
      title: "Create Requisition Order",
      description: "Create an Event Order or Xerox Order",
      element: <OrderCreation />,
      icon: <IconPlus className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/order",
      label: "Orders",
      title: "Department Orders",
      description: "View and track department Event and Xerox printing orders",
      element: <DepartmentOrdersPage />,
      icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/event-order",
      label: "Event Orders",
      title: "Event Orders",
      description: "Redirect to Orders",
      element: <Navigate to="/department_admin/order?tab=event" replace />,
      hidden: true,
    },
    {
      path: "/department_admin/xerox-order",
      label: "Xerox Orders",
      title: "Xerox Orders",
      description: "Redirect to Orders",
      element: <Navigate to="/department_admin/order?tab=xerox" replace />,
      hidden: true,
    },
    {
      path: "/department_admin/credits",
      label: "Credit Tracker",
      title: "Credit Tracking & Balances",
      description: "Track credit allocations, department spending, user spending, and credit payments.",
      icon: <IconCreditCard className="h-5 w-5 shrink-0" />,
      element: <Credits />,
    },
    {
      path: "/department_admin/bill",
      label: "Bills",
      title: "Billing & Invoices",
      description: "View, manage, and track all generated bills and invoices.",
      icon: <IconReceipt className="h-5 w-5 shrink-0" />,
      element: <Bill />,
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
      path: "/department_admin/changepassword",
      label: "Change Password",
      title: "Change Password",
      description: "Update your administrator password",
      element: <ChangePassword />,
      icon: <IconKey className="h-5 w-5 shrink-0" />,
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
