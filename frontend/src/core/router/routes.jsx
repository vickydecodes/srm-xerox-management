import Department from "@/pages/department/department";
import Product from "@/pages/product/product";

// app.routes.jsx
export const appRoutes = [
    {
        path: '/Product',
        label: 'Home page',
        title: 'Home page',
        description: 'Home page is the home page',
        element: <Product/>,
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