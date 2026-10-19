import type { Page } from '@playwright/test';
import { z } from 'zod';

import { assessActivities } from '../../../api/src/scoring/assessActivities';
import {
  createLocationForecastFixture,
  ForecastPlaceFixture,
} from '../../../api/tests/fixtures/activityForecast';
import type { ActivityForecast, Place } from '../../src/graphql/generated';

const Places: Place[] = [
  ForecastPlaceFixture,
  { ...ForecastPlaceFixture, id: '3448439', name: 'São Paulo' },
  ...Array.from({ length: 8 }, (_, index) => ({
    ...ForecastPlaceFixture,
    id: String(10000 + index),
    name: `Santos candidate ${index + 3}`,
  })),
];

const graphQLRequestSchema = z.object({
  query: z.string(),
  variables: z.object({
    query: z.string().optional(),
    placeId: z.string().optional(),
  }),
});

type MockOptionsType = {
  searchFailures?: number;
  forecastFailures?: number;
  empty?: boolean;
  partial?: boolean;
};

function createForecast(place: Place, partial = false): ActivityForecast {
  const fixture = createLocationForecastFixture();
  if (partial)
    fixture.marineResult = {
      status: 'rejected',
      reason: new Error('Marine offline'),
    };
  if (fixture.weatherResult.status === 'fulfilled') {
    const firstHour = fixture.weatherResult.value.hours[0];
    if (firstHour === undefined)
      throw new Error('Forecast fixture has no hours.');
    for (const hour of fixture.weatherResult.value.hours) {
      const dayIndex = Math.floor(
        (hour.timestampMs - firstHour.timestampMs) / 86_400_000,
      );
      if (dayIndex === 0 || dayIndex === 1) hour.apparentTemperatureC = 4;
      if (dayIndex === 1) hour.precipitationMm = 1.5;
    }
  }
  const activities = assessActivities({ ...fixture, timezone: place.timezone });

  return {
    place,
    timezone: place.timezone,
    generatedAt: '2026-10-19T12:00:00Z',
    scoringVersion: '1',
    window: fixture.window,
    activities: activities.map((group) => ({
      ...group,
      days: group.days.map((day) => ({
        ...day,
        window:
          day.window === null
            ? null
            : {
                startAt: new Date(day.window.startMs).toISOString(),
                endAt: new Date(day.window.endMs).toISOString(),
              },
      })),
    })),
    attributions: [{ label: 'Open-Meteo', url: 'https://open-meteo.com/' }],
  };
}

async function mockGraphQL(
  page: Page,
  options: MockOptionsType = {},
): Promise<void> {
  let searchFailures = options.searchFailures ?? 0;
  let forecastFailures = options.forecastFailures ?? 0;

  await page.route('**/graphql', async (route) => {
    const body: unknown = route.request().postDataJSON();
    const request = graphQLRequestSchema.parse(body);
    if (request.query.includes('SearchPlaces')) {
      if (searchFailures-- > 0) {
        await route.fulfill({ status: 503, body: 'Unavailable' });
        return;
      }
      await route.fulfill({
        json: { data: { searchPlaces: options.empty ? [] : Places } },
      });
      return;
    }
    if (forecastFailures-- > 0) {
      await route.fulfill({
        json: { errors: [{ message: 'Private server detail' }] },
      });
      return;
    }
    const place = Places.find(
      (candidate) => candidate.id === request.variables.placeId,
    );
    await route.fulfill({
      json: {
        data: {
          activityForecast:
            place === undefined ? null : createForecast(place, options.partial),
        },
      },
    });
  });
}

async function searchPlaces(page: Page, query = 'Santos'): Promise<void> {
  await page.getByRole('searchbox', { name: 'City or town' }).fill(query);
  await page
    .getByRole('button', { name: 'Search locations', exact: true })
    .click();
}

function activityGroup(page: Page, name: string) {
  return page
    .locator('details')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
}

export { Places, createForecast, mockGraphQL, searchPlaces, activityGroup };
