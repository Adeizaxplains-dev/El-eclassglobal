import { z } from 'zod';

export const trackEventSchema = z.object({
  type: z.enum([
    'product_view',
    'add_to_cart',
    'checkout_started',
    'payment_attempted',
    'payment_successful',
    'order_completed',
  ]),
  sessionId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
});
