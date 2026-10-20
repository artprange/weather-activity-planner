import { useId } from 'react';

import type { ScoringFactorEnum } from '@/graphql/generated';

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

const FactorDescriptions: Record<ScoringFactorEnum, string> = {
  SNOW_DEPTH:
    'Snow cover depth during the evaluated window; this does not confirm ski resort or trail availability.',
  TEMPERATURE: 'Average air temperature during the evaluated window.',
  APPARENT_TEMPERATURE:
    'How warm or cold the air feels after accounting for weather conditions.',
  WIND: 'Average wind speed during the evaluated window.',
  GUSTS: 'Average forecast gust speed; individual gusts may be stronger.',
  VISIBILITY: 'Average distance at which objects can be seen.',
  RAIN: 'Average hourly liquid precipitation, not the total rainfall for the day.',
  PRECIPITATION: 'Average hourly precipitation, not the daily total.',
  WAVE_HEIGHT:
    'Average forecast wave height; individual waves and local beach conditions can differ.',
  WAVE_PERIOD: 'Average time between waves during the evaluated window.',
};

type DailyAssessmentCardProps = {
  day: DailyAssessmentType;
  timezone: string;
};

function DailyAssessmentCard({ day, timezone }: DailyAssessmentCardProps) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="h-full space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
    >
      <h3 id={titleId} className="font-semibold">
        <time dateTime={day.date}>{formatForecastDate(day.date)}</time>
      </h3>

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
        <p className="inline-flex rounded-lg bg-muted px-3 py-2 font-medium text-foreground">
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

      <section className="space-y-4" aria-label="Conditions explained">
        <h4 className="font-semibold">What shapes this day</h4>

        {day.factors.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              Averages cover the evaluated period. Hourly score limits and
              rounding can affect the final score.
              {day.activity === 'INDOOR_SIGHTSEEING' &&
                ' Indoor contributions are deductions from 100.'}
            </p>

            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {day.factors.map((factor) => (
                <div
                  key={factor.factor}
                  className="space-y-2 rounded-xl border bg-muted/20 p-4"
                >
                  <dt className="font-medium">{FactorLabels[factor.factor]}</dt>

                  <dd className="text-xl font-semibold">
                    {' '}
                    {numberFormatter.format(factor.meanValue)} {factor.unit}
                  </dd>

                  <dd className="text-muted-foreground">
                    Weather suitability:{' '}
                    {numberFormatter.format(factor.meanScore)}/100
                  </dd>

                  <dd>
                    {day.activity === 'INDOOR_SIGHTSEEING'
                      ? 'Average deduction:'
                      : 'Average contribution:'}{' '}
                    {numberFormatter.format(factor.meanPoints)} points
                  </dd>
                  <dd className="text-muted-foreground">
                    {FactorDescriptions[factor.factor]}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {day.caps.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <h4 className="font-semibold">Conditions affecting the score</h4>

            <ul className="list-disc space-y-1 pl-5 text-sm">
              {day.caps.map((cap) => (
                <li key={cap}>{CapLabels[cap]}</li>
              ))}
            </ul>
          </div>
        )}

        {day.limitations.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <h4 className="font-semibold">Before you plan</h4>

            <ul className="list-disc space-y-1 pl-5 text-sm">
              {day.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </article>
  );
}

export { DailyAssessmentCard };
