import { z } from 'zod';

import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../../errors/applicationError.js';
import type {
  ForecastWindowType,
  ForecastGridType,
} from '../../forecasts/forecast.types.js';
import type { GeocodedLocationType } from '../../locations/geocodedLocation.types.js';

const ForecastConstants = {
  DAYS: 7,
  EARTH_RADIUS_KM: 6371,
  MS_PER_DAY: 86_400_000,
};

const forecastLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z
    .string()
    .min(1)
    .refine((timezone) => {
      try {
        new Intl.DateTimeFormat('en', {
          timeZone: timezone,
        });

        return true;
      } catch {
        return false;
      }
    }),
});

function createForecastWindow(
  timezone: string,
  now = new Date(),
): ForecastWindowType {
  if (!Number.isFinite(now.getTime())) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.INVALID_INPUT,
      'Invalid forecast reference date.',
    );
  }

  let parts: Intl.DateTimeFormatPart[];

  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
  } catch (cause: unknown) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.INVALID_INPUT,
      'Invalid location timezone.',
      { cause },
    );
  }

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  const calendarDate = Date.parse(`${year}-${month}-${day}T00:00:00Z`);

  const dates = Array.from({ length: ForecastConstants.DAYS }, (_, index) =>
    new Date(calendarDate + (index + 1) * ForecastConstants.MS_PER_DAY)
      .toISOString()
      .slice(0, 10),
  );

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  if (startDate === undefined || endDate === undefined) {
    throw new Error('Forecast dates were not generated.');
  }

  return {
    dates,
    startDate,
    endDate,
  };
}

function createForecastUrl(
  base: string,
  path: string,
  location: GeocodedLocationType,
  window: ForecastWindowType,
): URL {
  const input = forecastLocationSchema.safeParse(location);

  if (!input.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.INVALID_INPUT,
      'Invalid forecast location.',
      { cause: input.error },
    );
  }

  const url = new URL(path, base);

  url.searchParams.set('latitude', String(input.data.latitude));
  url.searchParams.set('longitude', String(input.data.longitude));
  url.searchParams.set('timezone', input.data.timezone);
  url.searchParams.set('timeformat', 'unixtime');
  url.searchParams.set('start_date', window.startDate);
  url.searchParams.set('end_date', window.endDate);

  return url;
}

function getGridDistanceKm(
  from: ForecastGridType,
  to: ForecastGridType,
): number {
  const radians = (degrees: number): number => (degrees * Math.PI) / 180;

  const latDifference = radians(to.latitude - from.latitude);
  const lonDifference = radians(to.longitude - from.longitude);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(lonDifference / 2) ** 2;

  return (
    2 *
    ForecastConstants.EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
  );
}

function toTimestampMs(seconds: number | null | undefined): number | null {
  return seconds === null || seconds === undefined || seconds === 0
    ? null
    : seconds * 1000;
}

export {
  createForecastWindow,
  createForecastUrl,
  getGridDistanceKm,
  toTimestampMs,
};
