import Department from "@/pages/department/department";

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
];