import {
    IconBoxSeam,
    IconBuildingCommunity,
    IconClipboardList,
    IconReceipt,
    IconGitBranch,
    IconLogout2,
    IconCalculator
} from '@tabler/icons-react';

import Bill from "@/pages/bill/bill";
import BillCreation from '@/pages/bill-creation/bill-creation';

export const shopAdminRoutes = {
    role: 'shop_admin',
    routes: [
        {
            path: '/shop_admin/bill-creation',
            label: 'Create bill',
            title: 'Create bill with existing products and services',
            description: 'Create bill with existing products and services',
            icon: <IconCalculator className="h-5 w-5 shrink-0" />,
            element: <BillCreation />
        },
        {
            path: '/shop_admin/bill',
            label: 'Bill Page',
            title: 'Bill Page',
            description: 'This is the bill page',
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