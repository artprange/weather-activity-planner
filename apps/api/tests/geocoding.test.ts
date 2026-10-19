import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationErrorCodeEnum } from '../src/errors/applicationError.js';
import {
  getGeocodedLocationById,
  searchGeocodedLocations,
} from '../src/integrations/open-meteo/geocoding.js';
import { GeocodingFixtures } from './fixtures/geocoding.js';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchGeocodedLocations', () => {
  it('keeps homonymous places separate and normalizes API fields', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        results: [GeocodingFixtures.SANTOS, GeocodingFixtures.OTHER_SANTOS],
      }),
    );

    const locations = await searchGeocodedLocations('  Santos  ');

    expect(locations).toEqual([
      {
        id: '3449433',
        name: 'Santos',
        region: 'São Paulo',
        country: 'Brazil',
        countryCode: 'BR',
        latitude: -23.96083,
        longitude: -46.33361,
        timezone: 'America/Sao_Paulo',
      },
      {
        id: '8912838',
        name: 'Santos',
        region: 'Veracruz',
        country: 'Mexico',
        countryCode: 'MX',
        latitude: 17.73778,
        longitude: -94.17444,
        timezone: 'America/Mexico_City',
      },
    ]);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBeInstanceOf(URL);
    if (!(url instanceof URL)) throw new Error('Expected a URL argument.');
    expect(url.origin).toBe('https://geocoding-api.open-meteo.com');
    expect(url.pathname).toBe('/v1/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      name: 'Santos',
      count: '10',
      language: 'en',
      format: 'json',
    });
  });

  it.each([{}, { results: [] }])(
    'returns an empty list for a successful empty response: %j',
    async (body) => {
      fetchMock.mockResolvedValue(Response.json(body));
      await expect(searchGeocodedLocations('NoSuchPlace')).resolves.toEqual([]);
    },
  );

  it('normalizes missing and blank optional fields while retaining zero coordinates', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        results: [
          {
            id: 1,
            name: 'Example',
            latitude: 0,
            longitude: 0,
            timezone: 'UTC',
            admin1: '   ',
          },
        ],
      }),
    );
    await expect(searchGeocodedLocations('Example')).resolves.toEqual([
      {
        id: '1',
        name: 'Example',
        region: null,
        country: null,
        countryCode: null,
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
    ]);
  });

  it('accepts three characters after trimming', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ results: [] }));

    await expect(searchGeocodedLocations('  Rio  ')).resolves.toEqual([]);

    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('name=Rio');
  });

  it.each(['', ' ', 'S', 'Sa', ' Sa ', 'a'.repeat(101)])(
    'rejects invalid query before HTTP: %j',
    async (query) => {
      await expect(searchGeocodedLocations(query)).rejects.toMatchObject({
        code: ApplicationErrorCodeEnum.INVALID_INPUT,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { error: true, reason: 'Internal details' },
    { results: null },
    { results: [{ ...GeocodingFixtures.SANTOS, timezone: 'Invalid/Zone' }] },
    { results: [{ ...GeocodingFixtures.SANTOS, latitude: 100 }] },
    { results: [{ ...GeocodingFixtures.SANTOS, id: 1.5 }] },
    { results: [{ id: 1 }] },
  ])('rejects malformed upstream search data: %j', async (body) => {
    fetchMock.mockResolvedValue(Response.json(body));
    await expect(searchGeocodedLocations('Santos')).rejects.toMatchObject({
      code: ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
    });
  });
});

describe('getGeocodedLocationById', () => {
  it('resolves the selected ID and calls the lookup endpoint', async () => {
    fetchMock.mockResolvedValue(Response.json(GeocodingFixtures.SANTOS));
    await expect(getGeocodedLocationById('3449433')).resolves.toMatchObject({
      id: '3449433',
      name: 'Santos',
      timezone: 'America/Sao_Paulo',
    });
    const [url] = fetchMock.mock.calls[0] ?? [];
    if (!(url instanceof URL)) throw new Error('Expected a URL argument.');
    expect(url.pathname).toBe('/v1/get');
    expect(url.searchParams.get('id')).toBe('3449433');
  });

  it('returns null for an empty successful lookup response', async () => {
    fetchMock.mockResolvedValue(Response.json({}));
    await expect(getGeocodedLocationById('3449433')).resolves.toBeNull();
  });

  it.each(['', '0', '-1', '1.5', 'abc', '9007199254740992'])(
    'rejects invalid ID before HTTP: %j',
    async (id) => {
      await expect(getGeocodedLocationById(id)).rejects.toMatchObject({
        code: ApplicationErrorCodeEnum.INVALID_INPUT,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    GeocodingFixtures.OTHER_SANTOS,
    { error: true, reason: 'Unknown location' },
    { id: 3449433 },
  ])(
    'does not accept mismatched or malformed lookup data: %j',
    async (body) => {
      fetchMock.mockResolvedValue(Response.json(body));
      await expect(getGeocodedLocationById('3449433')).rejects.toMatchObject({
        code: ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      });
    },
  );
});
