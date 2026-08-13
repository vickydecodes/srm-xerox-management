import {
    IconBoxSeam,
    IconClipboardList,
    IconReceipt,
    IconLogout2,
    IconKey,
} from '@tabler/icons-react';
import Service from "@/pages/service/service";
import ChangePassword from "@/pages/changepassword/changepassword";
import Product from "@/pages/product/product";
import Bill from "@/pages/bill/bill";

export const staffRoutes = {
    role: 'staff',
    routes: [
        {
            path: '/staff/product',
            label: 'Product page',
            title: 'Product page',
            description: 'Product page is the product page',
            icon: <IconBoxSeam className="h-5 w-5 shrink-0" />,
            element: <Product />,
        },
        {
            path: '/staff/services',
            label: 'Services',
            title: 'Services',
            description: 'Manage services offered',
            icon: <IconClipboardList className="h-5 w-5 shrink-0" />,
            element: <Service />,
        },
        {
            path: '/staff/bill',
            label: 'Bill Page',
            title: 'Bill Page',
            description: 'This is the bill page',
            icon: <IconReceipt className="h-5 w-5 shrink-0" />,
            element: <Bill />,
        },
        {
              path: "/staff/changepassword",
              label: "Change Password",
              title: "Change Password",
              description: "Update your administrator password",
              element: <ChangePassword />,
              icon: <IconKey className="h-5 w-5 shrink-0" />,
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