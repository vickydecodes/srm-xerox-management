import {
  IconKey,
  IconLogout2,
  IconUser,
  IconLayoutDashboard,
  IconClipboardList,
  IconCreditCard,
  IconReceipt,
  IconCalendarEvent,
  IconPrinter,
  IconPlus,
} from "@tabler/icons-react";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import EventOrder from "@/pages/event-order/event-order";
import XeroxOrder from "@/pages/xerox-order/xerox-order";
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
      path: "/department_admin/event-order",
      label: "Event Orders",
      title: "Event Orders",
      description: "View and manage department event and work orders",
      element: <EventOrder />,
      icon: <IconCalendarEvent className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/xerox-order",
      label: "Xerox Orders",
      title: "Xerox Orders",
      description: "View and manage department xerox printing orders",
      element: <XeroxOrder />,
      icon: <IconPrinter className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/department_admin/order",
      label: "Orders",
      title: "Orders",
      description: "View orders",
      element: <EventOrder />,
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
