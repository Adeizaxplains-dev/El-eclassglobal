import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1, 'Variant SKU is required'),
  color: z.string().optional(),
  size: z.string().optional(),
  priceOverride: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  images: z.array(z.object({ url: z.string(), publicId: z.string().optional() })).optional(),
  basePrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().nullable().optional(),
  condition: z.enum(['New', 'UK Used', 'US Used', 'Refurbished']).nullable().optional(),
  warranty: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional() }).optional(),
});

export const updateProductSchema = createProductSchema.partial();
