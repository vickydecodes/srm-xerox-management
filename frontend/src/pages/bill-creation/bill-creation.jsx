import { useApi } from '@/core/contexts/api.context'
import { useLoader } from '@/core/hooks/useLoader';
import { useEffect } from 'react';

export default function BillCreation() {

    const {products, departments, branches, bills} = useApi();

    const {createPreset} = useLoader();


    const bill_page_modules = createPreset(products, departments, branches, bills);


    
    
    useEffect(() => {
        bill_page_modules();
    }, [])


    console.log({
        products: products.state,
        departments: departments.state,
        branches: branches.state,
        bills: bills.state
    })

  return (
    <div>bill-creation</div>
  )
}
