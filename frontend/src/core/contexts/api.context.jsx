

import { createContext, useContext } from 'react';
import { useDepartmentModule } from '@/modules/department';
import { useServiceModule } from '@/modules/service';   
import { useProductModule } from '@/modules/products';
import { useBillModule } from '@/modules/bill';
import { useBranchModule } from '@/modules/branch';
import { useInventoryProductModule } from '@/modules/inventory-product';


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


    Object.assign(exported, {
        departments: departmentModule,
        services: serviceModule,
        products: productModule,
        bills: billModule,
        branches: branchModule,
        inventoryProducts: inventoryProductModule
    });

    



    return <ApiContext.Provider value={{ ...exported }}>{children}</ApiContext.Provider>;
};
