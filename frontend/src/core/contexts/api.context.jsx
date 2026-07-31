/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext } from 'react';
import { useDepartmentModule } from '@/modules/department';
import { useProductModule } from '@/modules/products';
import { useBillModule } from '@/modules/bill';


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


    const departmentModule = useDepartmentModule()
    const productModule = useProductModule()
    const billModule = useBillModule()


    Object.assign(exported, {
        departments: departmentModule,
        products: productModule,
        bills: billModule
    });

    return <ApiContext.Provider value={{ ...exported }}>{children}</ApiContext.Provider>;
};
