import { z } from 'zod';

export const uploadImageSchema = z.object({
  dataUri: z.string().min(1, 'Image data is required'),
});
