import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../../errors/application-error.js';
import type {
  ForecastWindowType,
  WeatherForecastType,
} from '../../forecasts/forecast.types.js';
import type { GeocodedLocationType } from '../../locations/geocoded-location.types.js';
import { createForecastUrl, toTimestampMs } from './forecast-helper.js';
import { weatherForecastResponseSchema } from './forecast-schemas.js';

import { fetchOpenMeteoJson } from './open-meteo-client.js';

const WeatherForecastConstants = {
  BASE_URL: 'https://api.open-meteo.com',
  PATH: '/v1/forecast',
  HOURLY_VARIABLES:
    'temperature_2m,apparent_temperature,precipitation,rain,showers,snow_depth,wind_speed_10m,wind_gusts_10m,visibility,weather_code,is_day',
};

async function getWeatherForecast(
  location: GeocodedLocationType,
  window: ForecastWindowType,
): Promise<WeatherForecastType> {
  const url = createForecastUrl(
    WeatherForecastConstants.BASE_URL,
    WeatherForecastConstants.PATH,
    location,
    window,
  );

  url.searchParams.set('hourly', WeatherForecastConstants.HOURLY_VARIABLES);
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');
  url.searchParams.set('cell_selection', 'land');

  const result = weatherForecastResponseSchema.safeParse(
    await fetchOpenMeteoJson(url),
  );

  if (!result.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The weather service returned unexpected forecast data.',
      { cause: result.error },
    );
  }

  const { hourly, daily, latitude, longitude } = result.data;

  return {
    timezone: location.timezone,
    window,
    grid: {
      latitude,
      longitude,
    },
    hours: hourly.time.map((time, index) => {
      const rain = hourly.rain?.[index] ?? null;
      const showers = hourly.showers?.[index] ?? null;
      const snow = hourly.snow_depth?.[index] ?? null;
      const isDay = hourly.is_day?.[index] ?? null;

      return {
        timestampMs: time * 1000,
        temperatureC: hourly.temperature_2m?.[index] ?? null,
        apparentTemperatureC: hourly.apparent_temperature?.[index] ?? null,
        precipitationMm: hourly.precipitation?.[index] ?? null,
        liquidPrecipitationMm:
          rain === null || showers === null ? null : rain + showers,
        snowDepthCm: snow === null ? null : snow * 100,
        windSpeedKmh: hourly.wind_speed_10m?.[index] ?? null,
        windGustsKmh: hourly.wind_gusts_10m?.[index] ?? null,
        visibilityM: hourly.visibility?.[index] ?? null,
        weatherCode: hourly.weather_code?.[index] ?? null,
        isDay: isDay === null ? null : isDay === 1,
      };
    }),
    daylight: window.dates.map((date, index) => ({
      date,
      sunriseMs: toTimestampMs(daily.sunrise[index]),
      sunsetMs: toTimestampMs(daily.sunset[index]),
    })),
  };
}

export { getWeatherForecast };
