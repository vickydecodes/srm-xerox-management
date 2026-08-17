

import { createContext, useContext } from 'react';
import { useDepartmentModule } from '@/modules/department';
import { useServiceModule } from '@/modules/service';   
import { useProductModule } from '@/modules/products';
import { useBillModule } from '@/modules/bill';
import { useBranchModule } from '@/modules/branch';
import { useInventoryProductModule } from '@/modules/inventory-product';
import { useSearchModule } from '@/modules/search';
import { useBranchAdminModule } from "@/modules/branch-admin";
import { useShopAdminModule } from "@/modules/shop-admin";
import { useStaffModule } from "@/modules/staff-admin";
import { useDepartmentAdminModule } from "@/modules/department-admin";
import { useOrderModule } from "@/modules/order/order.module";
import { useCreditModule } from "@/modules/credits";



const ApiContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useApi = () => {
    const ctx = useContext(ApiContext);
    if (!ctx) {
        throw new Error('ApiContext must be used inside <ApiProvider>');
    }
    return ctx;
};

export const ApiProvider = ({ children }) => {
    const exported = {};


    const departmentModule = useDepartmentModule(exported);
    const serviceModule = useServiceModule(exported);  
    const productModule = useProductModule(exported);
    const billModule = useBillModule(exported);
    const branchModule = useBranchModule(exported);
    const inventoryProductModule = useInventoryProductModule(exported);
    const searchModule = useSearchModule(exported);
    const branchAdminModule = useBranchAdminModule(exported);
    const shopAdminModule = useShopAdminModule(exported);
    const staffModule = useStaffModule(exported);
    const departmentAdminModule = useDepartmentAdminModule(exported);
    const orderModule = useOrderModule(exported);
    const creditModule = useCreditModule(exported);


    Object.assign(exported, {
        departments: departmentModule,
        services: serviceModule,
        products: productModule,
        bills: billModule,
        branches: branchModule,
        inventoryProducts: inventoryProductModule,
        search: searchModule,
        branchAdmins: branchAdminModule,
        shopAdmins: shopAdminModule,
        staffs: staffModule,
        departmentAdmins: departmentAdminModule,
        orders: orderModule,
        credits: creditModule,
    });

    



    return <ApiContext.Provider value={{ ...exported }}>{children}</ApiContext.Provider>;
};
