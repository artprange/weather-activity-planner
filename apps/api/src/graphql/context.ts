import { getActivityForecast } from '../forecasts/getActivityForecast.js';
import { searchGeocodedLocations } from '../integrations/open-meteo/geocoding.js';

type GraphQLContextType = {
  searchPlaces: typeof searchGeocodedLocations;
  getActivityForecast: typeof getActivityForecast;
  reportError: (error: unknown) => void;
};

function createGraphQLContext(): GraphQLContextType {
  return {
    searchPlaces: searchGeocodedLocations,
    getActivityForecast,
    reportError: (error: unknown): void => {
      console.error('GraphQL request failed.', error);
    },
  };
}

export { createGraphQLContext };
export type { GraphQLContextType };
