import {
    IconBuildingCommunity,
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
} from '@tabler/icons-react';

import Department from "@/pages/department/department";
import DepartmentAdmin from "@/pages/department-admin/department-admin";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import Redirect from "./redirect";
import EventOrder from "@/pages/event-order/event-order";
import XeroxOrder from "@/pages/xerox-order/xerox-order";
import OrderCreation from "@/pages/order-creation/order-creation";
import Credits from "@/pages/credits/credits";
import Bill from "@/pages/bill/bill";


export const branchAdminRoutes = {
    role: 'branch_admin',
    routes: [
        {
            path: '/branch_admin/',
            label: 'Dashboard',
            title: 'Dashboard',
            description: 'Overview of branch billing and operations.',
            element: <Dashboard />,
            icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />
        },
        {
            path: '/branch_admin/department',
            label: 'Department',
            title: 'Department Page',
            description: 'Manage departments and their details',
            element: <Department />,
            icon: <IconBuildingCommunity className="h-5 w-5 shrink-0" />
        },
        {
            path: '/branch_admin/department-admin',
            label: 'Department Admin',
            title: 'Department admin Page',
            description: 'Manage department admin and their details',
            element: <DepartmentAdmin />,
            icon: <IconUser className="h-5 w-5 shrink-0" />
        },
        {
              path: "/branch_admin/changepassword",
              label: "Change Password",
              title: "Change Password",
              description: "Update your administrator password",
              element: <ChangePassword />,
              icon: <IconKey className="h-5 w-5 shrink-0" />,
            },
            {
              path: "/branch_admin/profile",
              label: "Profile",
              title: "User Profile",
              description: "View and manage your profile details",
              element: <Profile />,
              icon: <IconUser className="h-5 w-5 shrink-0" />,
            },
            {
              path: "/branch_admin/event-order",
              label: "Event Orders",
              title: "Event Orders",
              description: "Review and approve department event and work orders",
              element: <EventOrder />,
              icon: <IconCalendarEvent className="h-5 w-5 shrink-0" />,
            },
            {
              path: "/branch_admin/xerox-order",
              label: "Xerox Orders",
              title: "Xerox Orders",
              description: "Redirect to Event Orders",
              element: <Redirect to="/branch_admin/event-order" />,
              hidden: true,
            },
            {
              path: "/branch_admin/order-creation",
              label: "Create Order",
              title: "Create Requisition Order",
              description: "Create an Event Order or Xerox Order",
              element: <OrderCreation />,
              icon: <IconPlus className="h-5 w-5 shrink-0" />,
              hidden: true,
            },
            {
              path: "/branch_admin/order",
              label: "Orders",
              title: "Orders",
              description: "Redirect to Event Orders",
              element: <Redirect to="/branch_admin/event-order" />,
              hidden: true,
            },
            {
              path: "/branch_admin/credits",
              label: "Credit Tracker",
              title: "Credit Tracking & Balances",
              description: "Track credit allocations, department spending, user spending, and credit payments.",
              icon: <IconCreditCard className="h-5 w-5 shrink-0" />,
              element: <Credits />,
            },
            {
              path: "/branch_admin/bill",
              label: "Bills",
              title: "Billing & Invoices",
              description: "View, manage, and track all branch bills and invoices.",
              icon: <IconReceipt className="h-5 w-5 shrink-0" />,
              element: <Bill />,
            },
    ],
    logout: {
        label: 'Logout',
        title: 'Logout',
        description: 'Sign out of your administrator account.',
        icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
        path: '/',
    },
};