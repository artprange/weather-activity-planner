import { DateTime } from 'luxon';

import { MarineCoverageEnum } from '../../src/forecasts/forecast.types.js';
import type {
  WeatherForecastType,
  MarineForecastType,
} from '../../src/forecasts/forecast.types.js';
import type { getLocationForecasts } from '../../src/forecasts/getLocationForecasts.js';
import type { GeocodedLocationType } from '../../src/locations/geocodedLocation.types.js';

const ForecastPlaceFixture: GeocodedLocationType = {
  id: '3449433',
  name: 'Santos',
  region: 'São Paulo',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: -23.96083,
  longitude: -46.33361,
  timezone: 'America/Sao_Paulo',
};

function createLocationForecastFixture(): Awaited<
  ReturnType<typeof getLocationForecasts>
> {
  const start = DateTime.fromISO('2026-10-20', {
    zone: ForecastPlaceFixture.timezone,
  });

  const dates = Array.from({ length: 7 }, (_, index) =>
    start.plus({ days: index }).toFormat('yyyy-MM-dd'),
  );

  const window = {
    dates,
    startDate: '2026-10-20',
    endDate: '2026-10-26',
  };

  const grid = {
    latitude: ForecastPlaceFixture.latitude,
    longitude: ForecastPlaceFixture.longitude,
  };

  const weather: WeatherForecastType = {
    timezone: ForecastPlaceFixture.timezone,
    window,
    grid,
    hours: [],
    daylight: [],
  };

  const marine: MarineForecastType = {
    timezone: ForecastPlaceFixture.timezone,
    window,
    grid,
    gridDistanceKm: 0,
    coverage: MarineCoverageEnum.WITHIN_RANGE,
    hours: [],
  };

  for (const date of dates) {
    const day = DateTime.fromISO(date, {
      zone: ForecastPlaceFixture.timezone,
    });

    weather.daylight.push({
      date,
      sunriseMs: day.set({ hour: 6 }).toMillis(),
      sunsetMs: day.set({ hour: 18 }).toMillis(),
    });

    for (
      let hour = day;
      hour < day.plus({ days: 1 });
      hour = hour.plus({ hours: 1 })
    ) {
      weather.hours.push({
        timestampMs: hour.toMillis(),
        temperatureC: 22,
        apparentTemperatureC: 22,
        precipitationMm: 0,
        liquidPrecipitationMm: 0,
        snowDepthCm: 0,
        windSpeedKmh: 10,
        windGustsKmh: 15,
        visibilityM: 5000,
        weatherCode: 0,
        isDay: hour.hour >= 6 && hour.hour < 18,
      });

      marine.hours.push({
        timestampMs: hour.toMillis(),
        waveHeightM: 1.2,
        wavePeriodS: 8,
      });
    }
  }

  return {
    window,
    weatherResult: {
      status: 'fulfilled',
      value: weather,
    },
    marineResult: {
      status: 'fulfilled',
      value: marine,
    },
  };
}

export { ForecastPlaceFixture, createLocationForecastFixture };
