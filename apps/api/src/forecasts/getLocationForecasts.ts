import { createForecastWindow } from '../integrations/open-meteo/forecastHelper.js';
import { getMarineForecast } from '../integrations/open-meteo/marineForecast.js';
import { getWeatherForecast } from '../integrations/open-meteo/weatherForecast.js';
import type { GeocodedLocationType } from '../locations/geocodedLocation.types.js';

async function getLocationForecasts(
  location: GeocodedLocationType,
  now = new Date(),
) {
  const window = createForecastWindow(location.timezone, now);

  const [weatherResult, marineResult] = await Promise.allSettled([
    getWeatherForecast(location, window),
    getMarineForecast(location, window),
  ]);

  return {
    window,
    weatherResult,
    marineResult,
  };
}

export { getLocationForecasts };
