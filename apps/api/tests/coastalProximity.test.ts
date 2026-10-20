import { describe, expect, it } from 'vitest';

import {
  getCoastDistanceKm,
  hasNearbyCoast,
} from '../src/locations/coastalProximity.js';
import { assessActivities } from '../src/scoring/assessActivities.js';
import {
  ActivityEnum,
  AssessmentStatusEnum,
} from '../src/scoring/scoring.types.js';
import { createLocationForecastFixture } from './fixtures/activityForecast.js';

describe('ocean coastline proximity', () => {
  it('recognizes São Paulo capital as inland without consulting marine observations', () => {
    const place = { latitude: -23.55, longitude: -46.64 };
    expect(getCoastDistanceKm(place)).toBeGreaterThan(50);
    expect(getCoastDistanceKm(place)).toBeLessThan(65);
    expect(hasNearbyCoast(place)).toBe(false);
  });

  it.each([
    ['Santos', -23.96083, -46.33361],
    ['Maraú', -14.1, -39.01],
    ['Rio de Janeiro', -22.9068, -43.1729],
    ['Lisbon', 38.7223, -9.1393],
    ['Suva', -18.1416, 178.4419],
    ['Taveuni across the antimeridian', -16.8, -179.9],
    ['Tromsø', 69.6492, 18.9553],
  ])('keeps %s within coastal range', (_name, latitude, longitude) => {
    expect(hasNearbyCoast({ latitude, longitude })).toBe(true);
  });

  it.each([
    ['Brasília', -15.79, -47.88],
    ['Zurich', 47.3769, 8.5417],
    ['Chicago on a lake', 41.8781, -87.6298],
    ['Baku on the Caspian Sea', 40.4, 49.9],
  ])('does not treat %s as ocean coastline', (_name, latitude, longitude) => {
    expect(hasNearbyCoast({ latitude, longitude })).toBe(false);
  });

  it('rejects invalid coordinates rather than inventing a geographic result', () => {
    expect(() => hasNearbyCoast({ latitude: NaN, longitude: 0 })).toThrow();
    expect(() => hasNearbyCoast({ latitude: 0, longitude: 181 })).toThrow();
  });
});

describe('geographic applicability before weather scoring', () => {
  it.each(['fulfilled', 'rejected'] as const)(
    'keeps inland surf unscored when the marine source is %s',
    (status) => {
      const fixture = createLocationForecastFixture();
      if (status === 'rejected')
        fixture.marineResult = {
          status: 'rejected',
          reason: new Error('Marine unavailable'),
        };
      const groups = assessActivities({
        ...fixture,
        timezone: 'America/Sao_Paulo',
        hasNearbyCoast: false,
      });
      const surfing = groups.find(
        (group) => group.activity === ActivityEnum.SURFING,
      )!;
      expect(surfing.days).toHaveLength(7);
      expect(
        surfing.days.every(
          (day) =>
            day.status === AssessmentStatusEnum.NO_NEARBY_COAST &&
            day.score === null &&
            day.rank === null,
        ),
      ).toBe(true);
      expect(
        groups
          .find((group) => group.activity === ActivityEnum.OUTDOOR_SIGHTSEEING)!
          .days.some((day) => day.status === AssessmentStatusEnum.AVAILABLE),
      ).toBe(true);
    },
  );

  it('preserves a temporary source failure at coastal locations', () => {
    const fixture = createLocationForecastFixture();
    fixture.marineResult = {
      status: 'rejected',
      reason: new Error('Marine unavailable'),
    };
    const groups = assessActivities({
      ...fixture,
      timezone: 'America/Sao_Paulo',
      hasNearbyCoast: true,
    });
    expect(
      groups
        .find((group) => group.activity === ActivityEnum.SURFING)!
        .days.every(
          (day) => day.status === AssessmentStatusEnum.UPSTREAM_UNAVAILABLE,
        ),
    ).toBe(true);
  });
});
