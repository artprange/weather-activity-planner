import { useId } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { DailyAssessmentCard } from '@/features/forecasts/DailyAssessmentCard';
import { activityForecastOptions } from '@/features/forecasts/forecast.queries';
import {
  ActivityLabels,
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
        className="text-sm text-muted-foreground"
      >
        {announcement}
      </p>

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
        <section aria-labelledby={titleId} className="space-y-8">
          <header className="space-y-2">
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
          </header>

          {forecast.activities.map((group) => (
            <details
              key={`${forecast.place.id}-${group.activity}`}
              className="rounded-xl border border-border"
            >
              <summary className="cursor-pointer rounded-xl px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <h3 className="inline text-xl font-semibold">
                  {ActivityLabels[group.activity]}
                </h3>
              </summary>

              <ol className="grid gap-4 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
                {group.days.map((day) => (
                  <DailyAssessmentCard
                    key={day.date}
                    day={day}
                    timezone={forecast.timezone}
                  />
                ))}
              </ol>
            </details>
          ))}

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
