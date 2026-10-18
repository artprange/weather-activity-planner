import { z } from 'zod';

const timezoneSchema = z
  .string()
  .min(1)
  .refine(
    (timezone) => {
      try {
        new Intl.DateTimeFormat('en', {
          timeZone: timezone,
        });

        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid timezone.',
    },
  );

const openMeteoLocationResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: timezoneSchema,
  admin1: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().length(2).optional(),
});

const openMeteoLocationSearchResponseSchema = z.object({
  error: z.never().optional(),
  results: z.array(openMeteoLocationResponseSchema).optional(),
});

const openMeteoLocationLookupResponseSchema = z.union([
  openMeteoLocationResponseSchema,
  z
    .object({})
    .strict()
    .transform(() => null),
]);

type OpenMeteoLocationResponseType = z.infer<
  typeof openMeteoLocationResponseSchema
>;

export {
  openMeteoLocationSearchResponseSchema,
  openMeteoLocationLookupResponseSchema,
};

export type { OpenMeteoLocationResponseType };
