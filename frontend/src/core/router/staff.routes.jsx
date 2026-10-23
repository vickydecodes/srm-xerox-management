import {
  IconBoxSeam,
  IconClipboardList,
  IconReceipt,
  IconLogout2,
  IconKey,
  IconUser,
  IconLayoutDashboard,
  IconPackages,
  IconCalendarEvent,
  IconPrinter,
} from "@tabler/icons-react";
import Service from "@/pages/service/service";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Product from "@/pages/product/product";
import Bill from "@/pages/bill/bill";
import Dashboard from "@/pages/dashboard/dashboard";
import Redirect from "./redirect";
import EventOrder from "@/pages/event-order/event-order";
import XeroxOrder from "@/pages/xerox-order/xerox-order";
import OrdersPage from "@/pages/order/orders";
import InventoryProduct from "@/pages/inventory-product/inventory-product";

export const staffRoutes = {
  role: "staff",
  routes: [
    {
      path: "/staff/",
      label: "Dashboard",
      title: "Dashboard",
      description: "Overview of your invoices and billing activity.",
      element: <Dashboard />,
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/staff/product",
      label: "Products",
      title: "Products",
      description: "Manage your product inventory",
      icon: <IconBoxSeam className="h-5 w-5 shrink-0" />,
      element: <Product />,
    },
    {
      path: "/staff/services",
      label: "Services",
      title: "Services",
      description: "Manage services offered",
      icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
      element: <Service />,
    },
    {
      path: "/staff/inventory",
      label: "Inventory",
      title: "Inventory Management",
      description:
        "Manage inventory items, stock levels, and product availability.",
      icon: <IconPackages className="h-5 w-5 shrink-0" />,
      element: <InventoryProduct />,
    },
    
    // {
    //   path: "/staff/bill",
    //   label: "Bill Page",
    //   title: "Bill Page",
    //   description: "This is the bill page",
    //   icon: <IconReceipt className="h-5 w-5 shrink-0" />,
    //   element: <Bill />,
    // },
    {
      path: "/staff/order",
      label: "Orders",
      title: "Staff Orders",
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
      path: "/staff/event-order",
      label: "Event Orders",
      title: "Event Orders",
      description: "Redirect to Orders",
      element: <Redirect to="/staff/order?tab=event" />,
      hidden: true,
    },
    {
      path: "/staff/xerox-order",
      label: "Xerox Orders",
      title: "Xerox Orders",
      description: "Redirect to Orders",
      element: <Redirect to="/staff/order?tab=xerox" />,
      hidden: true,
    },
    {
      path: "/staff/changepassword",
      label: "Change Password",
      title: "Change Password",
      description: "Update your administrator password",
      element: <ChangePassword />,
      icon: <IconKey className="h-5 w-5 shrink-0" />,
    },
    {
      path: "/staff/profile",
      label: "Profile",
      title: "User Profile",
      description: "View and manage your profile details",
      element: <Profile />,
      icon: <IconUser className="h-5 w-5 shrink-0" />,
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
