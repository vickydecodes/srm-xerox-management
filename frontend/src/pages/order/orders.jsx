import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconCalendarEvent, IconPrinter } from "@tabler/icons-react";
import EventOrderPage from "@/pages/event-order/event-order";
import XeroxOrderPage from "@/pages/xerox-order/xerox-order";

export default function OrdersPage({
  title = "Orders",
  description = "View, track, and manage all Event and Xerox printing orders.",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const currentTab = rawTab === "xerox" ? "xerox" : "event";

  const handleTabChange = (val) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="event" className="flex items-center gap-2">
            <IconCalendarEvent className="size-4" /> Event Orders
          </TabsTrigger>
          <TabsTrigger value="xerox" className="flex items-center gap-2">
            <IconPrinter className="size-4" /> Xerox Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event" className="space-y-4">
          <EventOrderPage />
        </TabsContent>

        <TabsContent value="xerox" className="space-y-4">
          <XeroxOrderPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
