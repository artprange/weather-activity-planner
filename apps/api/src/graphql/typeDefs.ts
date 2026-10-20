const typeDefs = /* GraphQL */ `
  enum ActivityEnum {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }

  enum SuitabilityEnum {
    POOR
    FAIR
    GOOD
    EXCELLENT
  }

  enum AssessmentStatusEnum {
    AVAILABLE
    INSUFFICIENT_DATA
    NO_VALID_WINDOW
    LOCATION_UNSUPPORTED
    NO_NEARBY_COAST
    UPSTREAM_UNAVAILABLE
  }

  enum ScoringFactorEnum {
    SNOW_DEPTH
    TEMPERATURE
    APPARENT_TEMPERATURE
    WIND
    GUSTS
    VISIBILITY
    RAIN
    PRECIPITATION
    WAVE_HEIGHT
    WAVE_PERIOD
  }

  enum ScoringCapEnum {
    THUNDERSTORM
    NO_SNOW
    LOW_SNOW
    LOW_VISIBILITY
    STRONG_GUSTS
    LARGE_WAVES
  }

  type Place {
    id: ID!
    name: String!
    region: String
    country: String
    countryCode: String
    latitude: Float!
    longitude: Float!
    timezone: String!
  }

  type ForecastWindow {
    dates: [String!]!
    startDate: String!
    endDate: String!
  }

  type EvaluationWindow {
    startAt: String!
    endAt: String!
  }

  type FactorSummary {
    factor: ScoringFactorEnum!
    unit: String!
    meanValue: Float!
    meanScore: Float!
    meanPoints: Float!
  }

  type DailyAssessment {
    date: String!
    activity: ActivityEnum!
    status: AssessmentStatusEnum!
    score: Int
    category: SuitabilityEnum
    rank: Int
    window: EvaluationWindow
    factors: [FactorSummary!]!
    caps: [ScoringCapEnum!]!
    summary: String!
    limitations: [String!]!
  }

  type ActivityRanking {
    activity: ActivityEnum!
    days: [DailyAssessment!]!
  }

  type SourceAttribution {
    label: String!
    url: String!
  }

  type ActivityForecast {
    place: Place!
    timezone: String!
    generatedAt: String!
    scoringVersion: String!
    window: ForecastWindow!
    activities: [ActivityRanking!]!
    attributions: [SourceAttribution!]!
  }

  type Query {
    health: String!
    searchPlaces(query: String!): [Place!]!
    activityForecast(placeId: ID!): ActivityForecast
  }
`;

export { typeDefs };
