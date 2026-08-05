import {
   
    IconLogout2,
} from '@tabler/icons-react';



export const departmentAdminRoutes = {
    role: 'department_admin',
    routes: [
       
    ],
    logout: {
        label: 'Logout',
        title: 'Logout',
        description: 'Sign out of your administrator account.',
        icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
        path: '/',
    },
};