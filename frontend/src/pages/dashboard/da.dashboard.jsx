import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/core/contexts/api.context";
import { toast } from "sonner";
import { useAuth } from "@/core/contexts/auth.context";
import {
  IconBuildingCommunity,
  IconUsers,
  IconReceipt,
  IconCoin,
  IconClipboardList,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

const chartConfig = {
  Revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  amount: {
    label: "Amount",
    color: "var(--primary)",
  },
  UPI: {
    label: "UPI",
    color: "var(--chart-1)",
  },
  CASH: {
    label: "CASH",
    color: "var(--chart-2)",
  },
  CARD: {
    label: "CARD",
    color: "var(--chart-3)",
  },
  CREDIT: {
    label: "CREDIT",
    color: "var(--chart-4)",
  },
};

export default function DaDashboard({ data, refreshData }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bills: billsModule, departments: departmentsModule } = useApi();
  const stats = data?.stats || {};
  const methods = data?.paymentMethods || [];
  const list = data?.departmentRevenue || [];
  const bills = data?.recentBills || [];
  const monthlyRevenue = data?.monthlyRevenue || [];

  const [deptCredit, setDeptCredit] = useState(null);
  const deptId = user?.department
    ? typeof user.department === "object"
      ? user.department._id
      : user.department
    : null;

  useEffect(() => {
    if (!deptId || !departmentsModule) return;
    departmentsModule.crud
      .getOne(deptId)
      .then((res) => setDeptCredit(res))
      .catch((err) => console.error("Error fetching department credit", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);

  const currencyFormatter = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const kpis = [
    {
      title: "Outstanding Credit",
      value: currencyFormatter(deptCredit?.outstandingCredit || 0),
      description: "Amount to be settled",
      icon: <IconCreditCard className="w-6 h-6 text-amber-600" />,
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Credit Balance",
      value: currencyFormatter(deptCredit?.creditBalance || 0),
      description: "Available advance credit",
      icon: <IconCoin className="w-6 h-6 text-emerald-500" />,
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Active Operators",
      value: stats.users,
      description: "Branch personnel",
      icon: <IconUsers className="w-6 h-6 text-blue-500" />,
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Transactions",
      value: stats.totalBills,
      description: "Invoice count generated",
      icon: <IconReceipt className="w-6 h-6 text-indigo-500" />,
      bgColor: "bg-indigo-500/10",
    },
  ];

  const quickActions = [
    {
      title: "Create Invoice",
      subtitle: "Open checkout counter",
      icon: <IconReceipt className="w-5 h-5" />,
      path: "/department_admin/bill-creation",
    },
    {
      title: "Billing Logs",
      subtitle: "Review payment checkout lists",
      icon: <IconClipboardList className="w-5 h-5" />,
      path: "/department_admin/bill",
    },
  ];



  // Monthly revenue trend data
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const trendData =
    monthlyRevenue.length > 0
      ? monthlyRevenue.map((m) => ({
          name: `${monthNames[m.month - 1]} ${m.year}`,
          Revenue: m.revenue,
        }))
      : [{ name: "No Data", Revenue: 0 }];

  // Payment methods breakdown data
  const pieData =
    methods.length > 0
      ? methods.map((m) => ({
          name: m.method.toUpperCase(),
          amount: m.amount,
          fill: `var(--color-${m.method.toUpperCase()})`,
        }))
      : [{ name: "No Payments", amount: 1, fill: "hsl(var(--muted))" }];

  // Department revenue share data
  const barData =
    list.length > 0
      ? list.map((item) => ({
          name: item.name,
          Revenue: item.total,
        }))
      : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions Panel */}
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="p-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Activities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <span className="block text-sm font-bold text-foreground leading-none mb-1">
                    {act.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground font-medium leading-none">
                    {act.subtitle}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((card, i) => (
          <Card
            key={i}
            className="border border-border shadow-sm bg-card hover:shadow-md transition-shadow duration-300"
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {card.title}
                </span>
                <h3 className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
                  {card.value}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                  {card.description}
                </p>
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
                Department Monthly Revenue
              </CardTitle>
              <CardDescription>
                Paid sales trajectory over the last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-Revenue)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-Revenue)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => currencyFormatter(value)} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="var(--color-Revenue)"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <IconReceipt className="w-5 h-5 text-primary" />
                  Branch checkout Transactions
                </CardTitle>
                <CardDescription>
                  Recent checkout invoices in your assigned branch.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/department_admin/bill")}
                className="text-xs font-bold cursor-pointer"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {bills.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No recent invoices logged.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-y border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Created By</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr
                        key={b._id}
                        className="border-b border-border hover:bg-muted/10 transition text-sm"
                      >
                        <td className="py-3 px-4 font-bold text-foreground">
                          {b.code}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-medium">
                          {b.createdBy?.name || "System"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-semibold">
                          {b.department?.name || "Global / N/A"}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold uppercase text-muted-foreground">
                          {b.paymentMethod || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-foreground">
                          {currencyFormatter(b.total)}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns (Span 1) for Payments & Comparisons */}
        <div className="space-y-6">
          {/* Recharts Payment Methods Donut */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconReceipt className="w-5 h-5 text-primary" />
                Payment Mode Split
              </CardTitle>
              <CardDescription>
                Distribution share of paid transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => currencyFormatter(value)} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sub-Department Bar Chart */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IconBuildingCommunity className="w-5 h-5 text-primary" />
                Sub-Department Sales comparison
              </CardTitle>
              <CardDescription>
                Sales comparison across sub-departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                  No department sales metrics recorded.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-56 w-full">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={val => `₹${val}`} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => currencyFormatter(value)} />} />
                    <Bar
                      dataKey="Revenue"
                      fill="var(--color-Revenue)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    >
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}