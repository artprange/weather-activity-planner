import type {
  ActivityEnum,
  AssessmentStatusEnum,
  ScoringCapEnum,
  ScoringFactorEnum,
  SuitabilityEnum,
} from '@/graphql/generated';

const ActivityLabels: Record<ActivityEnum, string> = {
  SKIING: 'Skiing',
  SURFING: 'Surfing',
  OUTDOOR_SIGHTSEEING: 'Outdoor sightseeing',
  INDOOR_SIGHTSEEING: 'Indoor sightseeing',
};

const StatusLabels: Record<AssessmentStatusEnum, string> = {
  AVAILABLE: 'Available',
  INSUFFICIENT_DATA: 'Insufficient data',
  NO_VALID_WINDOW: 'No eligible time window',
  LOCATION_UNSUPPORTED: 'Location outside supported coverage',
  UPSTREAM_UNAVAILABLE: 'Forecast source unavailable',
};

const SuitabilityLabels: Record<SuitabilityEnum, string> = {
  POOR: 'Poor',
  FAIR: 'Fair',
  GOOD: 'Good',
  EXCELLENT: 'Excellent',
};

const SuitabilityStyles = {
  POOR: {
    BADGE: 'bg-score-poor text-score-poor-foreground',
    BAR: 'bg-score-poor-foreground',
  },
  FAIR: {
    BADGE: 'bg-score-fair text-score-fair-foreground',
    BAR: 'bg-score-fair-foreground',
  },
  GOOD: {
    BADGE: 'bg-score-good text-score-good-foreground',
    BAR: 'bg-score-good-foreground',
  },
  EXCELLENT: {
    BADGE: 'bg-score-excellent text-score-excellent-foreground',
    BAR: 'bg-score-excellent-foreground',
  },
} satisfies Record<SuitabilityEnum, { BADGE: string; BAR: string }>;

const FactorLabels: Record<ScoringFactorEnum, string> = {
  SNOW_DEPTH: 'Snow depth',
  TEMPERATURE: 'Temperature',
  APPARENT_TEMPERATURE: 'Feels-like temperature',
  WIND: 'Wind',
  GUSTS: 'Wind gusts',
  VISIBILITY: 'Visibility',
  RAIN: 'Liquid precipitation',
  PRECIPITATION: 'Total precipitation',
  WAVE_HEIGHT: 'Wave height',
  WAVE_PERIOD: 'Wave period',
};

const CapLabels: Record<ScoringCapEnum, string> = {
  THUNDERSTORM: 'Thunderstorm conditions',
  NO_SNOW: 'No snow',
  LOW_SNOW: 'Low snow depth',
  LOW_VISIBILITY: 'Low visibility',
  STRONG_GUSTS: 'Strong wind gusts',
  LARGE_WAVES: 'Large waves',
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatForecastDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatForecastTime(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(instant));
}

function formatGeneratedAt(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(instant));
}

export {
  ActivityLabels,
  StatusLabels,
  SuitabilityLabels,
  SuitabilityStyles,
  FactorLabels,
  CapLabels,
  numberFormatter,
  formatForecastDate,
  formatForecastTime,
  formatGeneratedAt,
};
