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


export const Erase = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This operation is Permenent Delete. All the data related to this branch
        will be lost.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="success"
      >
        Delete Permanently
      </Button>
    </DialogFooter>
  </DialogContent>
);
export const Retrieve = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> this operation is retrieve All the data related to this branch will be
        back.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="destructive"
      >
        Retrieve
      </Button>
    </DialogFooter>
  </DialogContent>
);
export const ActiveStatus = ({
  id, 
  status,
  submitFn,
  closeModal,
  exported, 
}) => {
  const actionLabel = status ? 'Deactivate' : 'Activate';

  const onConfirm = async () => {
    await submitFn(id, {
      active: !status,
    });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} Branch</DialogTitle>

        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> the Branch.
              <br />
              Students will no longer be able to Join this Branch.
            </>
          ) : (
            <>
              This will <strong>activate</strong> the Branch.
              <br />
              The Branch will become available again.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={exported?.loading?.edit}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant={status ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
        >
          {exported?.loading?.edit ? 'Updating...' : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};