import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/core/contexts/api.context";
import { toast } from "sonner";
import {
  IconBuildingCommunity,
  IconUsers,
  IconReceipt,
  IconCoin,
  IconClipboardList,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  Revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  Count: {
    label: "Count",
    color: "var(--primary)",
  },
};

export default function ShopAdminDashboard({ data, refreshData }) {
  const navigate = useNavigate();
  const stats = data?.stats || {};
  const recentBills = data?.recentBills || [];
  const topItems = data?.topItems || [];
  const monthlyRevenue = data?.monthlyRevenue || [];

  const currencyFormatter = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const kpisMain = [
    {
      title: "Shop Revenue",
      value: currencyFormatter(stats.totalRevenue || 0),
      description: "All-time local sales",
      icon: <IconCoin className="w-8 h-8 text-primary opacity-80" />,
    },
    {
      title: "Invoices Logged",
      value: stats.totalBills || 0,
      description: "Total shop transactions",
      icon: <IconReceipt className="w-8 h-8 text-primary opacity-80" />,
    },
    {
      title: "Print Queue",
      value: stats.pendingOrders || 0,
      description: "Active print requisitions",
      icon: <IconClipboardList className="w-8 h-8 text-blue-500 opacity-80" />,
    },
  ];

  const kpisMinor = [
    { title: "Active Staff", value: stats.staff || 0, icon: <IconUsers className="w-5 h-5 text-primary" /> },
  ];

  const quickActions = [
    { title: "Point of Sale", icon: <IconReceipt className="w-5 h-5" />, path: "/shop_admin/bill-creation" },
    { title: "Manage Staff", icon: <IconUsers className="w-5 h-5" />, path: "/shop_admin/staff" },
  ];

  // Data preps
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = monthlyRevenue.length > 0 
    ? monthlyRevenue.map(m => ({ name: `${monthNames[m.month - 1]} ${m.year}`, Revenue: m.revenue }))
    : [{ name: "No Data", Revenue: 0 }];

  const topItemsData = topItems.length > 0
    ? topItems.map(item => ({ name: item._id, Count: item.count, Revenue: item.revenue }))
    : [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Quick Actions Bar - Minimalist */}
      <div className="flex flex-wrap items-center gap-2">
        {quickActions.map((act, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => navigate(act.path)}
            className="flex items-center gap-2 text-xs font-medium h-8 border-border/60 shadow-none text-muted-foreground hover:text-foreground"
          >
            {React.cloneElement(act.icon, { className: "w-3.5 h-3.5" })}
            {act.title}
          </Button>
        ))}
      </div>

      {/* Main KPIs - Vercel Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {kpisMain.map((kpi, i) => (
          <div key={i} className="flex flex-col p-5 bg-card border border-border/60 rounded-lg shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">{kpi.title}</span>
              {React.cloneElement(kpi.icon, { className: "w-4 h-4 text-muted-foreground/50" })}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</h3>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          
          {/* Revenue Area Chart */}
          <div className="flex flex-col p-5 bg-card border border-border/60 rounded-lg shadow-sm">
            <div className="mb-4 space-y-1">
              <h3 className="text-sm font-medium text-foreground">Shop Revenue Trajectory</h3>
              <p className="text-xs text-muted-foreground">Local sales performance over the last 6 months.</p>
            </div>
            <div className="h-[250px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-Revenue)" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="var(--color-Revenue)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "var(--muted-foreground)"}} />
                  <YAxis tickFormatter={val => `₹${val}`} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "var(--muted-foreground)"}} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => currencyFormatter(value)} />} />
                  <Area type="monotone" dataKey="Revenue" stroke="var(--color-Revenue)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="flex flex-col bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Shop Activity</h3>
                <p className="text-xs text-muted-foreground">Latest invoices generated by your staff.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground">
                    <th className="font-medium py-3 px-5">Invoice</th>
                    <th className="font-medium py-3 px-5">Cashier</th>
                    <th className="font-medium py-3 px-5">Method</th>
                    <th className="font-medium py-3 px-5">Total</th>
                    <th className="font-medium py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.slice(0, 5).map((b, idx) => (
                    <tr key={b._id} className={`${idx !== recentBills.length - 1 ? 'border-b border-border/40' : ''} hover:bg-muted/30 transition-colors`}>
                      <td className="py-3 px-5 font-medium">{b.code}</td>
                      <td className="py-3 px-5 text-muted-foreground">{b.createdBy?.name || "System"}</td>
                      <td className="py-3 px-5 text-xs text-muted-foreground">{b.paymentMethod || "N/A"}</td>
                      <td className="py-3 px-5 font-medium">{currencyFormatter(b.total)}</td>
                      <td className="py-3 px-5 text-right">
                        <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0 h-5 rounded-md ${
                          b.status === "PAID" ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                          b.status === "UNPAID" ? "text-amber-600 border-amber-200 bg-amber-50" :
                          "text-red-600 border-red-200 bg-red-50"
                        }`}>
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentBills.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No recent invoices logged.</div>}
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-4 lg:space-y-6">
          
          {/* Minor KPIs Vertical Stack */}
          <div className="grid grid-cols-1 gap-4">
            {kpisMinor.map((kpi, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border/60 rounded-md text-muted-foreground">{React.cloneElement(kpi.icon, { className: "w-4 h-4" })}</div>
                  <span className="text-sm font-medium text-foreground">{kpi.title}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Top Items Bar Chart */}
          <div className="flex flex-col p-5 bg-card border border-border/60 rounded-lg shadow-sm">
            <div className="mb-4 space-y-1">
              <h3 className="text-sm font-medium text-foreground">Top Items</h3>
              <p className="text-xs text-muted-foreground">By quantity sold at this shop.</p>
            </div>
            <div className="h-[220px] w-full">
              {topItemsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No items sold.</div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={topItemsData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} tick={{fontSize: 11, fill: "var(--muted-foreground)"}} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="Count" fill="var(--color-Count)" radius={[0, 2, 2, 0]} maxBarSize={16} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
