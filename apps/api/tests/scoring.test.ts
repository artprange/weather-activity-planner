import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import { MarineCoverageEnum } from '../src/forecasts/forecast.types.js';
import type {
  WeatherHourType,
  MarineHourType,
  WeatherForecastType,
  MarineForecastType,
} from '../src/forecasts/forecast.types.js';

import { assessActivities } from '../src/scoring/assessActivities.js';
import { scoreHour, getSuitability } from '../src/scoring/scoreHour.js';
import {
  ActivityEnum,
  AssessmentStatusEnum,
  SuitabilityEnum,
  ScoringCapEnum,
} from '../src/scoring/scoring.types.js';

function weatherHour(timestampMs = 0): WeatherHourType {
  return {
    timestampMs,
    temperatureC: -5,
    apparentTemperatureC: 21,
    precipitationMm: 0,
    liquidPrecipitationMm: 0,
    snowDepthCm: 50,
    windSpeedKmh: 10,
    windGustsKmh: 15,
    visibilityM: 5000,
    weatherCode: 0,
    isDay: true,
  };
}

function marineHour(timestampMs = 0): MarineHourType {
  return {
    timestampMs,
    waveHeightM: 1.2,
    wavePeriodS: 8,
  };
}

function forecasts(dates = ['2026-10-20'], timezone = 'UTC') {
  const window = {
    dates,
    startDate: dates[0] ?? '',
    endDate: dates[dates.length - 1] ?? '',
  };

  const weather: WeatherForecastType = {
    timezone,
    window,
    grid: {
      latitude: 0,
      longitude: 0,
    },
    hours: [],
    daylight: [],
  };

  const marine: MarineForecastType = {
    timezone,
    window,
    grid: weather.grid,
    gridDistanceKm: 0,
    coverage: MarineCoverageEnum.WITHIN_RANGE,
    hours: [],
  };

  for (const date of dates) {
    const day = DateTime.fromISO(date, {
      zone: timezone,
    }).startOf('day');

    const end = day.plus({ days: 1 });

    weather.daylight.push({
      date,
      sunriseMs: day.set({ hour: 6 }).toMillis(),
      sunsetMs: day.set({ hour: 18 }).toMillis(),
    });

    for (let hour = day; hour < end; hour = hour.plus({ hours: 1 })) {
      weather.hours.push({
        ...weatherHour(hour.toMillis()),
        isDay: hour.hour >= 6 && hour.hour < 18,
      });

      marine.hours.push(marineHour(hour.toMillis()));
    }
  }

  const run = () =>
    assessActivities({
      timezone,
      window,
      weatherResult: {
        status: 'fulfilled',
        value: weather,
      },
      marineResult: {
        status: 'fulfilled',
        value: marine,
      },
    });

  return {
    weather,
    marine,
    window,
    timezone,
    run,
  };
}

function firstDay(input: ReturnType<typeof forecasts>, activity: ActivityEnum) {
  const day = input.run().find((group) => group.activity === activity)?.days[0];

  if (day === undefined) {
    throw new Error('Expected an assessment.');
  }

  return day;
}

describe('hourly scoring rules', () => {
  it.each([
    [ActivityEnum.SKIING, 100],
    [ActivityEnum.SURFING, 88],
    [ActivityEnum.OUTDOOR_SIGHTSEEING, 100],
    [ActivityEnum.INDOOR_SIGHTSEEING, 100],
  ])('matches the approved example for %s', (activity, expected) => {
    expect(scoreHour(activity, weatherHour(), marineHour())?.score).toBeCloseTo(
      expected,
    );
  });

  it('gives indoor 85 and outdoor 60 in 3 mm/h precipitation', () => {
    const weather = {
      ...weatherHour(),
      precipitationMm: 3,
    };

    expect(scoreHour(ActivityEnum.INDOOR_SIGHTSEEING, weather)?.score).toBe(85);

    expect(scoreHour(ActivityEnum.OUTDOOR_SIGHTSEEING, weather)?.score).toBe(
      60,
    );
  });

  it.each([
    [0, 0, ScoringCapEnum.NO_SNOW],
    [5, 20, ScoringCapEnum.LOW_SNOW],
  ])('caps ski with %i cm of snow', (snowDepthCm, expected, cap) => {
    const result = scoreHour(ActivityEnum.SKIING, {
      ...weatherHour(),
      snowDepthCm,
    });

    expect(result?.score).toBe(expected);
    expect(result?.caps).toContain(cap);
  });

  it('caps ski at the visibility and gust thresholds', () => {
    expect(
      scoreHour(ActivityEnum.SKIING, {
        ...weatherHour(),
        visibilityM: 200,
      })?.score,
    ).toBe(20);

    expect(
      scoreHour(ActivityEnum.SKIING, {
        ...weatherHour(),
        windGustsKmh: 60,
      })?.score,
    ).toBe(20);
  });

  it('does not evaluate ski when a cap-only input is missing', () => {
    expect(
      scoreHour(ActivityEnum.SKIING, {
        ...weatherHour(),
        windGustsKmh: null,
      }),
    ).toBeNull();
  });

  it('caps large waves rather than rewarding size indefinitely', () => {
    const result = scoreHour(ActivityEnum.SURFING, weatherHour(), {
      ...marineHour(),
      waveHeightM: 3,
      wavePeriodS: 10,
    });

    expect(result?.score).toBe(20);
    expect(result?.caps).toContain(ScoringCapEnum.LARGE_WAVES);
  });

  it.each(Object.values(ActivityEnum))(
    'applies the thunderstorm cap to %s',
    (activity) => {
      const result = scoreHour(
        activity,
        {
          ...weatherHour(),
          weatherCode: 95,
        },
        marineHour(),
      );

      expect(result?.score).toBe(
        activity === ActivityEnum.INDOOR_SIGHTSEEING ? 60 : 20,
      );
    },
  );

  it('distinguishes missing snow from zero and ignores unrelated missing fields', () => {
    const weather = {
      ...weatherHour(),
      snowDepthCm: null,
    };

    expect(scoreHour(ActivityEnum.SKIING, weather)).toBeNull();

    expect(scoreHour(ActivityEnum.OUTDOOR_SIGHTSEEING, weather)?.score).toBe(
      100,
    );
  });

  it('rejects non-finite observations and mismatched marine timestamps', () => {
    expect(
      scoreHour(ActivityEnum.OUTDOOR_SIGHTSEEING, {
        ...weatherHour(),
        precipitationMm: NaN,
      }),
    ).toBeNull();

    expect(
      scoreHour(ActivityEnum.SURFING, weatherHour(), marineHour(3_600_000)),
    ).toBeNull();
  });

  it.each([
    [39, SuitabilityEnum.POOR],
    [40, SuitabilityEnum.FAIR],
    [60, SuitabilityEnum.GOOD],
    [80, SuitabilityEnum.EXCELLENT],
  ])('classifies boundary score %i', (score, expected) => {
    expect(getSuitability(score)).toBe(expected);
  });

  it('keeps outputs finite and bounded while precipitation worsens monotonically', () => {
    let previous = 100;

    for (
      let precipitationMm = 0;
      precipitationMm <= 10;
      precipitationMm += 0.25
    ) {
      const value = scoreHour(ActivityEnum.OUTDOOR_SIGHTSEEING, {
        ...weatherHour(),
        precipitationMm,
      })?.score;

      expect(value).toBeDefined();
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(previous);

      previous = value ?? 0;
    }
  });
});

describe('daily assessments', () => {
  it('selects an early three-hour surf session and breaks window ties by time', () => {
    const input = forecasts();
    const day = firstDay(input, ActivityEnum.SURFING);

    expect(day.score).toBe(88);
    expect(day.rank).toBe(1);

    expect(day.window).toEqual({
      startMs: Date.parse('2026-10-20T06:00:00Z'),
      endMs: Date.parse('2026-10-20T09:00:00Z'),
    });
  });

  it('selects the best session instead of averaging the entire surf day', () => {
    const input = forecasts();

    input.marine.hours = input.marine.hours.map((hour) => ({
      ...hour,
      wavePeriodS:
        hour.timestampMs >= Date.parse('2026-10-20T12:00:00Z') ? 5 : 8,
    }));

    expect(firstDay(input, ActivityEnum.SURFING).score).toBe(88);
  });

  it('requires complete daylight data, even outside the winning surf window', () => {
    const input = forecasts();

    input.marine.hours = input.marine.hours.filter(
      (hour) => hour.timestampMs !== Date.parse('2026-10-20T17:00:00Z'),
    );

    expect(firstDay(input, ActivityEnum.SURFING)).toMatchObject({
      status: AssessmentStatusEnum.INSUFFICIENT_DATA,
      score: null,
      category: null,
      rank: null,
    });

    expect(firstDay(input, ActivityEnum.OUTDOOR_SIGHTSEEING).status).toBe(
      AssessmentStatusEnum.AVAILABLE,
    );
  });

  it('does not build a session from an hour partly before sunrise', () => {
    const input = forecasts();
    const daylight = input.weather.daylight[0];

    if (daylight === undefined) {
      throw new Error('Missing daylight fixture.');
    }

    daylight.sunriseMs = Date.parse('2026-10-20T06:30:00Z');

    expect(firstDay(input, ActivityEnum.SURFING).window?.startMs).toBe(
      Date.parse('2026-10-20T07:00:00Z'),
    );
  });

  it('distinguishes too little daylight from missing data', () => {
    const input = forecasts();
    const daylight = input.weather.daylight[0];

    if (daylight === undefined) {
      throw new Error('Missing daylight fixture.');
    }

    daylight.sunsetMs = Date.parse('2026-10-20T08:00:00Z');

    expect(firstDay(input, ActivityEnum.SURFING).status).toBe(
      AssessmentStatusEnum.NO_VALID_WINDOW,
    );
  });

  it('averages hourly caps before rounding rather than capping a whole day', () => {
    const input = forecasts();

    input.weather.hours = input.weather.hours.map((hour) => ({
      ...hour,
      weatherCode:
        hour.timestampMs === Date.parse('2026-10-20T09:00:00Z') ? 95 : 0,
    }));

    expect(firstDay(input, ActivityEnum.OUTDOOR_SIGHTSEEING).score).toBe(90);
  });

  it('rounds only the final mean and derives the category from that score', () => {
    const input = forecasts();

    input.weather.hours = input.weather.hours.map((hour) => ({
      ...hour,
      precipitationMm: 1.53,
    }));

    expect(firstDay(input, ActivityEnum.OUTDOOR_SIGHTSEEING)).toMatchObject({
      score: 80,
      category: SuitabilityEnum.EXCELLENT,
    });
  });

  it.each([
    ['2026-10-25', 'Europe/Berlin', 25],
    ['2026-03-29', 'Europe/Berlin', 23],
    ['2026-10-20', 'Asia/Kathmandu', 24],
  ])('uses local windows on %s in %s', (date, timezone, expectedHours) => {
    const input = forecasts([date], timezone);

    expect(input.weather.hours).toHaveLength(expectedHours);

    const day = firstDay(input, ActivityEnum.OUTDOOR_SIGHTSEEING);

    expect(day.score).toBe(100);

    expect(day.window?.startMs).toBe(
      DateTime.fromISO(`${date}T09:00`, {
        zone: timezone,
      }).toMillis(),
    );
  });

  it('preserves indoor assessments during polar night', () => {
    const input = forecasts();

    input.weather.daylight = [
      {
        date: '2026-10-20',
        sunriseMs: null,
        sunsetMs: null,
      },
    ];

    input.weather.hours = input.weather.hours.map((hour) => ({
      ...hour,
      isDay: false,
    }));

    expect(firstDay(input, ActivityEnum.SURFING).status).toBe(
      AssessmentStatusEnum.NO_VALID_WINDOW,
    );

    expect(firstDay(input, ActivityEnum.INDOOR_SIGHTSEEING).score).toBe(100);
  });

  it('handles polar daylight without inventing sunrise', () => {
    const input = forecasts();

    input.weather.daylight = [
      {
        date: '2026-10-20',
        sunriseMs: null,
        sunsetMs: null,
      },
    ];

    input.weather.hours = input.weather.hours.map((hour) => ({
      ...hour,
      isDay: true,
    }));

    expect(firstDay(input, ActivityEnum.SURFING).window?.startMs).toBe(
      Date.parse('2026-10-20T00:00:00Z'),
    );
  });

  it('does not mistake missing sunrise and mixed daylight flags for polar night', () => {
    const input = forecasts();

    input.weather.daylight = [
      {
        date: '2026-10-20',
        sunriseMs: null,
        sunsetMs: null,
      },
    ];

    expect(firstDay(input, ActivityEnum.SURFING).status).toBe(
      AssessmentStatusEnum.INSUFFICIENT_DATA,
    );
  });

  it('ranks tied scores by date and preserves chronological display order', () => {
    const input = forecasts(['2026-10-20', '2026-10-21']);

    const days = input
      .run()
      .find((group) => group.activity === ActivityEnum.SURFING)?.days;

    expect(days?.map((day) => [day.date, day.rank])).toEqual([
      ['2026-10-20', 1],
      ['2026-10-21', 2],
    ]);
  });

  it('keeps unavailable dates visible but out of the ranking', () => {
    const input = forecasts(['2026-10-20', '2026-10-21']);

    input.weather.hours = input.weather.hours.filter(
      (hour) => hour.timestampMs !== Date.parse('2026-10-20T09:00:00Z'),
    );

    const days = input
      .run()
      .find(
        (group) => group.activity === ActivityEnum.OUTDOOR_SIGHTSEEING,
      )?.days;

    expect(days?.map((day) => [day.date, day.rank])).toEqual([
      ['2026-10-20', null],
      ['2026-10-21', 1],
    ]);
  });

  it.each([
    MarineCoverageEnum.NO_MARINE_DATA,
    MarineCoverageEnum.OUTSIDE_RANGE,
  ])('handles marine coverage %s', (coverage) => {
    const input = forecasts();

    input.marine.coverage = coverage;

    expect(firstDay(input, ActivityEnum.SURFING).status).toBe(
      coverage === MarineCoverageEnum.OUTSIDE_RANGE
        ? AssessmentStatusEnum.LOCATION_UNSUPPORTED
        : AssessmentStatusEnum.INSUFFICIENT_DATA,
    );

    expect(firstDay(input, ActivityEnum.SKIING).status).toBe(
      AssessmentStatusEnum.AVAILABLE,
    );
  });

  it('keeps weather activities available when only the marine source fails', () => {
    const input = forecasts();

    const results = assessActivities({
      timezone: input.timezone,
      window: input.window,
      weatherResult: {
        status: 'fulfilled',
        value: input.weather,
      },
      marineResult: {
        status: 'rejected',
      },
    });

    expect(
      results.find((group) => group.activity === ActivityEnum.SURFING)?.days[0]
        ?.status,
    ).toBe(AssessmentStatusEnum.UPSTREAM_UNAVAILABLE);

    expect(
      results.find((group) => group.activity === ActivityEnum.SKIING)?.days[0]
        ?.score,
    ).toBe(100);
  });

  it('rejects duplicate timestamps rather than silently replacing observations', () => {
    const input = forecasts();
    const first = input.weather.hours[0];

    if (first === undefined) {
      throw new Error('Missing fixture.');
    }

    input.weather.hours.push(first);

    expect(firstDay(input, ActivityEnum.OUTDOOR_SIGHTSEEING).status).toBe(
      AssessmentStatusEnum.INSUFFICIENT_DATA,
    );
  });
});
