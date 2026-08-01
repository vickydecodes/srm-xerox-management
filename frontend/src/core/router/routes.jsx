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
        element: <Product/>,
    }
    ,
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
        element: <Service/>,
    },
  {
      
        path: '/bill',
        label: 'Bill Page',
        title: 'Bill Page',
        description: 'This is the bill page',
        element: <Bill/>,
    },
    {
        path: '/branch',
        label: 'Branch Page',
        title: 'Branch Page',
        description: 'This is the branch page',
        element: <Branch/>,
    },
];