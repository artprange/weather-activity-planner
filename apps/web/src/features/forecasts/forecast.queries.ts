import { queryOptions } from '@tanstack/react-query';

import { requestGraphQL } from '@/lib/graphqlClient';

import { activityForecastDataSchema } from './forecast.schemas';

const activityForecastDocument = `
  query ActivityForecast($placeId: ID!) {
    activityForecast(placeId: $placeId) {
      place {
        id
        name
        region
        country
        countryCode
        latitude
        longitude
        timezone
      }
      timezone
      generatedAt
      scoringVersion
      window {
        dates
        startDate
        endDate
      }
      activities {
        activity
        days {
          date
          activity
          status
          score
          category
          rank
          summary
          limitations
          window {
            startAt
            endAt
          }
          factors {
            factor
            unit
            meanValue
            meanScore
            meanPoints
          }
          caps
        }
      }
      attributions {
        label
        url
      }
    }
  }
`;

function activityForecastOptions(placeId: string | null) {
  return queryOptions({
    queryKey: ['forecasts', 'activity', placeId],
    queryFn: async ({ signal }) => {
      if (placeId === null) {
        throw new Error('Select a location first.');
      }

      const data = await requestGraphQL(
        activityForecastDocument,
        { placeId },
        activityForecastDataSchema,
        signal,
      );

      if (
        data.activityForecast !== null &&
        data.activityForecast.place.id !== placeId
      ) {
        throw new Error('The forecast does not match the selected location.');
      }

      return data.activityForecast;
    },
    enabled: placeId !== null,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export { activityForecastOptions };
