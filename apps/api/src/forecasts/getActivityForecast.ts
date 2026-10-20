import {
  ApplicationError,
  ApplicationErrorCodeEnum,
} from '../errors/applicationError.js';
import { getGeocodedLocationById } from '../integrations/open-meteo/geocoding.js';
import { hasNearbyCoast } from '../locations/coastalProximity.js';
import { assessActivities } from '../scoring/assessActivities.js';

import type { ActivityForecastType } from './activityForecast.types.js';
import { getLocationForecasts } from './getLocationForecasts.js';

const ActivityForecastConstants = {
  SCORING_VERSION: '1',
};

async function getActivityForecast(
  placeId: string,
  now = new Date(),
): Promise<ActivityForecastType> {
  const place = await getGeocodedLocationById(placeId);

  if (place === null) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.PLACE_NOT_FOUND,
      'The selected place was not found.',
    );
  }

  const forecasts = await getLocationForecasts(place, now);

  if (
    forecasts.weatherResult.status === 'rejected' &&
    forecasts.marineResult.status === 'rejected'
  ) {
    throw new ApplicationError(
      ApplicationErrorCodeEnum.UPSTREAM_UNAVAILABLE,
      'Forecast services are temporarily unavailable.',
      {
        cause: new AggregateError([
          forecasts.weatherResult.reason,
          forecasts.marineResult.reason,
        ]),
      },
    );
  }

  return {
    place,
    timezone: place.timezone,
    generatedAt: now.toISOString(),
    scoringVersion: ActivityForecastConstants.SCORING_VERSION,
    window: forecasts.window,
    activities: assessActivities({
      timezone: place.timezone,
      hasNearbyCoast: hasNearbyCoast(place),
      ...forecasts,
    }),
    attributions: [
      { label: 'Natural Earth', url: 'https://www.naturalearthdata.com/' },
      {
        label: 'Open-Meteo',
        url: 'https://open-meteo.com/',
      },
      {
        label: 'GeoNames',
        url: 'https://www.geonames.org/',
      },
      {
        label: 'DWD',
        url: 'https://www.dwd.de/',
      },
    ],
  };
}

export { getActivityForecast };
