import { describe, it, expect } from 'vitest';
import { xeroxOrderCreateSchema } from '@/modules/xerox-order/xerox-order.schema';

describe('xeroxOrderCreateSchema', () => {
  it('allows creating an order without selecting a shop', () => {
    const result = xeroxOrderCreateSchema.safeParse({
      branch: 'branch-1',
      department: 'department-1',
      purpose: 'Exam papers',
      items: [
        {
          type: 'InventoryProduct',
          item: 'product-1',
          name: 'A4 sheet',
          price: 1,
          quantity: 100,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
