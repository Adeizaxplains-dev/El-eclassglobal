import { z } from 'zod';

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z
    .object({
      line: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  customerStatus: z.enum(['lead', 'prospect', 'customer', 'repeat_customer', 'vip', 'inactive']).optional(),
  notes: z.string().optional(),
});
