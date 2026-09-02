import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Database } from 'lucide-react';

export function EmptyDemo({
  title = 'No Projects Yet',
  icon = <Database/>,
  description = 'You haven&apos;t created any projects yet. Get started by creating your first project.',
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {}
      </EmptyContent>
    </Empty>
  );
}
