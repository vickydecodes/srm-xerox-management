import Department from "@/pages/department/department";
import Service from "@/pages/service/service";

// app.routes.jsx
export const appRoutes = [
    {
        path: '/first-page',
        label: 'Home page',
        title: 'Home page',
        description: 'Home page is the home page',
        element: <div>Home page</div>
    }
    ,
    {
        path: '/',
        label: 'First Page',
        title: 'First Page',
        description: 'This is the first page',
        element: <Department/>,
    },
    {
        path: '/services',
        label: 'Services',
        title: 'Services',
        description: 'Manage services offered',
        element: <Service/>,
    },
];