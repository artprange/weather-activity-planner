import type { ForecastWindowType } from './forecast.types.js';
import type { GeocodedLocationType } from '../locations/geocodedLocation.types.js';
import type { ActivityRankingType } from '../scoring/scoring.types.js';

type SourceAttributionType = {
  label: string;
  url: string;
};

type ActivityForecastType = {
  place: GeocodedLocationType;
  timezone: string;
  generatedAt: string;
  scoringVersion: string;
  window: ForecastWindowType;
  activities: ActivityRankingType[];
  attributions: SourceAttributionType[];
};

export type { SourceAttributionType, ActivityForecastType };
