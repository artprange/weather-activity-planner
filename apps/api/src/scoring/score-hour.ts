import type {
  WeatherHourType,
  MarineHourType,
} from '../forecasts/forecast.types.js';

import {
  ActivityEnum,
  SuitabilityEnum,
  ScoringFactorEnum,
  ScoringCapEnum,
} from './scoring.types.js';
import type { HourlyFactorType, HourlyScoreType } from './scoring.types.js';

type FactorRuleType = {
  factor: ScoringFactorEnum;
  unit: string;
  weight: number;
  read: (
    weather: WeatherHourType,
    marine?: MarineHourType,
  ) => number | null | undefined;
  curve: (value: number) => number;
};

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

const rising =
  (low: number, high: number) =>
  (value: number): number =>
    clamp((100 * (value - low)) / (high - low));

const falling =
  (low: number, high: number) =>
  (value: number): number =>
    100 - rising(low, high)(value);

const band =
  (low: number, idealLow: number, idealHigh: number, high: number) =>
  (value: number): number =>
    Math.min(rising(low, idealLow)(value), falling(idealHigh, high)(value));

function rule(
  factor: ScoringFactorEnum,
  unit: string,
  weight: number,
  read: FactorRuleType['read'],
  curve: FactorRuleType['curve'],
): FactorRuleType {
  return {
    factor,
    unit,
    weight,
    read,
    curve,
  };
}

const FactorRules: Record<ActivityEnum, FactorRuleType[]> = {
  [ActivityEnum.SKIING]: [
    rule(
      ScoringFactorEnum.SNOW_DEPTH,
      'cm',
      0.4,
      (weather) => weather.snowDepthCm,
      rising(0, 50),
    ),
    rule(
      ScoringFactorEnum.TEMPERATURE,
      '°C',
      0.2,
      (weather) => weather.temperatureC,
      band(-20, -8, -1, 5),
    ),
    rule(
      ScoringFactorEnum.WIND,
      'km/h',
      0.15,
      (weather) => weather.windSpeedKmh,
      falling(15, 50),
    ),
    rule(
      ScoringFactorEnum.VISIBILITY,
      'm',
      0.15,
      (weather) => weather.visibilityM,
      rising(200, 5000),
    ),
    rule(
      ScoringFactorEnum.RAIN,
      'mm',
      0.1,
      (weather) => weather.liquidPrecipitationMm,
      falling(0, 2),
    ),
  ],

  [ActivityEnum.SURFING]: [
    rule(
      ScoringFactorEnum.WAVE_HEIGHT,
      'm',
      0.45,
      (_weather, marine) => marine?.waveHeightM,
      band(0.2, 0.8, 1.5, 3),
    ),
    rule(
      ScoringFactorEnum.WAVE_PERIOD,
      's',
      0.3,
      (_weather, marine) => marine?.wavePeriodS,
      rising(5, 10),
    ),
    rule(
      ScoringFactorEnum.WIND,
      'km/h',
      0.15,
      (weather) => weather.windSpeedKmh,
      falling(10, 30),
    ),
    rule(
      ScoringFactorEnum.GUSTS,
      'km/h',
      0.1,
      (weather) => weather.windGustsKmh,
      falling(15, 40),
    ),
  ],

  [ActivityEnum.OUTDOOR_SIGHTSEEING]: [
    rule(
      ScoringFactorEnum.APPARENT_TEMPERATURE,
      '°C',
      0.4,
      (weather) => weather.apparentTemperatureC,
      band(0, 16, 26, 38),
    ),
    rule(
      ScoringFactorEnum.PRECIPITATION,
      'mm',
      0.4,
      (weather) => weather.precipitationMm,
      falling(0, 3),
    ),
    rule(
      ScoringFactorEnum.WIND,
      'km/h',
      0.2,
      (weather) => weather.windSpeedKmh,
      falling(15, 45),
    ),
  ],

  [ActivityEnum.INDOOR_SIGHTSEEING]: [
    rule(
      ScoringFactorEnum.APPARENT_TEMPERATURE,
      '°C',
      0.15,
      (weather) => weather.apparentTemperatureC,
      band(-5, 10, 30, 40),
    ),
    rule(
      ScoringFactorEnum.PRECIPITATION,
      'mm',
      0.15,
      (weather) => weather.precipitationMm,
      falling(0, 3),
    ),
    rule(
      ScoringFactorEnum.WIND,
      'km/h',
      0.1,
      (weather) => weather.windSpeedKmh,
      falling(20, 50),
    ),
  ],
};

function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function scoreHour(
  activity: ActivityEnum,
  weather: WeatherHourType,
  marine?: MarineHourType,
): HourlyScoreType | null {
  if (
    !finite(weather.timestampMs) ||
    !finite(weather.weatherCode) ||
    !Number.isInteger(weather.weatherCode) ||
    weather.weatherCode < 0 ||
    weather.weatherCode > 99
  ) {
    return null;
  }

  if (
    activity === ActivityEnum.SKIING &&
    (!finite(weather.windGustsKmh) || weather.windGustsKmh < 0)
  ) {
    return null;
  }

  if (
    activity === ActivityEnum.SURFING &&
    marine?.timestampMs !== weather.timestampMs
  ) {
    return null;
  }

  const indoor = activity === ActivityEnum.INDOOR_SIGHTSEEING;
  const factors: HourlyFactorType[] = [];

  for (const definition of FactorRules[activity]) {
    const value = definition.read(weather, marine);

    if (!finite(value) || (definition.unit !== '°C' && value < 0)) {
      return null;
    }

    const score = definition.curve(value);

    const points = indoor
      ? -(100 - score) * definition.weight
      : score * definition.weight;

    factors.push({
      factor: definition.factor,
      unit: definition.unit,
      value,
      score,
      points,
    });
  }

  let score =
    (indoor ? 100 : 0) +
    factors.reduce((sum, factor) => sum + factor.points, 0);

  const caps: ScoringCapEnum[] = [];

  const applyCap = (limit: number, reason: ScoringCapEnum): void => {
    score = Math.min(score, limit);
    caps.push(reason);
  };

  if ([95, 96, 99].includes(weather.weatherCode)) {
    applyCap(indoor ? 60 : 20, ScoringCapEnum.THUNDERSTORM);
  }

  if (activity === ActivityEnum.SKIING) {
    if (weather.snowDepthCm === 0) {
      applyCap(0, ScoringCapEnum.NO_SNOW);
    } else if (weather.snowDepthCm !== null && weather.snowDepthCm < 10) {
      applyCap(20, ScoringCapEnum.LOW_SNOW);
    }

    if (weather.visibilityM !== null && weather.visibilityM <= 200) {
      applyCap(20, ScoringCapEnum.LOW_VISIBILITY);
    }

    if (weather.windGustsKmh !== null && weather.windGustsKmh >= 60) {
      applyCap(20, ScoringCapEnum.STRONG_GUSTS);
    }
  }

  if (
    activity === ActivityEnum.SURFING &&
    marine?.waveHeightM !== null &&
    marine?.waveHeightM !== undefined &&
    marine.waveHeightM >= 3
  ) {
    applyCap(20, ScoringCapEnum.LARGE_WAVES);
  }

  return {
    timestampMs: weather.timestampMs,
    score: clamp(score),
    factors,
    caps,
  };
}

function getSuitability(score: number): SuitabilityEnum {
  if (score >= 80) {
    return SuitabilityEnum.EXCELLENT;
  }

  if (score >= 60) {
    return SuitabilityEnum.GOOD;
  }

  if (score >= 40) {
    return SuitabilityEnum.FAIR;
  }

  return SuitabilityEnum.POOR;
}

export { scoreHour, getSuitability };
