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
  IconCreditCard,
} from "@tabler/icons-react";

export default function DaDashboard({ data, refreshData }) {
  const navigate = useNavigate();
  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const recentBills = data?.recentBills || [];

  const currencyFormatter = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const kpisMain = [
    {
      title: "Total Spent",
      value: currencyFormatter(stats.totalSpend || 0),
      description: "All-time departmental spending",
      icon: <IconCoin className="w-8 h-8 text-primary opacity-80" />,
    },
    {
      title: "Invoices Logged",
      value: stats.totalBills || 0,
      description: "Total checkout transactions",
      icon: <IconReceipt className="w-8 h-8 text-primary opacity-80" />,
    },
    {
      title: "Available Credit",
      value: currencyFormatter(stats.creditBalance || 0),
      description: "Remaining credit allocation",
      icon: <IconCoin className="w-8 h-8 text-emerald-500 opacity-80" />,
    },
    {
      title: "Credit Dues",
      value: currencyFormatter(stats.outstandingCredit || 0),
      description: "Unpaid department credit bills",
      icon: <IconClipboardList className="w-8 h-8 text-amber-500 opacity-80" />,
    },
  ];

  const kpisMinor = [
    { title: "Department Members", value: stats.users || 0, icon: <IconUsers className="w-5 h-5 text-primary" /> },
    { title: "Active Requisitions", value: stats.pendingOrders || 0, icon: <IconReceipt className="w-5 h-5 text-primary" /> },
  ];

  const quickActions = [
    { title: "View Requisitions", icon: <IconClipboardList className="w-5 h-5" />, path: "/department_admin/order" },
    { title: "View Credits", icon: <IconCreditCard className="w-5 h-5" />, path: "/department_admin/credits" },
    { title: "View Bills", icon: <IconReceipt className="w-5 h-5" />, path: "/department_admin/bill" },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
          
          {/* Recent Orders Table */}
          <div className="flex flex-col bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Recent Requisitions</h3>
                <p className="text-xs text-muted-foreground">Latest internal department orders.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground">
                    <th className="font-medium py-3 px-5">Order ID</th>
                    <th className="font-medium py-3 px-5">Type</th>
                    <th className="font-medium py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order, idx) => (
                    <tr key={order._id} className={`${idx !== recentOrders.length - 1 ? 'border-b border-border/40' : ''} hover:bg-muted/30 transition-colors`}>
                      <td className="py-3 px-5 font-medium">{order.code || order._id.slice(-6)}</td>
                      <td className="py-3 px-5 text-muted-foreground">{order.type || "N/A"}</td>
                      <td className="py-3 px-5 text-right">
                        <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0 h-5 rounded-md ${
                          order.status === "completed" ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                          order.status === "pending" ? "text-amber-600 border-amber-200 bg-amber-50" :
                          "text-blue-600 border-blue-200 bg-blue-50"
                        }`}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No recent requisitions logged.</div>}
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
        </div>

      </div>
    </div>
  );
}