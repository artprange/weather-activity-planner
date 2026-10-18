import { z } from 'zod';

import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../../errors/application-error.js';
import type { GeocodedLocationType } from '../../locations/geocoded-location.types.js';

import {
  openMeteoLocationLookupResponseSchema,
  openMeteoLocationSearchResponseSchema,
} from './geocoding.schemas.js';
import type { OpenMeteoLocationResponseType } from './geocoding.schemas.js';
import { fetchOpenMeteoJson } from './open-meteo-client.js';

const GeocodingConstants = {
  BASE_URL: 'https://geocoding-api.open-meteo.com',
  SEARCH_PATH: '/v1/search',
  LOOKUP_PATH: '/v1/get',
  LANGUAGE: 'en',
  RESULT_LIMIT: 10,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
};

const locationSearchQuerySchema = z
  .string()
  .trim()
  .min(GeocodingConstants.MIN_QUERY_LENGTH)
  .max(GeocodingConstants.MAX_QUERY_LENGTH);

const locationIdSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().positive());

function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim();

  return normalized === undefined || normalized === '' ? null : normalized;
}

function mapGeocodedLocation(
  location: OpenMeteoLocationResponseType,
): GeocodedLocationType {
  return {
    id: String(location.id),
    name: location.name,
    region: normalizeOptionalText(location.admin1),
    country: normalizeOptionalText(location.country),
    countryCode: location.country_code?.toUpperCase() ?? null,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  };
}

async function searchGeocodedLocations(
  query: string,
): Promise<GeocodedLocationType[]> {
  const input = locationSearchQuerySchema.safeParse(query);

  if (!input.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.INVALID_INPUT,
      'Enter a place name between 2 and 100 characters.',
    );
  }

  const url = new URL(
    GeocodingConstants.SEARCH_PATH,
    GeocodingConstants.BASE_URL,
  );

  url.searchParams.set('name', input.data);
  url.searchParams.set('count', String(GeocodingConstants.RESULT_LIMIT));
  url.searchParams.set('language', GeocodingConstants.LANGUAGE);
  url.searchParams.set('format', 'json');

  const body = await fetchOpenMeteoJson(url);

  const result = openMeteoLocationSearchResponseSchema.safeParse(body);

  if (!result.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The location service returned unexpected search data.',
      { cause: result.error },
    );
  }

  return (result.data.results ?? []).map(mapGeocodedLocation);
}

async function getGeocodedLocationById(
  id: string,
): Promise<GeocodedLocationType | null> {
  const input = locationIdSchema.safeParse(id);

  if (!input.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.INVALID_INPUT,
      'Select a valid place.',
    );
  }

  const url = new URL(
    GeocodingConstants.LOOKUP_PATH,
    GeocodingConstants.BASE_URL,
  );

  url.searchParams.set('id', String(input.data));

  const body = await fetchOpenMeteoJson(url);

  const result = openMeteoLocationLookupResponseSchema.safeParse(body);

  if (!result.success) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The location service returned unexpected location data.',
      { cause: result.error },
    );
  }

  if (result.data === null) {
    return null;
  }

  if (result.data.id !== input.data) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
      'The location service returned a different location.',
    );
  }

  return mapGeocodedLocation(result.data);
}

export { searchGeocodedLocations, getGeocodedLocationById };
