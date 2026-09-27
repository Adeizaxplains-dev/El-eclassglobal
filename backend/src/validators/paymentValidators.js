import { z } from 'zod';

export const initializePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order is required'),
  sessionId: z.string().min(1, 'Session is required'),
});