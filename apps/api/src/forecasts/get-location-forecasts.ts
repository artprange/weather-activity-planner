import { createForecastWindow } from '../integrations/open-meteo/forecast-helper.js';
import { getMarineForecast } from '../integrations/open-meteo/marine-forecast.js';
import { getWeatherForecast } from '../integrations/open-meteo/weather-forecast.js';
import type { GeocodedLocationType } from '../locations/geocoded-location.types.js';

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
