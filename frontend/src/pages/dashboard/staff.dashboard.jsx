import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/core/api/api.request";
import { apiurls } from "@/core/api/api.urls";
import { toast } from "sonner";
import {
  IconReceipt,
  IconCoin,
  IconCircleCheck,
  IconBox,
  IconClipboardList,
} from "@tabler/icons-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function StaffDashboard({ data, refreshData }) {
  const navigate = useNavigate();
  const stats = data?.stats || {};
  const methods = data?.paymentMethods || [];
  const bills = data?.recentBills || [];
  const monthlyRevenue = data?.monthlyRevenue || [];

  const currencyFormatter = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const kpis = [
    {
      title: "Your Revenue Generated",
      value: currencyFormatter(stats.totalRevenue),
      description: "Your checkout sales value",
      icon: <IconCoin className="w-6 h-6 text-emerald-500" />,
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Your Bills",
      value: stats.totalBills,
      description: "Invoice count created by you",
      icon: <IconReceipt className="w-6 h-6 text-primary" />,
      bgColor: "bg-primary/10",
    },
    {
      title: "Paid Invoices",
      value: stats.totalPaidBills,
      description: "Completed cash/UPI receipts",
      icon: <IconCircleCheck className="w-6 h-6 text-indigo-500" />,
      bgColor: "bg-indigo-500/10",
    },
  ];

  const quickActions = [
    {
      title: "Create Invoice",
      subtitle: "Open checkout counter",
      icon: <IconReceipt className="w-5 h-5" />,
      path: "/staff/bill-creation",
    },
    {
      title: "Product Stock",
      subtitle: "Review item availability",
      icon: <IconBox className="w-5 h-5" />,
      path: "/staff/product",
    },
    {
      title: "Service Catalog",
      subtitle: "View service pricing sheet",
      icon: <IconClipboardList className="w-5 h-5" />,
      path: "/staff/services",
    },
  ];

  const handleMarkAsPaid = async (billId, paymentMethod) => {
    try {
      const url = apiurls.bills.edit.url(billId);
      const res = await apiRequest("put", url, { status: "PAID", paymentMethod });
      if (res.success) {
        toast.success(`Bill marked as PAID via ${paymentMethod}!`);
        if (refreshData) refreshData();
      } else {
        toast.error(res.message || "Failed to update bill status");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleCancelBill = async (billId) => {
    try {
      const url = apiurls.bills.edit.url(billId);
      const res = await apiRequest("put", url, { status: "CANCELLED" });
      if (res.success) {
        toast.success("Bill cancelled successfully.");
        if (refreshData) refreshData();
      } else {
        toast.error(res.message || "Failed to cancel bill");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    }
  };

  // Monthly revenue trend data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = monthlyRevenue.length > 0 
    ? monthlyRevenue.map(m => ({
        name: `${monthNames[m.month - 1]} ${m.year}`,
        Revenue: m.revenue,
      }))
    : [{ name: "No Data", Revenue: 0 }];

  // Payment methods breakdown data
  const pieData = methods.length > 0
    ? methods.map(m => ({
        name: m.method.toUpperCase(),
        value: m.amount,
      }))
    : [{ name: "No Payments", value: 1 }];

  const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899"];

  // Efficiency calculation
  const efficiency = stats.totalBills > 0 ? Math.round((stats.totalPaidBills / stats.totalBills) * 100) : 0;
  const unpaidCount = stats.totalBills - stats.totalPaidBills;
  const avgBillValue = stats.totalPaidBills > 0 ? Math.round(stats.totalRevenue / stats.totalPaidBills) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions Panel */}
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="p-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Activities</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-bold">
            {quickActions.map((act, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => navigate(act.path)}
                className="flex items-center gap-3 justify-start p-4 h-auto cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition duration-200"
              >
                <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                  {act.icon}
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-foreground leading-none mb-1">{act.title}</span>
                  <span className="block text-[11px] text-muted-foreground font-medium leading-none">{act.subtitle}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {kpis.map((card, i) => (
          <Card key={i} className="border border-border shadow-sm bg-card hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{card.title}</span>
                <h3 className="text-2xl font-extrabold text-foreground tracking-tight leading-none">{card.value}</h3>
                <p className="text-[11px] text-muted-foreground font-medium pt-0.5">{card.description}</p>
              </div>
              <div className={`p-3 rounded-2xl ${card.bgColor} shrink-0`}>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2) for Main Trends & Invoice Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Trend Chart */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconCoin className="w-5 h-5 text-primary" />
                Your Sales Performance Trend
              </CardTitle>
              <CardDescription>Your monthly checkout sales value over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground, #888888)" />
                    <YAxis stroke="var(--color-muted-foreground, #888888)" tickFormatter={val => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ background: "var(--color-card, #ffffff)", borderColor: "var(--color-border, #e2e8f0)", borderRadius: "8px" }}
                      formatter={(val) => [currencyFormatter(val), "Revenue"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="var(--color-primary, #3b82f6)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <IconReceipt className="w-5 h-5 text-primary" />
                  Your Recent Invoices
                </CardTitle>
                <CardDescription>Invoices generated by you under your operator account.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/staff/bill")}
                className="text-xs font-bold cursor-pointer"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {bills.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No recent invoices logged by you.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-y border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Branch/Dept</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr key={b._id} className="border-b border-border hover:bg-muted/10 transition text-sm">
                        <td className="py-3 px-4 font-bold text-foreground">{b.code}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-semibold">
                          {b.branch?.name || "Global"}{b.department ? ` / ${b.department.name}` : ""}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold uppercase text-muted-foreground">{b.paymentMethod || "N/A"}</td>
                        <td className="py-3 px-4 font-extrabold text-foreground">{currencyFormatter(b.total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : b.status === "UNPAID"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }`}
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {b.status === "UNPAID" ? (
                            <div className="flex justify-center items-center gap-1">
                              <Button
                                size="xs"
                                onClick={() => handleMarkAsPaid(b._id, "UPI")}
                                className="text-[10px] h-6 px-1.5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                              >
                                Pay UPI
                              </Button>
                              <Button
                                size="xs"
                                onClick={() => handleMarkAsPaid(b._id, "CASH")}
                                className="text-[10px] h-6 px-1.5 bg-emerald-500 text-white font-bold hover:bg-emerald-600 cursor-pointer shadow-sm"
                              >
                                Cash
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                onClick={() => handleCancelBill(b._id)}
                                className="text-[10px] h-6 px-1.5 font-bold cursor-pointer shadow-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center text-xs text-muted-foreground font-semibold">-</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Columns (Span 1) for Payments & Personal KPIs */}
        <div className="space-y-6">
          
          {/* Recharts Payment Methods Donut */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconReceipt className="w-5 h-5 text-primary" />
                Payment Mode Split
              </CardTitle>
              <CardDescription>Distribution share of paid transactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-56 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: "var(--color-card, #ffffff)", borderColor: "var(--color-border, #e2e8f0)", borderRadius: "8px" }}
                      formatter={(val) => [currencyFormatter(val), "Amount"]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" className="text-xs" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Personal Performance Targets Widget */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconCircleCheck className="w-5 h-5 text-primary" />
                Billing metrics
              </CardTitle>
              <CardDescription>Your personal checkout collections summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Payment Collection Rate</span>
                  <span className="text-foreground">{efficiency}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${efficiency}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-muted/40 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Avg Order Value</span>
                  <span className="block text-sm font-extrabold text-foreground">{currencyFormatter(avgBillValue)}</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Unpaid Invoices</span>
                  <span className="block text-sm font-extrabold text-amber-500">{unpaidCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
