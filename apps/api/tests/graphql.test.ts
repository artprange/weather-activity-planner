import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createYoga } from 'graphql-yoga';

import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../src/errors/applicationError.js';
import { getActivityForecast } from '../src/forecasts/getActivityForecast.js';
import { getLocationForecasts } from '../src/forecasts/getLocationForecasts.js';
import { createGraphQLContext } from '../src/graphql/context.js';
import type { GraphQLContextType } from '../src/graphql/context.js';
import { schema } from '../src/graphql/schema.js';
import {
  getGeocodedLocationById,
  searchGeocodedLocations,
} from '../src/integrations/open-meteo/geocoding.js';

import {
  ForecastPlaceFixture,
  createLocationForecastFixture,
} from './fixtures/activityForecast.js';

vi.mock('../src/integrations/open-meteo/geocoding.js', () => ({
  getGeocodedLocationById: vi.fn(),
  searchGeocodedLocations: vi.fn(),
}));

vi.mock('../src/forecasts/getLocationForecasts.js', () => ({
  getLocationForecasts: vi.fn(),
}));

const reportError = vi.fn<(error: unknown) => void>();

const yoga = createYoga({
  schema,
  context: (): GraphQLContextType => ({
    ...createGraphQLContext(),
    reportError,
  }),
  logging: false,
});

const forecastQuery = `
  query Forecast($id: ID!) {
    health
    activityForecast(placeId: $id) {
      place {
        id
        name
        region
        country
        timezone
      }
      timezone
      generatedAt
      scoringVersion
      window {
        dates
        startDate
        endDate
      }
      attributions {
        label
        url
      }
      activities {
        activity
        days {
          date
          status
          score
          category
          rank
          summary
          limitations
          caps
          window {
            startAt
            endAt
          }
          factors {
            factor
            unit
            meanValue
            meanScore
            meanPoints
          }
        }
      }
    }
  }
`;

async function request(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<unknown> {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const body: unknown = await response.json();

  return body;
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(getGeocodedLocationById).mockResolvedValue(ForecastPlaceFixture);

  vi.mocked(searchGeocodedLocations).mockResolvedValue([ForecastPlaceFixture]);

  vi.mocked(getLocationForecasts).mockResolvedValue(
    createLocationForecastFixture(),
  );
});

describe('GraphQL contract', () => {
  it('keeps the health query working', async () => {
    expect(await request('{ health }')).toEqual({
      data: {
        health: 'ok',
      },
    });
  });

  it('returns search candidates and preserves ambiguous places', async () => {
    vi.mocked(searchGeocodedLocations).mockResolvedValue([
      ForecastPlaceFixture,
      {
        ...ForecastPlaceFixture,
        id: '8912838',
        region: 'Veracruz',
        country: 'Mexico',
        countryCode: 'MX',
      },
    ]);

    const result = await request(
      `
        query($text: String!) {
          searchPlaces(query: $text) {
            id
            name
            region
            country
          }
        }
      `,
      {
        text: 'Santos',
      },
    );

    expect(result).toEqual({
      data: {
        searchPlaces: [
          {
            id: '3449433',
            name: 'Santos',
            region: 'São Paulo',
            country: 'Brazil',
          },
          {
            id: '8912838',
            name: 'Santos',
            region: 'Veracruz',
            country: 'Mexico',
          },
        ],
      },
    });

    expect(searchGeocodedLocations).toHaveBeenCalledWith('Santos');
  });

  it('returns an empty list for a successful search with no matches', async () => {
    vi.mocked(searchGeocodedLocations).mockResolvedValue([]);

    expect(
      await request(`
        {
          searchPlaces(query: "Unknown") {
            id
          }
        }
      `),
    ).toEqual({
      data: {
        searchPlaces: [],
      },
    });
  });

  it('returns all four activities and all seven days from the service', async () => {
    const now = new Date('2026-10-19T12:00:00Z');

    const result = await getActivityForecast('3449433', now);

    expect(result.activities).toHaveLength(4);

    expect(result.activities.every((group) => group.days.length === 7)).toBe(
      true,
    );

    expect(result.generatedAt).toBe('2026-10-19T12:00:00.000Z');

    expect(getLocationForecasts).toHaveBeenCalledWith(
      ForecastPlaceFixture,
      now,
    );
  });

  it('serializes scores and ISO windows without using 32-bit GraphQL timestamps', async () => {
    const result = await request(forecastQuery, {
      id: '3449433',
    });

    expect(result).not.toHaveProperty('errors');

    expect(result).toMatchObject({
      data: {
        health: 'ok',
        activityForecast: {
          place: {
            id: '3449433',
            name: 'Santos',
          },
          scoringVersion: '1',
          window: {
            startDate: '2026-10-20',
            endDate: '2026-10-26',
          },
          activities: expect.arrayContaining([
            expect.objectContaining({
              activity: 'SKIING',
              days: expect.arrayContaining([
                expect.objectContaining({
                  score: 0,
                  category: 'POOR',
                  rank: 1,
                }),
              ]),
            }),
            expect.objectContaining({
              activity: 'SURFING',
              days: expect.arrayContaining([
                expect.objectContaining({
                  score: 88,
                  category: 'EXCELLENT',
                  window: {
                    startAt: '2026-10-20T09:00:00.000Z',
                    endAt: '2026-10-20T12:00:00.000Z',
                  },
                }),
              ]),
            }),
          ]),
        },
      },
    });
  });

  it('maps invalid inputs to a stable error code', async () => {
    vi.mocked(searchGeocodedLocations).mockRejectedValue(
      new ApplicationError(
        ApplicationErrorCodeEnum.INVALID_INPUT,
        'Internal validation description',
      ),
    );

    const result = await request(`
      {
        searchPlaces(query: " ") {
          id
        }
      }
    `);

    expect(result).toMatchObject({
      errors: [
        expect.objectContaining({
          extensions: {
            code: 'INVALID_INPUT',
          },
        }),
      ],
    });

    expect(reportError).not.toHaveBeenCalled();
  });

  it('rejects invalid GraphQL variables before invoking the provider', async () => {
    const result = await request(forecastQuery, {
      id: {},
    });

    expect(result).toHaveProperty('errors');

    expect(getGeocodedLocationById).not.toHaveBeenCalled();
  });

  it('reports an unknown place without discarding a successful sibling field', async () => {
    vi.mocked(getGeocodedLocationById).mockResolvedValue(null);

    const result = await request(forecastQuery, {
      id: '999999',
    });

    expect(result).toMatchObject({
      data: {
        health: 'ok',
        activityForecast: null,
      },
      errors: [
        expect.objectContaining({
          extensions: {
            code: 'PLACE_NOT_FOUND',
          },
        }),
      ],
    });

    expect(getLocationForecasts).not.toHaveBeenCalled();
  });

  it('preserves weather scores when the marine source fails', async () => {
    const fixture = createLocationForecastFixture();

    fixture.marineResult = {
      status: 'rejected',
      reason: new Error('PRIVATE marine error'),
    };

    vi.mocked(getLocationForecasts).mockResolvedValue(fixture);

    const result = await request(forecastQuery, {
      id: '3449433',
    });

    expect(result).not.toHaveProperty('errors');

    expect(result).toMatchObject({
      data: {
        activityForecast: {
          activities: expect.arrayContaining([
            expect.objectContaining({
              activity: 'SURFING',
              days: expect.arrayContaining([
                expect.objectContaining({
                  status: 'UPSTREAM_UNAVAILABLE',
                  score: null,
                  category: null,
                  rank: null,
                  window: null,
                }),
              ]),
            }),
            expect.objectContaining({
              activity: 'OUTDOOR_SIGHTSEEING',
              days: expect.arrayContaining([
                expect.objectContaining({
                  status: 'AVAILABLE',
                  score: 100,
                }),
              ]),
            }),
          ]),
        },
      },
    });

    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });

  it('reports total upstream failure with a safe message', async () => {
    const fixture = createLocationForecastFixture();

    fixture.weatherResult = {
      status: 'rejected',
      reason: new Error('PRIVATE weather'),
    };

    fixture.marineResult = {
      status: 'rejected',
      reason: new Error('PRIVATE marine'),
    };

    vi.mocked(getLocationForecasts).mockResolvedValue(fixture);

    const result = await request(forecastQuery, {
      id: '3449433',
    });

    expect(result).toMatchObject({
      data: {
        health: 'ok',
        activityForecast: null,
      },
      errors: [
        expect.objectContaining({
          extensions: {
            code: 'UPSTREAM_UNAVAILABLE',
          },
        }),
      ],
    });

    expect(JSON.stringify(result)).not.toContain('PRIVATE');

    expect(reportError).toHaveBeenCalledOnce();
  });

  it('does not expose malformed upstream details', async () => {
    vi.mocked(searchGeocodedLocations).mockRejectedValue(
      new ApplicationError(
        ApplicationErrorCodeEnum.UPSTREAM_INVALID_RESPONSE,
        'PRIVATE upstream payload',
      ),
    );

    const result = await request(`
      {
        searchPlaces(query: "Santos") {
          id
        }
      }
    `);

    expect(result).toMatchObject({
      errors: [
        expect.objectContaining({
          extensions: {
            code: 'UPSTREAM_INVALID_RESPONSE',
          },
        }),
      ],
    });

    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });

  it('logs unexpected errors and exposes only a generic message', async () => {
    const failure = new Error('PRIVATE database address');

    vi.mocked(getGeocodedLocationById).mockRejectedValue(failure);

    const result = await request(forecastQuery, {
      id: '3449433',
    });

    expect(result).toMatchObject({
      errors: [
        expect.objectContaining({
          message: 'Unable to complete the request.',
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        }),
      ],
    });

    expect(reportError).toHaveBeenCalledWith(failure);

    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
});

describe('geographic surf applicability', () => {
  it('returns NO_NEARBY_COAST for São Paulo even if marine data is missing', async () => {
    vi.mocked(getGeocodedLocationById).mockResolvedValue({
      ...ForecastPlaceFixture,
      id: '3448439',
      name: 'São Paulo',
      latitude: -23.55,
      longitude: -46.64,
    });
    const fixture = createLocationForecastFixture();
    fixture.marineResult = {
      status: 'rejected',
      reason: new Error('Marine unavailable'),
    };
    vi.mocked(getLocationForecasts).mockResolvedValue(fixture);
    expect(await request(forecastQuery, { id: '3448439' })).toMatchObject({
      data: {
        activityForecast: {
          place: { name: 'São Paulo' },
          activities: expect.arrayContaining([
            {
              activity: 'SURFING',
              days: expect.arrayContaining([
                expect.objectContaining({
                  status: 'NO_NEARBY_COAST',
                  score: null,
                  rank: null,
                }),
              ]),
            },
          ]),
        },
      },
    });
  });
});
