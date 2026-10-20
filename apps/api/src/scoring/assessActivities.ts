import { DateTime } from 'luxon';

import { MarineCoverageEnum } from '../forecasts/forecast.types.js';
import type {
  WeatherHourType,
  WeatherForecastType,
} from '../forecasts/forecast.types.js';

import { ActivityEnum, AssessmentStatusEnum } from './scoring.types.js';
import type {
  ActivityScoringInputType,
  ActivityRankingType,
  DailyAssessmentType,
  HourlyScoreType,
  AvailableAssessmentType,
  UnavailableAssessmentType,
} from './scoring.types.js';
import { scoreHour, getSuitability } from './scoreHour.js';

const ScoringConstants = {
  HOUR_MS: 3_600_000,
  SURF_HOURS: 3,
  START_HOUR: 9,
  END_HOUR: 17,
};

const ActivityLabels: Record<ActivityEnum, string> = {
  [ActivityEnum.SKIING]: 'Skiing',
  [ActivityEnum.SURFING]: 'Surfing',
  [ActivityEnum.OUTDOOR_SIGHTSEEING]: 'Outdoor sightseeing',
  [ActivityEnum.INDOOR_SIGHTSEEING]: 'Indoor sightseeing',
};

const StatusMessages: Record<
  Exclude<AssessmentStatusEnum, AssessmentStatusEnum.AVAILABLE>,
  string
> = {
  [AssessmentStatusEnum.INSUFFICIENT_DATA]:
    'Required forecast observations are missing.',
  [AssessmentStatusEnum.NO_VALID_WINDOW]:
    'No suitable evaluation time window is available.',
  [AssessmentStatusEnum.LOCATION_UNSUPPORTED]:
    'The marine grid is outside the supported distance.',
  [AssessmentStatusEnum.NO_NEARBY_COAST]:
    'No nearby ocean coastline was found for this location. Try a coastal destination.',
  [AssessmentStatusEnum.UPSTREAM_UNAVAILABLE]:
    'The required forecast service is unavailable.',
};

const ActivityLimitations: Record<ActivityEnum, string[]> = {
  [ActivityEnum.SKIING]: [
    'City weather does not confirm resort snow cover or opening status.',
  ],
  [ActivityEnum.SURFING]: [
    'Tides, beach orientation and breaking-wave conditions are not evaluated.',
    'The score describes the best three-hour session, not the whole day.',
  ],
  [ActivityEnum.OUTDOOR_SIGHTSEEING]: [
    'This evaluates weather conditions, not attraction availability.',
  ],
  [ActivityEnum.INDOOR_SIGHTSEEING]: [
    'The score reflects weather exposure during transfers, not indoor venue quality.',
  ],
};

function unavailable(
  date: string,
  activity: ActivityEnum,
  status: UnavailableAssessmentType['status'],
): UnavailableAssessmentType {
  return {
    date,
    activity,
    status,
    score: null,
    category: null,
    rank: null,
    window: null,
    factors: [],
    caps: [],
    summary: StatusMessages[status],
    limitations: [...ActivityLimitations[activity]],
  };
}

function getDaySlots(
  date: string,
  timezone: string,
  anchorDate: string,
): {
  slots: number[];
  workStart: number;
  workEnd: number;
} {
  const start = DateTime.fromISO(date, {
    zone: timezone,
  }).startOf('day');

  const anchor = DateTime.fromISO(anchorDate, {
    zone: timezone,
  }).startOf('day');

  if (!start.isValid || !anchor.isValid) {
    throw new Error('Invalid scoring calendar.');
  }

  const end = start.plus({ days: 1 }).toMillis();

  const first =
    anchor.toMillis() +
    Math.ceil(
      (start.toMillis() - anchor.toMillis()) / ScoringConstants.HOUR_MS,
    ) *
      ScoringConstants.HOUR_MS;

  const slots: number[] = [];

  for (
    let time = first;
    time + ScoringConstants.HOUR_MS <= end;
    time += ScoringConstants.HOUR_MS
  ) {
    slots.push(time);
  }

  return {
    slots,
    workStart: start.set({ hour: ScoringConstants.START_HOUR }).toMillis(),
    workEnd: start.set({ hour: ScoringConstants.END_HOUR }).toMillis(),
  };
}

function daylightSlots(
  date: string,
  slots: number[],
  weather: WeatherForecastType,
  observations: Map<number, WeatherHourType>,
): number[] | null {
  const daylight = weather.daylight.find((entry) => entry.date === date);

  if (daylight === undefined) {
    return null;
  }

  const { sunriseMs, sunsetMs } = daylight;

  if (sunriseMs !== null && sunsetMs !== null) {
    if (
      !Number.isFinite(sunriseMs) ||
      !Number.isFinite(sunsetMs) ||
      sunsetMs <= sunriseMs
    ) {
      return null;
    }

    return slots.filter(
      (time) =>
        time >= sunriseMs && time + ScoringConstants.HOUR_MS <= sunsetMs,
    );
  }

  if (sunriseMs === null && sunsetMs === null && slots.length > 0) {
    if (slots.every((time) => observations.get(time)?.isDay === true)) {
      return slots;
    }

    if (slots.every((time) => observations.get(time)?.isDay === false)) {
      return [];
    }
  }

  return null;
}

function average(hours: HourlyScoreType[]): number {
  return hours.reduce((total, hour) => total + hour.score, 0) / hours.length;
}

function bestSurfWindow(hours: HourlyScoreType[]): HourlyScoreType[] | null {
  let best: HourlyScoreType[] | null = null;

  for (
    let index = 0;
    index <= hours.length - ScoringConstants.SURF_HOURS;
    index += 1
  ) {
    const candidate = hours.slice(index, index + ScoringConstants.SURF_HOURS);

    const first = candidate[0];

    if (
      first === undefined ||
      !candidate.every(
        (hour, offset) =>
          hour.timestampMs ===
          first.timestampMs + offset * ScoringConstants.HOUR_MS,
      )
    ) {
      continue;
    }

    if (best === null || average(candidate) > average(best)) {
      best = candidate;
    }
  }

  return best;
}

function summarize(
  date: string,
  activity: ActivityEnum,
  hours: HourlyScoreType[],
): AvailableAssessmentType {
  const first = hours[0];
  const last = hours[hours.length - 1];

  if (first === undefined || last === undefined) {
    throw new Error('Cannot summarize an empty window.');
  }

  const score = Math.round(average(hours));
  const category = getSuitability(score);

  return {
    date,
    activity,
    status: AssessmentStatusEnum.AVAILABLE,
    score,
    category,
    rank: null,
    window: {
      startMs: first.timestampMs,
      endMs: last.timestampMs + ScoringConstants.HOUR_MS,
    },
    factors: first.factors.map((factor) => {
      const matching = hours.map((hour) => {
        const found = hour.factors.find(
          (entry) => entry.factor === factor.factor,
        );

        if (found === undefined) {
          throw new Error('Inconsistent hourly factors.');
        }

        return found;
      });

      return {
        factor: factor.factor,
        unit: factor.unit,
        meanValue:
          matching.reduce((sum, entry) => sum + entry.value, 0) / hours.length,
        meanScore:
          matching.reduce((sum, entry) => sum + entry.score, 0) / hours.length,
        meanPoints:
          matching.reduce((sum, entry) => sum + entry.points, 0) / hours.length,
      };
    }),
    caps: [...new Set(hours.flatMap((hour) => hour.caps))],
    summary:
      `${ActivityLabels[activity]}: ` +
      `${category.toLowerCase()} weather conditions.`,
    limitations: [...ActivityLimitations[activity]],
  };
}

function assessActivities(
  input: ActivityScoringInputType,
): ActivityRankingType[] {
  const weather =
    input.weatherResult.status === 'fulfilled'
      ? input.weatherResult.value
      : null;

  const marine =
    input.marineResult.status === 'fulfilled' ? input.marineResult.value : null;

  const weatherByTime = new Map(
    weather?.hours.map((hour) => [hour.timestampMs, hour]),
  );

  const marineByTime = new Map(
    marine?.hours.map((hour) => [hour.timestampMs, hour]),
  );

  return Object.values(ActivityEnum).map((activity) => {
    const days: DailyAssessmentType[] = input.window.dates.map((date) => {
      if (activity === ActivityEnum.SURFING && input.hasNearbyCoast === false) {
        return unavailable(
          date,
          activity,
          AssessmentStatusEnum.NO_NEARBY_COAST,
        );
      }
      if (weather === null) {
        return unavailable(
          date,
          activity,
          AssessmentStatusEnum.UPSTREAM_UNAVAILABLE,
        );
      }

      if (
        weather.timezone !== input.timezone ||
        weatherByTime.size !== weather.hours.length
      ) {
        return unavailable(
          date,
          activity,
          AssessmentStatusEnum.INSUFFICIENT_DATA,
        );
      }

      if (activity === ActivityEnum.SURFING) {
        if (marine === null) {
          return unavailable(
            date,
            activity,
            AssessmentStatusEnum.UPSTREAM_UNAVAILABLE,
          );
        }

        if (marine.coverage === MarineCoverageEnum.OUTSIDE_RANGE) {
          return unavailable(
            date,
            activity,
            AssessmentStatusEnum.LOCATION_UNSUPPORTED,
          );
        }

        if (
          marine.coverage === MarineCoverageEnum.NO_MARINE_DATA ||
          marine.timezone !== input.timezone ||
          marineByTime.size !== marine.hours.length
        ) {
          return unavailable(
            date,
            activity,
            AssessmentStatusEnum.INSUFFICIENT_DATA,
          );
        }
      }

      const calendar = getDaySlots(
        date,
        input.timezone,
        input.window.startDate,
      );

      let slots = calendar.slots;

      if (activity !== ActivityEnum.INDOOR_SIGHTSEEING) {
        const daylight = daylightSlots(date, slots, weather, weatherByTime);

        if (daylight === null) {
          return unavailable(
            date,
            activity,
            AssessmentStatusEnum.INSUFFICIENT_DATA,
          );
        }

        slots = daylight;
      }

      if (activity !== ActivityEnum.SURFING) {
        slots = slots.filter(
          (time) =>
            time >= calendar.workStart &&
            time + ScoringConstants.HOUR_MS <= calendar.workEnd,
        );
      }

      if (
        slots.length === 0 ||
        (activity === ActivityEnum.SURFING &&
          slots.length < ScoringConstants.SURF_HOURS)
      ) {
        return unavailable(
          date,
          activity,
          AssessmentStatusEnum.NO_VALID_WINDOW,
        );
      }

      const hours: HourlyScoreType[] = [];

      for (const time of slots) {
        const observation = weatherByTime.get(time);

        const score =
          observation === undefined
            ? null
            : scoreHour(activity, observation, marineByTime.get(time));

        if (score === null) {
          return unavailable(
            date,
            activity,
            AssessmentStatusEnum.INSUFFICIENT_DATA,
          );
        }

        hours.push(score);
      }

      const selected =
        activity === ActivityEnum.SURFING ? bestSurfWindow(hours) : hours;

      return selected === null
        ? unavailable(date, activity, AssessmentStatusEnum.NO_VALID_WINDOW)
        : summarize(date, activity, selected);
    });

    const ranked = days
      .filter(
        (day): day is AvailableAssessmentType =>
          day.status === AssessmentStatusEnum.AVAILABLE,
      )
      .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));

    const ranks = new Map(ranked.map((day, index) => [day.date, index + 1]));

    return {
      activity,
      days: days.map((day) => {
        if (day.status !== AssessmentStatusEnum.AVAILABLE) {
          return day;
        }

        const rank = ranks.get(day.date);

        if (rank === undefined) {
          throw new Error('Missing assessment rank.');
        }

        return {
          ...day,
          rank,
        };
      }),
    };
  });
}

export { assessActivities };
