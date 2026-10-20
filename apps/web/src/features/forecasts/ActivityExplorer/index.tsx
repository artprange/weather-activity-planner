import { useId, useRef, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { getActivityRestriction } from '@/features/forecasts/activityRestriction';

import type { ActivityForecastType } from '@/features/forecasts/forecast.schemas';
import { ActivityLabels } from '@/features/forecasts/forecastPresentation';
import { ActivityDays } from '@/features/forecasts/ActivityDays';
import { cn } from '@/lib/utils';

function ActivityExplorer({ forecast }: { forecast: ActivityForecastType }) {
  const id = useId();
  const restrictions = forecast.activities.map(getActivityRestriction);
  const [preferred, setSelected] = useState<number | null>(null);
  const selected =
    preferred !== null && restrictions[preferred] === null
      ? preferred
      : restrictions.findIndex((reason) => reason === null);
  const [focused, setFocused] = useState<number | null>(null);
  const tabs = useRef<(HTMLElement | null)[]>([]);

  return (
    <div className="min-w-0 space-y-6">
      <div
        role="tablist"
        aria-label="Activities"
        className="flex gap-2 overflow-x-auto rounded-xl border bg-muted/40 p-2"
      >
        {forecast.activities.map((group, index) => (
          <Tooltip.Root key={group.activity}>
            <Tooltip.Trigger
              render={<button />}
              disabled={restrictions[index] === null}
              delay={150}
              closeOnClick={false}
              key={group.activity}
              ref={(element: HTMLElement | null) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-controls={`${id}-panel-${index}`}
              aria-selected={selected === index}
              aria-disabled={restrictions[index] !== null}
              aria-describedby={
                restrictions[index] ? `${id}-reason-${index}` : undefined
              }
              onFocus={() => setFocused(index)}
              tabIndex={(focused ?? selected) === index ? 0 : -1}
              onClick={() => {
                if (restrictions[index] === null) setSelected(index);
              }}
              onKeyDown={(event) => {
                let next: number;
                if (event.key === 'ArrowRight')
                  next = (index + 1) % forecast.activities.length;
                else if (event.key === 'ArrowLeft')
                  next =
                    (index - 1 + forecast.activities.length) %
                    forecast.activities.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End')
                  next = forecast.activities.length - 1;
                else return;
                event.preventDefault();
                if (restrictions[next] === null) setSelected(next);
                tabs.current[next]?.focus();
                tabs.current[next]?.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest',
                });
              }}
              className={cn(
                'min-h-12 shrink-0 flex-1 rounded-lg px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                restrictions[index] !== null
                  ? 'cursor-not-allowed text-muted-foreground'
                  : selected === index
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="block">{ActivityLabels[group.activity]}</span>
              {restrictions[index] && (
                <span
                  id={`${id}-reason-${index}`}
                  className="mt-1 block text-xs font-normal"
                >
                  {restrictions[index].label}
                </span>
              )}
            </Tooltip.Trigger>
            {restrictions[index] && (
              <Tooltip.Portal>
                <Tooltip.Positioner
                  side="bottom"
                  sideOffset={8}
                  className="z-50"
                >
                  <Tooltip.Popup
                    role="tooltip"
                    className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
                  >
                    {restrictions[index].description}
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        ))}
      </div>
      {forecast.activities.map((group, index) => (
        <div
          key={group.activity}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selected !== index}
          tabIndex={0}
          className="min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
        >
          {selected === index && (
            <ActivityDays
              key={group.activity}
              group={group}
              timezone={forecast.timezone}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export { ActivityExplorer };
