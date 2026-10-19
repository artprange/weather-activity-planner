import { queryOptions } from '@tanstack/react-query';

import { requestGraphQL } from '@/lib/graphqlClient';

import {
  placeSearchInputSchema,
  searchPlacesDataSchema,
} from './placeSearch.schemas';

const searchPlacesDocument = /* GraphQL */ `
  query SearchPlaces($query: String!) {
    searchPlaces(query: $query) {
      id
      name
      region
      country
      countryCode
      latitude
      longitude
      timezone
    }
  }
`;

function searchPlacesOptions(query: string) {
  return queryOptions({
    queryKey: ['places', 'search', query],
    queryFn: ({ signal }) =>
      requestGraphQL(
        searchPlacesDocument,
        { query },
        searchPlacesDataSchema,
        signal,
      ),
    enabled: placeSearchInputSchema.safeParse(query).success,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export { searchPlacesOptions };
