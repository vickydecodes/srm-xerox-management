

import { createContext, useContext } from 'react';
import { useDepartmentModule } from '@/modules/department';
import { useServiceModule } from '@/modules/service';   
import { useProductModule } from '@/modules/products';
import { useBillModule } from '@/modules/bill';
import { useBranchModule } from '@/modules/branch';
import { useInventoryProductModule } from '@/modules/inventory-product';
import { useBranchAdminModule } from "@/modules/branch-admin";



const ApiContext = createContext();

export const useApi = () => {
    const ctx = useContext(ApiContext);
    if (!ctx) {
        throw new Error('ApiContext must be used inside <ApiProvider>');
    }
    return ctx;
};

export const ApiProvider = ({ children }) => {
    const exported = {};


    const departmentModule = useDepartmentModule();
    const serviceModule = useServiceModule(exported);  
    const productModule = useProductModule();
    const billModule = useBillModule();
    const branchModule = useBranchModule();
    const inventoryProductModule = useInventoryProductModule(exported);
    const branchAdminModule = useBranchAdminModule(exported);


    Object.assign(exported, {
        departments: departmentModule,
        services: serviceModule,
        products: productModule,
        bills: billModule,
        branches: branchModule,
        inventoryProducts: inventoryProductModule,
        branchAdmins: branchAdminModule
    });

    



    return <ApiContext.Provider value={{ ...exported }}>{children}</ApiContext.Provider>;
};
