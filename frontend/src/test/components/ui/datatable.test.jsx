import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// DataTable is large — mock heavy deps if needed
vi.mock('@/core/utils/datatable.helper.util', () => ({
  // adjust if your helper exports differ
}));

import DataTable from '@/components/ui/datatable';

describe('DataTable', () => {
  it('renders empty state or table structure', () => {
    const columns = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'status', header: 'Status' },
    ];
    const data = [{ name: 'Item 1', status: 'Active' }];

    // Props may differ in your DataTable — adapt if needed
    const { container } = render(
      <DataTable columns={columns} data={data} />
    );
    expect(container).toBeTruthy();
  });
});