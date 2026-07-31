import Department from "@/pages/department/department";
import Product from "@/pages/product/product";
import Bill from "@/pages/bill/bill";

// app.routes.jsx
export const appRoutes = [
    {
        path: '/Product',
        label: 'Product page',
        title: 'Product page',
        description: 'Product page is the product page',
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
    {
        path: '/bill',
        label: 'Bill Page',
        title: 'Bill Page',
        description: 'This is the bill page',
        element: <Bill/>,
    },
];