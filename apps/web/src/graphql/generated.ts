export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type ActivityEnum =
  'SKIING' | 'SURFING' | 'OUTDOOR_SIGHTSEEING' | 'INDOOR_SIGHTSEEING';

export type SuitabilityEnum = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export type AssessmentStatusEnum =
  | 'AVAILABLE'
  | 'INSUFFICIENT_DATA'
  | 'NO_VALID_WINDOW'
  | 'LOCATION_UNSUPPORTED'
  | 'NO_NEARBY_COAST'
  | 'UPSTREAM_UNAVAILABLE';

export type ScoringFactorEnum =
  | 'SNOW_DEPTH'
  | 'TEMPERATURE'
  | 'APPARENT_TEMPERATURE'
  | 'WIND'
  | 'GUSTS'
  | 'VISIBILITY'
  | 'RAIN'
  | 'PRECIPITATION'
  | 'WAVE_HEIGHT'
  | 'WAVE_PERIOD';

export type ScoringCapEnum =
  | 'THUNDERSTORM'
  | 'NO_SNOW'
  | 'LOW_SNOW'
  | 'LOW_VISIBILITY'
  | 'STRONG_GUSTS'
  | 'LARGE_WAVES';

export type Place = {
  __typename?: 'Place';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  region?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  timezone: Scalars['String']['output'];
};

export type ForecastWindow = {
  __typename?: 'ForecastWindow';
  dates: Array<Scalars['String']['output']>;
  startDate: Scalars['String']['output'];
  endDate: Scalars['String']['output'];
};

export type EvaluationWindow = {
  __typename?: 'EvaluationWindow';
  startAt: Scalars['String']['output'];
  endAt: Scalars['String']['output'];
};

export type FactorSummary = {
  __typename?: 'FactorSummary';
  factor: ScoringFactorEnum;
  unit: Scalars['String']['output'];
  meanValue: Scalars['Float']['output'];
  meanScore: Scalars['Float']['output'];
  meanPoints: Scalars['Float']['output'];
};

export type DailyAssessment = {
  __typename?: 'DailyAssessment';
  date: Scalars['String']['output'];
  activity: ActivityEnum;
  status: AssessmentStatusEnum;
  score?: Maybe<Scalars['Int']['output']>;
  category?: Maybe<SuitabilityEnum>;
  rank?: Maybe<Scalars['Int']['output']>;
  window?: Maybe<EvaluationWindow>;
  factors: Array<FactorSummary>;
  caps: Array<ScoringCapEnum>;
  summary: Scalars['String']['output'];
  limitations: Array<Scalars['String']['output']>;
};

export type ActivityRanking = {
  __typename?: 'ActivityRanking';
  activity: ActivityEnum;
  days: Array<DailyAssessment>;
};

export type SourceAttribution = {
  __typename?: 'SourceAttribution';
  label: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type ActivityForecast = {
  __typename?: 'ActivityForecast';
  place: Place;
  timezone: Scalars['String']['output'];
  generatedAt: Scalars['String']['output'];
  scoringVersion: Scalars['String']['output'];
  window: ForecastWindow;
  activities: Array<ActivityRanking>;
  attributions: Array<SourceAttribution>;
};

export type Query = {
  __typename?: 'Query';
  health: Scalars['String']['output'];
  searchPlaces: Array<Place>;
  activityForecast?: Maybe<ActivityForecast>;
};

export type QuerySearchPlacesArgs = {
  query: Scalars['String']['input'];
};

export type QueryActivityForecastArgs = {
  placeId: Scalars['ID']['input'];
};
