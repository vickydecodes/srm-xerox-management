import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const statusVariant = {
  UNPAID: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
};

export const View = ({ bill } = {}) => (
  <DialogContent className="w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        Bill {bill?.code}
        <Badge variant={statusVariant[bill?.status] || 'outline'}>{bill?.status}</Badge>
      </DialogTitle>
      <DialogDescription>
        Created on {bill?.createdAt ? new Date(bill.createdAt).toLocaleDateString() : '-'}
      </DialogDescription>
    </DialogHeader>

    <div className="grid gap-2">
      {bill?.items?.map((item, i) => (
        <div key={i} className="flex justify-between text-sm border-b pb-1">
          <span>
            {item.name}{' '}
            <span className="text-muted-foreground">
              x{item.quantity} @ {item.price?.toFixed(2)}
            </span>
          </span>
          <span>{item.total?.toFixed(2)}</span>
        </div>
      ))}
    </div>

    <div className="flex flex-col justify-around gap-1 text-sm mt-2">
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{bill?.subtotal?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">Discount</span>
        <span> - {bill?.discount?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">Tax</span>
        <span>+ {bill?.tax?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between w-48 font-semibold">
        <span>Total</span>
        <span>{bill?.total?.toFixed(2)}</span>
      </div>
    </div>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

export const Delete = ({ id, code, closeModal = () => {}, onConfirm = () => {} }) => (
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Are you sure you want to delete bill {code}?</DialogTitle>
      <DialogDescription>
        This will permanently remove this bill record.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        variant="destructive"
        onClick={() => {
          onConfirm(id);
          closeModal();
        }}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
);