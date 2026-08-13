import {
    IconBuildingCommunity,

    IconLogout2,
} from '@tabler/icons-react';

import Department from "@/pages/department/department";
import DepartmentAdmin from "@/pages/department-admin/department-admin";


export const branchAdminRoutes = {
    role: 'branch_admin',
    routes: [
        {
            path: '/branch_admin/',
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
    ],
    logout: {
        label: 'Logout',
        title: 'Logout',
        description: 'Sign out of your administrator account.',
        icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
        path: '/',
    },
};