import { z } from 'zod';

const optionalNumberSeriesSchema = z.array(z.number().nullable()).nullish();

const optionalNonnegativeSeriesSchema = z
  .array(z.number().nonnegative().nullable())
  .nullish();

const timestampSeriesSchema = z.array(z.number().int().positive()).min(1);

const forecastGridSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type HourlySeriesType = Record<
  string,
  readonly (number | null)[] | null | undefined
>;

function validateHourlySeries(
  hourly: HourlySeriesType & { time: number[] },
  units: Record<string, string>,
  expectedUnits: Record<string, string>,
  context: z.RefinementCtx,
): void {
  for (let index = 1; index < hourly.time.length; index += 1) {
    if ((hourly.time[index] ?? 0) <= (hourly.time[index - 1] ?? 0)) {
      context.addIssue({
        code: 'custom',
        path: ['hourly', 'time'],
        message: 'Forecast timestamps must be strictly increasing.',
      });

      break;
    }
  }

  for (const [key, unit] of Object.entries(expectedUnits)) {
    const series = hourly[key];

    if (series === null || series === undefined) {
      continue;
    }

    if (series.length !== hourly.time.length) {
      context.addIssue({
        code: 'custom',
        path: ['hourly', key],
        message: 'Hourly series length does not match timestamps.',
      });
    }

    if (units[key] !== unit) {
      context.addIssue({
        code: 'custom',
        path: ['hourly_units', key],
        message: 'Unexpected or missing measurement unit.',
      });
    }
  }

  if (units.time !== 'unixtime') {
    context.addIssue({
      code: 'custom',
      path: ['hourly_units', 'time'],
      message: 'Expected Unix timestamps.',
    });
  }
}

const weatherForecastResponseSchema = forecastGridSchema
  .extend({
    hourly_units: z.record(z.string(), z.string()),
    hourly: z.object({
      time: timestampSeriesSchema,
      temperature_2m: optionalNumberSeriesSchema,
      apparent_temperature: optionalNumberSeriesSchema,
      precipitation: optionalNonnegativeSeriesSchema,
      rain: optionalNonnegativeSeriesSchema,
      showers: optionalNonnegativeSeriesSchema,
      snow_depth: optionalNonnegativeSeriesSchema,
      wind_speed_10m: optionalNonnegativeSeriesSchema,
      wind_gusts_10m: optionalNonnegativeSeriesSchema,
      visibility: optionalNonnegativeSeriesSchema,
      weather_code: z
        .array(z.number().int().min(0).max(99).nullable())
        .nullish(),
      is_day: z
        .array(z.union([z.literal(0), z.literal(1)]).nullable())
        .nullish(),
    }),
    daily_units: z.object({
      time: z.literal('unixtime'),
      sunrise: z.literal('unixtime'),
      sunset: z.literal('unixtime'),
    }),
    daily: z.object({
      time: timestampSeriesSchema.length(7),
      sunrise: z.array(z.number().int().nonnegative().nullable()).length(7),
      sunset: z.array(z.number().int().nonnegative().nullable()).length(7),
    }),
  })
  .superRefine((data, context) => {
    validateHourlySeries(
      data.hourly,
      data.hourly_units,
      {
        temperature_2m: '°C',
        apparent_temperature: '°C',
        precipitation: 'mm',
        rain: 'mm',
        showers: 'mm',
        snow_depth: 'm',
        wind_speed_10m: 'km/h',
        wind_gusts_10m: 'km/h',
        visibility: 'm',
        weather_code: 'wmo code',
        is_day: '',
      },
      context,
    );
  });

const marineForecastResponseSchema = forecastGridSchema
  .extend({
    hourly_units: z.record(z.string(), z.string()),
    hourly: z.object({
      time: timestampSeriesSchema,
      wave_height: optionalNonnegativeSeriesSchema,
      wave_period: optionalNonnegativeSeriesSchema,
    }),
  })
  .superRefine((data, context) => {
    validateHourlySeries(
      data.hourly,
      data.hourly_units,
      {
        wave_height: 'm',
        wave_period: 's',
      },
      context,
    );
  });

export { weatherForecastResponseSchema, marineForecastResponseSchema };
