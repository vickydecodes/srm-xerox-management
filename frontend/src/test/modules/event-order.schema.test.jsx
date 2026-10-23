import { describe, it, expect } from 'vitest';
import { eventOrderCreateSchema } from '@/modules/event-order/event-order.schema';

describe('eventOrderCreateSchema', () => {
  it('does not require a purpose field', () => {
    const result = eventOrderCreateSchema.safeParse({
      eventName: 'Annual Symposium',
      eventStartDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      approvedReferralNumber: 'SRM/EVT/2026/042',
      approvedDate: new Date().toISOString().slice(0, 10),
      attachmentEmail: 'events@srmist.edu.in',
      items: [
        {
          type: 'Service',
          item: 'service-1',
          name: 'Event banner',
          quantity: 1,
          price: 100,
          attachment: {},
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
