import { z } from 'zod';

const homeSearchSchema = z.object({
  placeId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional()
    .catch(undefined),
});

export { homeSearchSchema };
