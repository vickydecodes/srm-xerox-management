import {
    IconBuildingCommunity,
    IconKey,
    IconLogout2,
    IconUser,
    IconLayoutDashboard,
    IconClipboardList,
} from '@tabler/icons-react';

import Department from "@/pages/department/department";
import DepartmentAdmin from "@/pages/department-admin/department-admin";
import ChangePassword from "@/pages/changepassword/changepassword";
import Profile from "@/pages/profile/profile";
import Dashboard from "@/pages/dashboard/dashboard";
import Order from "@/pages/order/order";


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
            icon: <IconBuildingCommunity className="h-5 w-5 shrink-0" />
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
              path: "/branch_admin/order",
              label: "Orders",
              title: "Requisition Orders",
              description: "Review and approve department orders",
              element: <Order />,
              icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
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