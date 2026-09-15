import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconReceipt, IconCheck, IconX, IconLoader2, IconDownload } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function VerifyBill() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const apiUrl = import.meta.env.VITE_BASE_URL || '/api/v1';
        const res = await axios.get(`${apiUrl}/bills/public/${id}`);

        setBill(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Bill not found or invalid QR code');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  const currencyFormatter = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
              <IconX className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-red-600">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground pb-8">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-muted/20">
      <div className="w-full max-w-lg">
        {/* Verification Success Header */}
        <div className="flex flex-col items-center text-center mb-6 space-y-2 animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
            <IconCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Valid Digital Receipt</h1>
          <p className="text-sm text-muted-foreground">Issued by SRM Xerox Center</p>
        </div>

        {/* Receipt Card */}
        <Card className="w-full shadow-xl border-border/50 animate-in fade-in duration-700 delay-150">
          <CardHeader className="border-b border-dashed border-border pb-4 bg-muted/10 rounded-t-xl">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconReceipt className="w-5 h-5 text-primary" />
                  Invoice {bill.code}
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(bill.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </div>
              </div>
              <Badge variant="outline" className={`font-semibold ${bill.status === 'PAID' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                bill.status === 'UNPAID' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                  'text-red-600 border-red-200 bg-red-50'
                }`}>
                {bill.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Bill Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium text-right">{bill.department?.name || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-medium text-right">{bill.branch?.name || 'Main Campus'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{bill.paymentMethod || 'CASH'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Items Purchased</h4>
              <div className="space-y-3">
                {bill.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="space-y-0.5">
                      <p className="font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} x {currencyFormatter(item.price)}</p>
                    </div>
                    <div className="font-medium">
                      {currencyFormatter(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-dashed border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{currencyFormatter(bill.subtotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-{currencyFormatter(bill.discount)}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span>+{currencyFormatter(bill.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
                <span>Grand Total</span>
                <span className="text-primary">{currencyFormatter(bill.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Action (Optional) */}
        <div className="mt-8 text-center">
          <Button variant="outline" className="gap-2 shadow-sm" onClick={() => window.print()}>
            <IconDownload className="w-4 h-4" />
            Save as PDF
          </Button>
        </div>

      </div>
    </div>
  );
}
