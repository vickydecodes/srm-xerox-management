import {
  IconReceipt,
  IconLogout2,
  IconCalculator,
  IconKey,
  IconUser,
  IconLayoutDashboard,
  IconClipboardList,
  IconSettings,
  IconCalendarEvent,
  IconPrinter,
  IconPackages,
} from "@tabler/icons-react";

import Bill from "@/pages/bill/bill";
import BillCreation from "@/pages/bill-creation/bill-creation";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import Redirect from "./redirect";
import EventOrder from "@/pages/event-order/event-order";
import XeroxOrder from "@/pages/xerox-order/xerox-order";
import OrdersPage from "@/pages/order/orders";
import InventoryProduct from "@/pages/inventory-product/inventory-product";
import Settings from "@/pages/settings/settings"; 


export const shopAdminRoutes = {
  role: "shop_admin",
  routes: [
    
    {
      path: "/shop_admin/",
      label: "Dashboard",
      title: "Dashboard",
      description: "Overview of shop billing and inventory.",
      element: <Dashboard />,
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/shop_admin/bill-creation",
      label: "Create bill",
      title: "Create bill with existing products and services",
      description: "Create bill with existing products and services",
      icon: <IconCalculator className="h-5 w-5 shrink-0" />,
      element: <BillCreation />,
    },
    {
      path: "/shop_admin/bill",
      label: "Bill Page",
      title: "Bill Page",
      description: "This is the bill page",
      icon: <IconReceipt className="h-5 w-5 shrink-0" />,
      element: <Bill />,
    },
    {
      path: "/shop_admin/inventory",
      label: "Inventory",
      title: "Inventory Management",
      description: "Manage inventory items, stock levels, and product availability.",
      icon: <IconPackages className="h-5 w-5 shrink-0" />,
      element: <InventoryProduct />,
    },
    {
      path: "/shop_admin/order",
      label: "Orders",
      title: "Shop Orders",
      description: "View and fulfill approved department Event and Xerox printing orders",
      element: (
        <OrdersPage
          title="Orders"
          description="View and fulfill approved department Event and Xerox printing orders"
        />
      ),
      icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/shop_admin/event-order",
      label: "Event Orders",
      title: "Event Orders",
      description: "Redirect to Orders",
      element: <Redirect to="/shop_admin/order?tab=event" />,
      hidden: true,
    },
    {
      path: "/shop_admin/xerox-order",
      label: "Xerox Orders",
      title: "Xerox Orders",
      description: "Redirect to Orders",
      element: <Redirect to="/shop_admin/order?tab=xerox" />,
      hidden: true,
    },
    {
      path: "/shop_admin/changepassword",
      label: "Change Password",
      title: "Change Password",
      description: "Update your administrator password",
      element: <ChangePassword />,
      icon: <IconKey className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/shop_admin/profile",
      label: "Profile",
      title: "User Profile",
      description: "View and manage your profile details",
      element: <Profile />,
      icon: <IconUser className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/shop_admin/settings",
      label: "Settings",
      title: "System Settings",
      description: "Manage global SRM college system configuration.",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
      element: <Settings />,
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
