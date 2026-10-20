import { useId } from 'react';

import { useQuery } from '@tanstack/react-query';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { ActivityExplorer } from '@/features/forecasts/ActivityExplorer';
import { LocationGlobe } from '@/features/places/LocationGlobe';
import { activityForecastOptions } from '@/features/forecasts/forecast.queries';
import {
  formatForecastDate,
  formatGeneratedAt,
} from '@/features/forecasts/forecastPresentation';

type ActivityForecastProps = {
  placeId: string | null;
};

function ActivityForecast({ placeId }: ActivityForecastProps) {
  const titleId = useId();
  const query = useQuery(activityForecastOptions(placeId));
  const forecast = query.data;

  let announcement = '';

  if (placeId !== null) {
    if (query.isFetching) {
      announcement = forecast
        ? 'Updating forecast.'
        : 'Loading the seven-day forecast.';
    } else if (query.isError) {
      announcement = forecast
        ? 'Unable to refresh. Showing the last successful forecast.'
        : 'Unable to load the forecast. Try again or choose another location.';
    } else if (forecast === null) {
      announcement =
        'No forecast was returned. Choose another location or try again.';
    } else if (forecast !== undefined) {
      const partial = forecast.activities.some((group) =>
        group.days.some((day) => day.status !== 'AVAILABLE'),
      );

      announcement = partial
        ? `Forecast loaded for ${forecast.place.name}. Some activity scores are unavailable; available scores are shown below.`
        : `Seven-day forecast loaded for ${forecast.place.name}.`;
    }
  }

  return (
    <div className="space-y-6">
      <p
        role="status"
        aria-atomic="true"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {placeId !== null && query.isFetching && <LoadingSpinner />}
        {announcement}
      </p>

      {placeId !== null && query.isFetching && forecast == null && (
        <LoadingSkeleton variant="forecast" />
      )}

      {placeId !== null &&
        !query.isFetching &&
        (query.isError || forecast === null) && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try loading forecast again
          </Button>
        )}

      {placeId !== null && forecast !== null && forecast !== undefined && (
        <section
          aria-labelledby={titleId}
          aria-busy={query.isFetching}
          className="space-y-8"
        >
          <header className="grid gap-6 sm:grid-cols-[1fr_11rem] sm:items-center">
            <div className="space-y-2">
              <h2 id={titleId} className="text-2xl font-bold">
                {[
                  forecast.place.name,
                  forecast.place.region,
                  forecast.place.country,
                ]
                  .filter((part) => part !== null && part !== '')
                  .join(', ')}
              </h2>

              <p>
                {formatForecastDate(forecast.window.startDate)}
                {' – '}
                {formatForecastDate(forecast.window.endDate)}
              </p>

              <p className="text-sm text-muted-foreground">
                All times use {forecast.timezone}.
              </p>

              <p className="text-sm text-muted-foreground">
                Generated:{' '}
                <time dateTime={forecast.generatedAt}>
                  {formatGeneratedAt(forecast.generatedAt, forecast.timezone)}
                </time>
              </p>

              <p className="text-sm text-muted-foreground">
                Scores describe weather suitability. They do not confirm venue
                availability or safety.
              </p>
            </div>
            <LocationGlobe key={forecast.place.id} place={forecast.place} />
          </header>

          <ActivityExplorer key={forecast.place.id} forecast={forecast} />

          <footer className="space-y-2 text-sm text-muted-foreground">
            <p>Data sources</p>

            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {forecast.attributions.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>

            <p>Scoring version: {forecast.scoringVersion}</p>
          </footer>
        </section>
      )}
    </div>
  );
}

export { ActivityForecast };
