import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DailyAssessmentCard } from '@/features/forecasts/DailyAssessmentCard';
import { ForecastCharts } from '@/features/forecasts/ForecastCharts';
import type { ActivityForecastType } from '@/features/forecasts/forecast.schemas';
import {
  formatForecastDate,
  SuitabilityLabels,
  SuitabilityStyles,
} from '@/features/forecasts/forecastPresentation';
import { cn } from '@/lib/utils';

function ActivityDays({
  group,
  timezone,
}: {
  group: ActivityForecastType['activities'][number];
  timezone: string;
}) {
  const id = useId();
  const best = group.days.find((day) => day.rank === 1);

  const [selectedDate, setSelectedDate] = useState(group.days[0]?.date);

  const selected =
    group.days.find((day) => day.date === selectedDate) ?? group.days[0];
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const index = group.days.findIndex((day) => day.date === selected?.date);
    const button = buttons.current[index];
    const container = button?.parentElement;
    if (button && container) {
      container.scrollLeft +=
        button.getBoundingClientRect().left -
        container.getBoundingClientRect().left -
        (container.clientWidth - button.clientWidth) / 2;
    }
  }, [group.days, selected?.date]);

  if (selected === undefined) return null;
  const selectedIndex = group.days.indexOf(selected);

  function selectDay(index: number, focus = false) {
    const day = group.days[index];
    if (day === undefined) return;
    setSelectedDate(day.date);
    if (focus) buttons.current[index]?.focus();
  }

  return (
    <div className="min-w-0 space-y-6">
      <section
        aria-label="Best day recommendation"
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-gradient-to-br from-accent to-card p-5 shadow-sm sm:p-6"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Trophy aria-hidden="true" className="size-4 text-primary" />
            {best ? 'Best day this week' : 'No ranked day available'}
          </p>
          {best ? (
            <>
              <p className="text-xl font-bold">
                {formatForecastDate(best.date)}{' '}
                <span className="text-sm font-medium">· {best.score}/100</span>
              </p>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {best.summary}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a day below to see available information and why a score
              could not be calculated.
            </p>
          )}
        </div>
        {best && (
          <Button
            variant="outline"
            onClick={() => selectDay(group.days.indexOf(best))}
          >
            View best day
          </Button>
        )}
      </section>

      <section aria-labelledby={`${id}-days`} className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3
            id={`${id}-days`}
            className="flex items-center gap-2 font-semibold"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            Choose a day
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous day"
              disabled={selectedIndex === 0}
              onClick={() => selectDay(selectedIndex - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next day"
              disabled={selectedIndex === group.days.length - 1}
              onClick={() => selectDay(selectedIndex + 1)}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div
          role="group"
          aria-label="Forecast days"
          aria-roledescription="carousel"
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-1 lg:grid lg:grid-cols-7"
        >
          {group.days.map((day, index) => (
            <button
              key={day.date}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              aria-pressed={day.date === selected.date}
              aria-controls={`${id}-details`}
              onClick={() => selectDay(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === 'ArrowRight'
                    ? Math.min(index + 1, group.days.length - 1)
                    : event.key === 'ArrowLeft'
                      ? Math.max(index - 1, 0)
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? group.days.length - 1
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  selectDay(next, true);
                }
              }}
              className={cn(
                'w-36 shrink-0 snap-center space-y-2 rounded-xl border bg-card p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-auto',
                day.date === selected.date
                  ? 'border-primary bg-accent ring-1 ring-primary'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <time dateTime={day.date} className="block text-sm font-semibold">
                {new Intl.DateTimeFormat('en-US', {
                  timeZone: 'UTC',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                }).format(new Date(`${day.date}T12:00:00Z`))}
              </time>
              <span className="block text-xl font-bold tabular-nums">
                {day.score === null ? '—' : `${day.score}/100`}
              </span>
              <span
                className={cn(
                  'inline-block rounded px-2 py-1 text-xs font-medium',
                  day.category === null
                    ? 'bg-muted text-foreground'
                    : SuitabilityStyles[day.category].BADGE,
                )}
              >
                {day.category === null
                  ? 'Unavailable'
                  : SuitabilityLabels[day.category]}
              </span>
              <span className="block min-h-4 text-xs text-muted-foreground">
                {day.rank === 1
                  ? 'Best day'
                  : day.date === selected.date
                    ? 'Selected'
                    : '\u00a0'}
              </span>
            </button>
          ))}
        </div>
        <p
          role="status"
          aria-atomic="true"
          className="text-sm text-muted-foreground"
        >
          Showing {formatForecastDate(selected.date)} · Day {selectedIndex + 1}{' '}
          of {group.days.length}
        </p>
      </section>

      <div id={`${id}-details`}>
        <DailyAssessmentCard day={selected} timezone={timezone} />
      </div>
      <ForecastCharts days={group.days} selectedDate={selected.date} />
    </div>
  );
}

export { ActivityDays };
