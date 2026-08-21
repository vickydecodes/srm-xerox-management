import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "@/core/contexts/api.context";
import { useLoader } from "@/core/hooks/useLoader";
import { useAuth } from "@/core/contexts/auth.context";
import { useAction } from "@/core/hooks/useAction";
import { Button } from "@/components/ui/button";
import { BillForm } from "@/modules/bill/bill.form";
import { defaultBillValues } from "@/modules/bill/bill.schema";
import { useBillStore } from "@/modules/bill/bill.store";
import { printBillPdf } from "@/modules/bill/bill.coulmns";

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
  const { search } = useLocation();
  const { user } = useAuth();
  const { usePageAction } = useAction();
  const { inventoryProducts, services, bills, orders } = useApi();
  const { createPreset } = useLoader();

  const [editingBill, setEditingBill] = useState(null);
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [orderContext, setOrderContext] = useState(null);
  const currentEntity = useBillStore((state) => state.current);

  const queryParams = new URLSearchParams(search);
  const orderId = queryParams.get("orderId");

  usePageAction({
    edit: (bill) => {
      setEditingBill(bill);
      setOrderContext({
        code: bill.order?.code || "",
        purpose: bill.order?.purpose || "",
        branchName: typeof bill.branch === "object" ? bill.branch?.name : "",
        departmentName: typeof bill.department === "object" ? bill.department?.name : "",
      });
    },
  });

  const loadPageModules = createPreset(inventoryProducts, services);

  useEffect(() => {
    loadPageModules();
  }, []);

  useEffect(() => {
    if (currentEntity && !currentEntity.paymentMethod && !editingBill) {
      setPrefilledValues({
        paymentMethod: "credit",
        status: "unpaid",
        branch: typeof currentEntity.branch === "object" ? currentEntity.branch?._id : currentEntity.branch || "",
        department: typeof currentEntity.department === "object" ? currentEntity.department?._id : currentEntity.department || "",
        discount: 0,
        tax: 0,
        order: currentEntity._id,
        items: currentEntity.items.map((item) => ({
          type: item.type,
          item: typeof item.item === "object" ? item.item?._id : item.item,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      setOrderContext({
        code: currentEntity.code || "",
        purpose: currentEntity.purpose || "",
        branchName: typeof currentEntity.branch === "object" ? currentEntity.branch?.name : "",
        departmentName: typeof currentEntity.department === "object" ? currentEntity.department?.name : "",
      });
      useBillStore.getState().clearCurrent();
    } else if (orderId) {
      const fetchOrder = async () => {
        try {
          const order = await orders.crud.getOne(orderId);
          setPrefilledValues({
            paymentMethod: "credit",
            status: "unpaid",
            branch: typeof order.branch === "object" ? order.branch?._id : order.branch || "",
            department: typeof order.department === "object" ? order.department?._id : order.department || "",
            discount: 0,
            tax: 0,
            order: order._id,
            items: order.items.map((item) => ({
              type: item.type,
              item: typeof item.item === "object" ? item.item?._id : item.item,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          });
          setOrderContext({
            code: order.code || "",
            purpose: order.purpose || "",
            branchName: typeof order.branch === "object" ? order.branch?.name : "",
            departmentName: typeof order.department === "object" ? order.department?.name : "",
          });
        } catch (err) {
          console.error("Failed to fetch order for billing prefill", err);
        }
      };
      fetchOrder();
    }
  }, [currentEntity, orderId, editingBill]);

  const handleSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        paymentMethod: data.paymentMethod.toUpperCase(),
        status: data.status.toUpperCase(),
      };
      
      const targetOrderId = prefilledValues?.order || orderId;
      if (targetOrderId) {
        payload.order = targetOrderId;
      }

      if (editingBill) {
        await bills.crud.edit(editingBill._id, payload);
        navigate(`/${user.role}/bills`);
      } else {
        const newBill = await bills.create(payload);
        if (newBill && newBill._id) {
          printBillPdf(newBill._id, newBill.code);
        }
        navigate(`/${user.role}/bill`);
      }
    } catch {
      // errors handled by CRUD layer
    }
  };

  const formValues = editingBill
    ? getFormDefaultValues(editingBill)
    : prefilledValues
    ? prefilledValues
    : defaultBillValues;

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
        defaultValues={formValues}
        onSubmit={handleSubmit}
        isEdit={!!editingBill}
        orderContext={orderContext}
        loading={bills.loading?.create || bills.loading?.edit || false}
      />
    </div>
  );
}
