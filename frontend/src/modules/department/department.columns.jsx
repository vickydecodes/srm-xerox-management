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
        accessorKey: 'create',
        header: () => Hint('create', 'delete button'),
        cell: ({row}) => {
        const dept = row.original;
        return <Button onClick={() => departments.openCreate(dept.id, dept.name)}>Delete department</Button>
        }
    }
  ]
}

