import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../../errors/application-error.js';
import { MarineCoverageEnum } from '../../forecasts/forecast.types.js';
import type {
  ForecastWindowType,
  MarineForecastType,
} from '../../forecasts/forecast.types.js';
import type { GeocodedLocationType } from '../../locations/geocoded-location.types.js';
import { createForecastUrl, getGridDistanceKm } from './forecast-helper.js';
import { marineForecastResponseSchema } from './forecast-schemas.js';

import { fetchOpenMeteoJson } from './open-meteo-client.js';

const MarineForecastConstants = {
  BASE_URL: 'https://marine-api.open-meteo.com',
  PATH: '/v1/marine',
  MAX_GRID_DISTANCE_KM: 25,
};

async function getMarineForecast(
  location: GeocodedLocationType,
  window: ForecastWindowType,
): Promise<MarineForecastType> {
  const url = createForecastUrl(
    MarineForecastConstants.BASE_URL,
    MarineForecastConstants.PATH,
    location,
    window,
  );

  url.searchParams.set('hourly', 'wave_height,wave_period');
  url.searchParams.set('length_unit', 'metric');
  url.searchParams.set('cell_selection', 'sea');

  const result = marineForecastResponseSchema.safeParse(
    await fetchOpenMeteoJson(url),
  );

  if (!result.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The marine service returned unexpected forecast data.',
      { cause: result.error },
    );
  }

  const { hourly, latitude, longitude } = result.data;
  const grid = {
    latitude,
    longitude,
  };

  const gridDistanceKm = getGridDistanceKm(location, grid);

  const hasMarineData = hourly.time.some(
    (_, index) =>
      hourly.wave_height?.[index] !== null &&
      hourly.wave_height?.[index] !== undefined &&
      hourly.wave_period?.[index] !== null &&
      hourly.wave_period?.[index] !== undefined,
  );

  const coverage =
    gridDistanceKm > MarineForecastConstants.MAX_GRID_DISTANCE_KM
      ? MarineCoverageEnum.OUTSIDE_RANGE
      : hasMarineData
        ? MarineCoverageEnum.WITHIN_RANGE
        : MarineCoverageEnum.NO_MARINE_DATA;

  return {
    timezone: location.timezone,
    window,
    grid,
    gridDistanceKm,
    coverage,
    hours:
      coverage === MarineCoverageEnum.OUTSIDE_RANGE
        ? []
        : hourly.time.map((time, index) => ({
            timestampMs: time * 1000,
            waveHeightM: hourly.wave_height?.[index] ?? null,
            wavePeriodS: hourly.wave_period?.[index] ?? null,
          })),
  };
}

export { getMarineForecast };
