import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationErrorCodeEnum } from '../src/errors/applicationError.js';
import { MarineCoverageEnum } from '../src/forecasts/forecast.types.js';
import { getLocationForecasts } from '../src/forecasts/getLocationForecasts.js';

import { getMarineForecast } from '../src/integrations/open-meteo/marineForecast.js';
import { getWeatherForecast } from '../src/integrations/open-meteo/weatherForecast.js';
import type { GeocodedLocationType } from '../src/locations/geocodedLocation.types.js';

import { GeocodingFixtures } from './fixtures/geocoding.js';
import { createForecastWindow } from '../src/integrations/open-meteo/forecastHelper.js';

const location: GeocodedLocationType = {
  id: '3449433',
  name: 'Santos',
  region: 'São Paulo',
  country: 'Brazil',
  countryCode: 'BR',
  latitude: GeocodingFixtures.SANTOS.latitude,
  longitude: GeocodingFixtures.SANTOS.longitude,
  timezone: 'America/Sao_Paulo',
};

const referenceDate = new Date('2026-10-19T12:00:00Z');

const window = createForecastWindow(location.timezone, referenceDate);

const firstTimestamp = Date.parse('2026-10-20T03:00:00Z') / 1000;

const fetchMock = vi.fn<typeof fetch>();

function weatherPayload() {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    hourly_units: {
      time: 'unixtime',
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
    hourly: {
      time: [firstTimestamp, firstTimestamp + 3600],
      temperature_2m: [0, null],
      apparent_temperature: [0, null],
      precipitation: [0, null],
      rain: [1, 0],
      showers: [2, null],
      snow_depth: [0.5, null],
      wind_speed_10m: [0, null],
      wind_gusts_10m: [0, null],
      visibility: [0, null],
      weather_code: [0, null],
      is_day: [0, null],
    },
    daily_units: {
      time: 'unixtime',
      sunrise: 'unixtime',
      sunset: 'unixtime',
    },
    daily: {
      time: window.dates.map((_, index) => firstTimestamp + index * 86400),
      sunrise: window.dates.map(
        (_, index) => firstTimestamp + index * 86400 + 21600,
      ),
      sunset: window.dates.map(
        (_, index) => firstTimestamp + index * 86400 + 64800,
      ),
    },
  };
}

function marinePayload() {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    hourly_units: {
      time: 'unixtime',
      wave_height: 'm',
      wave_period: 's',
    },
    hourly: {
      time: [firstTimestamp, firstTimestamp + 3600],
      wave_height: [0, null],
      wave_period: [8, null],
    },
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forecast window', () => {
  it('uses the destination calendar date rather than the host timezone', () => {
    const now = new Date('2026-10-19T01:00:00Z');

    expect(createForecastWindow('America/Sao_Paulo', now)).toMatchObject({
      startDate: '2026-10-19',
      endDate: '2026-10-25',
    });

    expect(createForecastWindow('Asia/Tokyo', now)).toMatchObject({
      startDate: '2026-10-20',
      endDate: '2026-10-26',
    });
  });

  it('advances calendar labels across month and daylight-saving boundaries', () => {
    expect(
      createForecastWindow('Europe/Berlin', new Date('2026-10-24T12:00:00Z'))
        .dates,
    ).toEqual([
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);

    expect(
      createForecastWindow('UTC', new Date('2026-12-31T12:00:00Z')).startDate,
    ).toBe('2027-01-01');
  });
});

describe('weather integration', () => {
  it('normalizes units, sums liquid rain and preserves zero and missing values', async () => {
    fetchMock.mockResolvedValue(Response.json(weatherPayload()));

    const result = await getWeatherForecast(location, window);

    expect(result.hours[0]).toMatchObject({
      timestampMs: firstTimestamp * 1000,
      temperatureC: 0,
      snowDepthCm: 50,
      liquidPrecipitationMm: 3,
      isDay: false,
    });

    expect(result.hours[1]).toMatchObject({
      temperatureC: null,
      snowDepthCm: null,
      liquidPrecipitationMm: null,
      isDay: null,
    });

    const url = fetchMock.mock.calls[0]?.[0];

    if (!(url instanceof URL)) {
      throw new Error('Expected a URL.');
    }

    expect(url.searchParams.get('start_date')).toBe('2026-10-20');
    expect(url.searchParams.get('end_date')).toBe('2026-10-26');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
  });

  it('retains other observations if a measurement series is absent', async () => {
    const { snow_depth: omittedSnow, ...hourly } = weatherPayload().hourly;

    expect(omittedSnow).toHaveLength(2);

    fetchMock.mockResolvedValue(
      Response.json({
        ...weatherPayload(),
        hourly,
      }),
    );

    const result = await getWeatherForecast(location, window);

    expect(result.hours[0]).toMatchObject({
      temperatureC: 0,
      snowDepthCm: null,
    });
  });

  it.each(['length', 'unit', 'order', 'negative'])(
    'rejects malformed observations: %s',
    async (kind) => {
      const payload = weatherPayload();

      if (kind === 'length') {
        payload.hourly.temperature_2m = [1];
      }

      if (kind === 'unit') {
        payload.hourly_units.snow_depth = 'cm';
      }

      if (kind === 'order') {
        payload.hourly.time = [firstTimestamp, firstTimestamp];
      }

      if (kind === 'negative') {
        payload.hourly.precipitation = [-1, 0];
      }

      fetchMock.mockResolvedValue(Response.json(payload));

      await expect(getWeatherForecast(location, window)).rejects.toMatchObject({
        code: ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      });
    },
  );

  it('rejects an invalid forecast location before HTTP', async () => {
    await expect(
      getWeatherForecast(
        {
          ...location,
          latitude: 100,
        },
        window,
      ),
    ).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.INVALID_INPUT,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('marine integration', () => {
  it('retains calm seas as zero rather than missing data', async () => {
    fetchMock.mockResolvedValue(Response.json(marinePayload()));

    const result = await getMarineForecast(location, window);

    expect(result.coverage).toBe(MarineCoverageEnum.WITHIN_RANGE);

    expect(result.hours).toEqual([
      {
        timestampMs: firstTimestamp * 1000,
        waveHeightM: 0,
        wavePeriodS: 8,
      },
      {
        timestampMs: (firstTimestamp + 3600) * 1000,
        waveHeightM: null,
        wavePeriodS: null,
      },
    ]);
  });

  it('does not use marine observations from a grid more than 25 km away', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        ...marinePayload(),
        latitude: 0,
        longitude: 0,
      }),
    );

    const result = await getMarineForecast(location, window);

    expect(result.coverage).toBe(MarineCoverageEnum.OUTSIDE_RANGE);
    expect(result.gridDistanceKm).toBeGreaterThan(25);
    expect(result.hours).toEqual([]);
  });

  it('distinguishes a nearby grid with no marine data from calm seas', async () => {
    const payload = marinePayload();

    fetchMock.mockResolvedValue(
      Response.json({
        ...payload,
        hourly: {
          ...payload.hourly,
          wave_height: [null, null],
          wave_period: [null, null],
        },
      }),
    );

    const result = await getMarineForecast(location, window);

    expect(result.coverage).toBe(MarineCoverageEnum.NO_MARINE_DATA);

    expect(result.hours.every((hour) => hour.waveHeightM === null)).toBe(true);
  });

  it('rejects non-metric marine units', async () => {
    const payload = marinePayload();

    payload.hourly_units.wave_height = 'ft';

    fetchMock.mockResolvedValue(Response.json(payload));

    await expect(getMarineForecast(location, window)).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
    });
  });
});

describe('independent forecast sources', () => {
  it.each(['weather', 'marine'])(
    'preserves the other source when %s fails',
    async (failed) => {
      fetchMock.mockImplementation(async (input) => {
        const url = new URL(String(input));

        const isMarine = url.hostname === 'marine-api.open-meteo.com';

        if ((failed === 'marine') === isMarine) {
          throw new TypeError('Network failure');
        }

        return Response.json(isMarine ? marinePayload() : weatherPayload());
      });

      const result = await getLocationForecasts(location, referenceDate);

      expect(result.weatherResult.status).toBe(
        failed === 'weather' ? 'rejected' : 'fulfilled',
      );

      expect(result.marineResult.status).toBe(
        failed === 'marine' ? 'rejected' : 'fulfilled',
      );
    },
  );
});
