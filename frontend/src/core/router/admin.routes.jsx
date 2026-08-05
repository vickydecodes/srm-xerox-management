import {
    IconBoxSeam,
    IconBuildingCommunity,
    IconClipboardList,
    IconReceipt,
    IconGitBranch,
    IconLogout2,
    IconFileInvoice,
    IconPackages
} from '@tabler/icons-react';

import Department from "@/pages/department/department";
import Service from "@/pages/service/service";
import Product from "@/pages/product/product";
import Bill from "@/pages/bill/bill";
import Branch from "@/pages/branch/branch";
import BillCreation from '@/pages/bill-creation/bill-creation';
import InventoryProduct from '@/pages/inventory-product/inventory-product';

export const adminRoutes = {
    role: 'super_admin',
    routes: [
       {
    path: '/super_admin/bill-creation',
    label: 'Create Bill',
    title: 'Bill Creation',
    description: 'Generate invoices by selecting existing products and services.',
    icon: <IconFileInvoice className="h-5 w-5 shrink-0" />,
    element: <BillCreation />
},
{
    path: '/super_admin/inventory',
    label: 'Inventory',
    title: 'Inventory Management',
    description: 'Manage inventory items, stock levels, and product availability.',
    icon: <IconPackages className="h-5 w-5 shrink-0" />,
    element: <InventoryProduct />
},
{
    path: '/super_admin/product',
    label: 'Products',
    title: 'Product Management',
    description: 'Create, update, and organize products available in the system.',
    icon: <IconBoxSeam className="h-5 w-5 shrink-0" />,
    element: <Product />,
},
{
    path: '/super_admin/department',
    label: 'Departments',
    title: 'Department Management',
    description: 'Manage departments, their details, and organizational structure.',
    icon: <IconBuildingCommunity className="h-5 w-5 shrink-0" />,
    element: <Department />,
},
{
    path: '/super_admin/services',
    label: 'Services',
    title: 'Service Management',
    description: 'Manage the services offered, including pricing and availability.',
    icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
    element: <Service />,
},
{
    path: '/super_admin/bill',
    label: 'Bills',
    title: 'Billing & Invoices',
    description: 'View, manage, and track all generated bills and invoices.',
    icon: <IconReceipt className="h-5 w-5 shrink-0" />,
    element: <Bill />,
},
{
    path: '/super_admin/branch',
    label: 'Branches',
    title: 'Branch Management',
    description: 'Manage business branches, locations, and branch information.',
    icon: <IconGitBranch className="h-5 w-5 shrink-0" />,
    element: <Branch />,
},
    ],
    logout: {
        label: 'Logout',
        title: 'Sign Out',
        description: 'Securely sign out of your administrator account.',
        icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
        path: '/',
    },
};