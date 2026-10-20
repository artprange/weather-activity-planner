import { z } from 'zod';

import { searchPlaceSchema } from '@/features/places/placeSearch.schemas';
import type { Query } from '@/graphql/generated';

const activitySchema = z.enum([
  'SKIING',
  'SURFING',
  'OUTDOOR_SIGHTSEEING',
  'INDOOR_SIGHTSEEING',
]);

const statusSchema = z.enum([
  'AVAILABLE',
  'INSUFFICIENT_DATA',
  'NO_VALID_WINDOW',
  'LOCATION_UNSUPPORTED',
  'NO_NEARBY_COAST',
  'UPSTREAM_UNAVAILABLE',
]);

const factorSchema = z.enum([
  'SNOW_DEPTH',
  'TEMPERATURE',
  'APPARENT_TEMPERATURE',
  'WIND',
  'GUSTS',
  'VISIBILITY',
  'RAIN',
  'PRECIPITATION',
  'WAVE_HEIGHT',
  'WAVE_PERIOD',
]);

const capSchema = z.enum([
  'THUNDERSTORM',
  'NO_SNOW',
  'LOW_SNOW',
  'LOW_VISIBILITY',
  'STRONG_GUSTS',
  'LARGE_WAVES',
]);

const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value.length > 0;
  } catch {
    return false;
  }
});

const instantSchema = z.iso.datetime({ offset: true });

const dailyAssessmentSchema = z
  .object({
    date: z.iso.date(),
    activity: activitySchema,
    status: statusSchema,
    score: z.number().int().min(0).max(100).nullable(),
    category: z.enum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']).nullable(),
    rank: z.number().int().min(1).max(7).nullable(),
    window: z
      .object({
        startAt: instantSchema,
        endAt: instantSchema,
      })
      .nullable(),
    factors: z.array(
      z.object({
        factor: factorSchema,
        unit: z.string(),
        meanValue: z.number(),
        meanScore: z.number().min(0).max(100),
        meanPoints: z.number(),
      }),
    ),
    caps: z.array(capSchema),
    summary: z.string(),
    limitations: z.array(z.string()),
  })
  .refine(
    (day) => {
      const values = [day.score, day.category, day.rank, day.window];

      return day.status === 'AVAILABLE'
        ? values.every((value) => value !== null)
        : values.every((value) => value === null);
    },
    {
      message: 'Assessment status and values do not match.',
    },
  );

const activityForecastSchema = z
  .object({
    place: searchPlaceSchema,
    timezone: timezoneSchema,
    generatedAt: instantSchema,
    scoringVersion: z.string(),
    window: z.object({
      dates: z.array(z.iso.date()).length(7),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }),
    activities: z
      .array(
        z.object({
          activity: activitySchema,
          days: z.array(dailyAssessmentSchema).length(7),
        }),
      )
      .length(4),
    attributions: z.array(
      z.object({
        label: z.string(),
        url: z.url().refine((value) => new URL(value).protocol === 'https:'),
      }),
    ),
  })
  .refine(
    (forecast) => {
      const dates = forecast.window.dates;

      return (
        forecast.timezone === forecast.place.timezone &&
        forecast.window.startDate === dates[0] &&
        forecast.window.endDate === dates[6] &&
        new Set(dates).size === 7 &&
        new Set(forecast.activities.map((group) => group.activity)).size ===
          4 &&
        forecast.activities.every((group) =>
          group.days.every(
            (day, index) =>
              day.activity === group.activity && day.date === dates[index],
          ),
        )
      );
    },
    {
      message: 'Forecast groups and dates do not match.',
    },
  );

const activityForecastDataSchema = z.object({
  activityForecast: activityForecastSchema.nullable(),
}) satisfies z.ZodType<Pick<Query, 'activityForecast'>>;

type ActivityForecastType = z.infer<typeof activityForecastSchema>;
type DailyAssessmentType = z.infer<typeof dailyAssessmentSchema>;

export { activityForecastDataSchema };
export type { ActivityForecastType, DailyAssessmentType };
