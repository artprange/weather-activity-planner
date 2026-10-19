import type { GraphQLResolveInfo } from 'graphql';
import type { GeocodedLocationType } from '../locations/geocodedLocation.types.js';
import type { ForecastWindowType } from '../forecasts/forecast.types.js';
import type { EvaluationWindowType } from './graphqlModels.types.js';
import type {
  FactorSummaryType,
  DailyAssessmentType,
  ActivityRankingType,
} from '../scoring/scoring.types.js';
import type {
  SourceAttributionType,
  ActivityForecastType,
} from '../forecasts/activityForecast.types.js';
import type { GraphQLContextType } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
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

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActivityEnum: ActivityEnum;
  SuitabilityEnum: SuitabilityEnum;
  AssessmentStatusEnum: AssessmentStatusEnum;
  ScoringFactorEnum: ScoringFactorEnum;
  ScoringCapEnum: ScoringCapEnum;
  Place: ResolverTypeWrapper<GeocodedLocationType>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ForecastWindow: ResolverTypeWrapper<ForecastWindowType>;
  EvaluationWindow: ResolverTypeWrapper<EvaluationWindowType>;
  FactorSummary: ResolverTypeWrapper<FactorSummaryType>;
  DailyAssessment: ResolverTypeWrapper<DailyAssessmentType>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  ActivityRanking: ResolverTypeWrapper<ActivityRankingType>;
  SourceAttribution: ResolverTypeWrapper<SourceAttributionType>;
  ActivityForecast: ResolverTypeWrapper<ActivityForecastType>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Place: GeocodedLocationType;
  ID: Scalars['ID']['output'];
  String: Scalars['String']['output'];
  Float: Scalars['Float']['output'];
  ForecastWindow: ForecastWindowType;
  EvaluationWindow: EvaluationWindowType;
  FactorSummary: FactorSummaryType;
  DailyAssessment: DailyAssessmentType;
  Int: Scalars['Int']['output'];
  ActivityRanking: ActivityRankingType;
  SourceAttribution: SourceAttributionType;
  ActivityForecast: ActivityForecastType;
  Query: Record<PropertyKey, never>;
  Boolean: Scalars['Boolean']['output'];
};

export type PlaceResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['Place'] =
    ResolversParentTypes['Place'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  countryCode?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ForecastWindowResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['ForecastWindow'] =
    ResolversParentTypes['ForecastWindow'],
> = {
  dates?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type EvaluationWindowResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['EvaluationWindow'] =
    ResolversParentTypes['EvaluationWindow'],
> = {
  startAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FactorSummaryResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['FactorSummary'] =
    ResolversParentTypes['FactorSummary'],
> = {
  factor?: Resolver<
    ResolversTypes['ScoringFactorEnum'],
    ParentType,
    ContextType
  >;
  unit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  meanValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  meanScore?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  meanPoints?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type DailyAssessmentResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['DailyAssessment'] =
    ResolversParentTypes['DailyAssessment'],
> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  activity?: Resolver<ResolversTypes['ActivityEnum'], ParentType, ContextType>;
  status?: Resolver<
    ResolversTypes['AssessmentStatusEnum'],
    ParentType,
    ContextType
  >;
  score?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  category?: Resolver<
    Maybe<ResolversTypes['SuitabilityEnum']>,
    ParentType,
    ContextType
  >;
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  window?: Resolver<
    Maybe<ResolversTypes['EvaluationWindow']>,
    ParentType,
    ContextType
  >;
  factors?: Resolver<
    Array<ResolversTypes['FactorSummary']>,
    ParentType,
    ContextType
  >;
  caps?: Resolver<
    Array<ResolversTypes['ScoringCapEnum']>,
    ParentType,
    ContextType
  >;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  limitations?: Resolver<
    Array<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
};

export type ActivityRankingResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['ActivityRanking'] =
    ResolversParentTypes['ActivityRanking'],
> = {
  activity?: Resolver<ResolversTypes['ActivityEnum'], ParentType, ContextType>;
  days?: Resolver<
    Array<ResolversTypes['DailyAssessment']>,
    ParentType,
    ContextType
  >;
};

export type SourceAttributionResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['SourceAttribution'] =
    ResolversParentTypes['SourceAttribution'],
> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ActivityForecastResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['ActivityForecast'] =
    ResolversParentTypes['ActivityForecast'],
> = {
  place?: Resolver<ResolversTypes['Place'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scoringVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  window?: Resolver<ResolversTypes['ForecastWindow'], ParentType, ContextType>;
  activities?: Resolver<
    Array<ResolversTypes['ActivityRanking']>,
    ParentType,
    ContextType
  >;
  attributions?: Resolver<
    Array<ResolversTypes['SourceAttribution']>,
    ParentType,
    ContextType
  >;
};

export type QueryResolvers<
  ContextType = GraphQLContextType,
  ParentType extends ResolversParentTypes['Query'] =
    ResolversParentTypes['Query'],
> = {
  health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  searchPlaces?: Resolver<
    Array<ResolversTypes['Place']>,
    ParentType,
    ContextType,
    RequireFields<QuerySearchPlacesArgs, 'query'>
  >;
  activityForecast?: Resolver<
    Maybe<ResolversTypes['ActivityForecast']>,
    ParentType,
    ContextType,
    RequireFields<QueryActivityForecastArgs, 'placeId'>
  >;
};

export type Resolvers<ContextType = GraphQLContextType> = {
  Place?: PlaceResolvers<ContextType>;
  ForecastWindow?: ForecastWindowResolvers<ContextType>;
  EvaluationWindow?: EvaluationWindowResolvers<ContextType>;
  FactorSummary?: FactorSummaryResolvers<ContextType>;
  DailyAssessment?: DailyAssessmentResolvers<ContextType>;
  ActivityRanking?: ActivityRankingResolvers<ContextType>;
  SourceAttribution?: SourceAttributionResolvers<ContextType>;
  ActivityForecast?: ActivityForecastResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
};
