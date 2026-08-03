import {
  IconBoxSeam,
  IconBuildingCommunity,
  IconClipboardList,
  IconReceipt,
  IconGitBranch,
  IconLogout2,
} from '@tabler/icons-react';

import Department from "@/pages/department/department";
import Service from "@/pages/service/service";
import Product from "@/pages/product/product";
import Bill from "@/pages/bill/bill";
import Branch from "@/pages/branch/branch";

// app.routes.jsx
export const appRoutes = [
    {
        path: '/product',
        label: 'Product page',
        title: 'Product page',
        description: 'Product page is the product page',
        icon: <IconBoxSeam className="h-5 w-5 shrink-0" />,
        element: <Product/>,
    },
    {
        path: '/',
        label: 'Department',
        title: 'Department Page',
        description: 'Manage departments and their details',
        element: <Department/>,
    },
    {
        path: '/services',
        label: 'Services',
        title: 'Services',
        description: 'Manage services offered',
        icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
        element: <Service/>,
    },
    {
        path: '/bill',
        label: 'Bill Page',
        title: 'Bill Page',
        description: 'This is the bill page',
        icon: <IconReceipt className="h-5 w-5 shrink-0" />,
        element: <Bill/>,
    },
    {
        path: '/branch',
        label: 'Branch Page',
        title: 'Branch Page',
        description: 'This is the branch page',
        icon: <IconGitBranch className="h-5 w-5 shrink-0" />,
        element: <Branch/>,
    },
    {
    label: 'Logout',
    title: 'Logout',
    description: 'Sign out of your administrator account.',
    icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
    path: '/',
  },
];