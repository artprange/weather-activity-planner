import { z } from 'zod';

import type { Query } from '@/graphql/generated';

const placeSearchInputSchema = z
  .string()
  .trim()
  .min(3, 'Enter at least 3 characters.')
  .max(100, 'Use no more than 100 characters.');

const searchPlaceSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  name: z.string().min(1),
  region: z.string().nullable(),
  country: z.string().nullable(),
  countryCode: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

const searchPlacesDataSchema = z.object({
  searchPlaces: z.array(searchPlaceSchema),
}) satisfies z.ZodType<Pick<Query, 'searchPlaces'>>;

type SearchPlaceType = z.infer<typeof searchPlaceSchema>;

export { placeSearchInputSchema, searchPlaceSchema, searchPlacesDataSchema };
export type { SearchPlaceType };
