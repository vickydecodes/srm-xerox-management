import { useEffect } from 'react';
import { useApi } from '@/core/contexts/api.context';
import { useLoader } from '@/core/hooks/useLoader';
import { BillForm } from '@/modules/bill/bill.form';

export default function BillCreation() {
  const { products, departments, branches, bills } = useApi();
  const { createPreset } = useLoader();

  // ASSUMPTION: dropped `bills` from the preset — a creation page doesn't
  // need the existing bills list, only products/branches/departments to
  // populate the selects.
  const loadPageModules = createPreset(products, departments, branches);

  useEffect(() => {
    loadPageModules();
  }, []);

  const handleSubmit = (data) => {
    bills.create(data);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Create bill</h1>
      <BillForm
        products={products.state}
        branches={branches.state}
        departments={departments.state}
        onSubmit={handleSubmit}
        loading={bills.loading}
      />
    </div>
  );
}