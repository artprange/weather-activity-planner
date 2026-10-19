import { useId } from 'react';

import { cn } from '@/lib/utils';

import type { DailyAssessmentType } from '@/features/forecasts/forecast.schemas';
import {
  CapLabels,
  FactorLabels,
  StatusLabels,
  SuitabilityLabels,
  SuitabilityStyles,
  formatForecastDate,
  formatForecastTime,
  numberFormatter,
} from '@/features/forecasts/forecastPresentation';

type DailyAssessmentCardProps = {
  day: DailyAssessmentType;
  timezone: string;
};

function DailyAssessmentCard({ day, timezone }: DailyAssessmentCardProps) {
  const titleId = useId();

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="h-full space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
      >
        <h4 id={titleId} className="font-semibold">
          <time dateTime={day.date}>{formatForecastDate(day.date)}</time>
        </h4>

        {day.rank === 1 && (
          <p className="text-sm font-semibold">Highest ranked day</p>
        )}

        {day.score !== null && day.category !== null ? (
          <div className="space-y-3">
            <p
              className={cn(
                'inline-flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-2 font-semibold',
                SuitabilityStyles[day.category].BADGE,
              )}
            >
              <span className="text-2xl font-bold tabular-nums">
                {day.score}/100
              </span>
              <span>{SuitabilityLabels[day.category]}</span>
            </p>
            <div
              aria-hidden="true"
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  'h-full rounded-full',
                  SuitabilityStyles[day.category].BAR,
                )}
                style={{ width: `${day.score}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="inline-flex rounded-lg bg-muted px-3 py-2 font-medium text-muted-foreground">
            Score unavailable
          </p>
        )}

        {day.rank !== null && <p className="text-sm">Rank: {day.rank}</p>}

        {day.status !== 'AVAILABLE' && (
          <p className="text-sm">{StatusLabels[day.status]}</p>
        )}

        <p className="text-sm">{day.summary}</p>

        {day.window !== null && (
          <p className="text-sm text-muted-foreground">
            Evaluated window:{' '}
            <time dateTime={day.window.startAt}>
              {formatForecastTime(day.window.startAt, timezone)}
            </time>
            {' – '}
            <time dateTime={day.window.endAt}>
              {formatForecastTime(day.window.endAt, timezone)}
            </time>
          </p>
        )}

        <details className="space-y-3">
          <summary className="cursor-pointer rounded-md py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Factors and limitations
          </summary>

          {day.factors.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Averages cover the evaluated period. Hourly score limits and
                rounding can affect the final score. Indoor contributions are
                deductions from 100.
              </p>

              <dl className="space-y-3 text-sm">
                {day.factors.map((factor) => (
                  <div key={factor.factor}>
                    <dt className="font-medium">
                      {FactorLabels[factor.factor]}
                    </dt>

                    <dd>
                      Mean value: {numberFormatter.format(factor.meanValue)}{' '}
                      {factor.unit}
                    </dd>

                    <dd>
                      Mean factor score:{' '}
                      {numberFormatter.format(factor.meanScore)}/100
                    </dd>

                    <dd>
                      Mean contribution:{' '}
                      {numberFormatter.format(factor.meanPoints)} points
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {day.caps.length > 0 && (
            <div>
              <p className="text-sm font-medium">Score limits applied</p>

              <ul className="list-disc space-y-1 pl-5 text-sm">
                {day.caps.map((cap) => (
                  <li key={cap}>{CapLabels[cap]}</li>
                ))}
              </ul>
            </div>
          )}

          {day.limitations.length > 0 && (
            <div>
              <p className="text-sm font-medium">Limitations</p>

              <ul className="list-disc space-y-1 pl-5 text-sm">
                {day.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </details>
      </article>
    </li>
  );
}

export { DailyAssessmentCard };
