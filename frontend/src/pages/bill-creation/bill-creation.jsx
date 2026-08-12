import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useAuth } from "@/core/contexts/auth.context";
import { useAction } from "@/core/hooks/useAction";
import { Button } from "@/components/ui/button";
import { BillForm } from "@/modules/bill/bill.form";
import { defaultBillValues } from "@/modules/bill/bill.schema";

const getFormDefaultValues = (bill) => {
  if (!bill) return defaultBillValues;
  return {
    paymentMethod: bill.paymentMethod?.toLowerCase() || 'cash',
    status: bill.status === 'PAID' ? 'paid' : 'unpaid',
    branch: typeof bill.branch === 'object' ? bill.branch?._id : bill.branch || '',
    department: typeof bill.department === 'object' ? bill.department?._id : bill.department || '',
    discount: bill.discount || 0,
    tax: bill.tax || 0,
    items: bill.items.map((item) => ({
      type: item.type,
      item: typeof item.item === 'object' ? item.item?._id : item.item,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };
};

export default function BillCreation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usePageAction } = useAction();
  const { inventoryProducts, services, departments, branches, bills } = useApi();
  const { createPreset } = useLoader();

  const [editingBill, setEditingBill] = useState(null);

  usePageAction({
    edit: (bill) => {
      setEditingBill(bill);
    },
  });

  const loadPageModules = createPreset(inventoryProducts, services, departments, branches);

  useEffect(() => {
    loadPageModules();
  }, []);

  const handleSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        paymentMethod: data.paymentMethod.toUpperCase(),
        status: data.status.toUpperCase(),
      };
      
      if (editingBill) {
        await bills.crud.edit(editingBill._id, payload);
        navigate(`/${user.role}/bills`);
      } else {
        await bills.create(payload);
      }
    } catch {
      // errors handled by CRUD layer
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {editingBill ? `Edit Bill - ${editingBill.code}` : "Create Bill"}
        </h2>
        {editingBill && (
          <Button
            variant="outline"
            onClick={() => navigate(`/${user.role}/bills`)}
          >
            Cancel Edit
          </Button>
        )}
      </div>
      <BillForm
        inventoryProducts={inventoryProducts.state}
        services={services.state}
        branches={branches.state}
        departments={departments.state}
        defaultValues={getFormDefaultValues(editingBill)}
        onSubmit={handleSubmit}
        isEdit={!!editingBill}
        loading={bills.loading?.create || bills.loading?.edit || false}
      />
    </div>
  );
}
