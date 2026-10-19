import type {
  ForecastWindowType,
  WeatherForecastType,
  MarineForecastType,
} from '../forecasts/forecast.types.js';

enum ActivityEnum {
  SKIING = 'SKIING',
  SURFING = 'SURFING',
  OUTDOOR_SIGHTSEEING = 'OUTDOOR_SIGHTSEEING',
  INDOOR_SIGHTSEEING = 'INDOOR_SIGHTSEEING',
}

enum SuitabilityEnum {
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT',
}

enum AssessmentStatusEnum {
  AVAILABLE = 'AVAILABLE',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  NO_VALID_WINDOW = 'NO_VALID_WINDOW',
  LOCATION_UNSUPPORTED = 'LOCATION_UNSUPPORTED',
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE',
}

enum ScoringFactorEnum {
  SNOW_DEPTH = 'SNOW_DEPTH',
  TEMPERATURE = 'TEMPERATURE',
  APPARENT_TEMPERATURE = 'APPARENT_TEMPERATURE',
  WIND = 'WIND',
  GUSTS = 'GUSTS',
  VISIBILITY = 'VISIBILITY',
  RAIN = 'RAIN',
  PRECIPITATION = 'PRECIPITATION',
  WAVE_HEIGHT = 'WAVE_HEIGHT',
  WAVE_PERIOD = 'WAVE_PERIOD',
}

enum ScoringCapEnum {
  THUNDERSTORM = 'THUNDERSTORM',
  NO_SNOW = 'NO_SNOW',
  LOW_SNOW = 'LOW_SNOW',
  LOW_VISIBILITY = 'LOW_VISIBILITY',
  STRONG_GUSTS = 'STRONG_GUSTS',
  LARGE_WAVES = 'LARGE_WAVES',
}

type HourlyFactorType = {
  factor: ScoringFactorEnum;
  unit: string;
  value: number;
  score: number;
  points: number;
};

type HourlyScoreType = {
  timestampMs: number;
  score: number;
  factors: HourlyFactorType[];
  caps: ScoringCapEnum[];
};

type FactorSummaryType = {
  factor: ScoringFactorEnum;
  unit: string;
  meanValue: number;
  meanScore: number;
  meanPoints: number;
};

type AssessmentBaseType = {
  date: string;
  activity: ActivityEnum;
  summary: string;
  limitations: string[];
};

type AvailableAssessmentType = AssessmentBaseType & {
  status: AssessmentStatusEnum.AVAILABLE;
  score: number;
  category: SuitabilityEnum;
  rank: number | null;
  window: {
    startMs: number;
    endMs: number;
  };
  factors: FactorSummaryType[];
  caps: ScoringCapEnum[];
};

type UnavailableAssessmentType = AssessmentBaseType & {
  status: Exclude<AssessmentStatusEnum, AssessmentStatusEnum.AVAILABLE>;
  score: null;
  category: null;
  rank: null;
  window: null;
  factors: FactorSummaryType[];
  caps: ScoringCapEnum[];
};

type DailyAssessmentType = AvailableAssessmentType | UnavailableAssessmentType;

type ForecastSourceType<T> =
  | {
      status: 'fulfilled';
      value: T;
    }
  | {
      status: 'rejected';
      reason?: unknown;
    };

type ActivityScoringInputType = {
  timezone: string;
  window: ForecastWindowType;
  weatherResult: ForecastSourceType<WeatherForecastType>;
  marineResult: ForecastSourceType<MarineForecastType>;
};

type ActivityRankingType = {
  activity: ActivityEnum;
  days: DailyAssessmentType[];
};

export {
  ActivityEnum,
  SuitabilityEnum,
  AssessmentStatusEnum,
  ScoringFactorEnum,
  ScoringCapEnum,
};

export type {
  HourlyFactorType,
  HourlyScoreType,
  FactorSummaryType,
  DailyAssessmentType,
  AvailableAssessmentType,
  UnavailableAssessmentType,
  ActivityScoringInputType,
  ActivityRankingType,
};
