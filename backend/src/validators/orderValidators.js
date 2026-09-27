import { z } from 'zod';

export const createOrderSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  customer: z.object({
    name: z.string().min(1, 'Full name is required'),
    phone: z.string().min(7, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
  }),
  delivery: z.object({
    address: z.string().min(1, 'Delivery address is required'),
    state: z.string().min(1, 'State is required'),
    city: z.string().min(1, 'City is required'),
    note: z.string().optional(),
  }),
  source: z.string().optional(),
  campaign: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  note: z.string().optional(),
});
