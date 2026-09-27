import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentCategory: z.string().nullable().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
