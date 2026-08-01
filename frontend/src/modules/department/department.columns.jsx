import { Button } from "@/components/ui/button"
import { Hint } from "@/core/utils/tooltip.util"

export const useDepartmentColumns = (departments) => {
  return [
    {
      accessorKey: 'id',
      header: () => Hint('Id', 'The academic year of this batch'),
      cell: ({ row }) => <span>{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'name',
      header: () => Hint('Name', 'Unique batch code'),
      cell: ({ row }) => <span>{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'Edit or delete this department'),
      cell: ({ row }) => {
        const dept = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => departments.openEdit(dept)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => departments.openDelete(dept)}>
              Delete
            </Button>
          </div>
        )
      }
    }
  ]
}