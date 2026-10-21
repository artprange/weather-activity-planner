import { useId, useState } from 'react';
import {
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DailyAssessmentType } from '@/features/forecasts/forecast.schemas';
import {
  FactorLabels,
  formatForecastDate,
  numberFormatter,
} from '@/features/forecasts/forecastPresentation';
import type { ScoringFactorEnum } from '@/graphql/generated';

function ForecastCharts({
  days,
  selectedDate,
}: {
  days: DailyAssessmentType[];
  selectedDate: string;
}) {
  const id = useId();
  const factors = [
    ...new Set(days.flatMap((day) => day.factors.map((item) => item.factor))),
  ];
  const [selected, setSelected] = useState<ScoringFactorEnum | null>(null);
  const factor =
    selected !== null && factors.includes(selected) ? selected : factors[0];
  const unit = days
    .flatMap((day) => day.factors)
    .find((item) => item.factor === factor)?.unit;
  const data = days.map((day) => ({
    date: day.date,
    value:
      day.factors.find((item) => item.factor === factor)?.meanValue ?? null,
  }));

  if (factor === undefined) {
    return (
      <p className="px-5 pb-5 text-sm text-muted-foreground">
        Condition charts are unavailable for this activity.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="min-w-0 rounded-xl border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 id={`${id}-title`} className="font-semibold">
            Weekly conditions
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Average conditions during each day's selected activity window. Gaps
            mean unavailable data, not zero.
          </p>
        </div>
        <div className="grid gap-1 text-sm">
          <label htmlFor={`${id}-metric`}>Measurement</label>
          <select
            id={`${id}-metric`}
            value={factor}
            onChange={(event) => {
              const next = factors.find((item) => item === event.target.value);
              if (next !== undefined) setSelected(next);
            }}
            className="min-h-11 max-w-full rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {factors.map((item) => (
              <option key={item} value={item}>
                {FactorLabels[item]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium">
          {FactorLabels[factor]} ({unit})
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          Selected: {formatForecastDate(selectedDate)}
        </p>
      </div>
      <div className="mt-3 h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data}
            accessibilityLayer
            margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"

              tickFormatter={(date: string) => date.slice(5)}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              minTickGap={20}
            />
            <YAxis
              width={48}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(date) => formatForecastDate(String(date))}
              formatter={(value) => [
                typeof value === 'number'
                  ? `${numberFormatter.format(value)} ${unit}`
                  : 'Unavailable',
                FactorLabels[factor],
              ]}
              contentStyle={{
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
            />
            <ReferenceLine
              x={selectedDate}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
            />
            <Area
              fill={`url(#${id}-fill)`}
              name={FactorLabels[factor]}
              type="linear"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer rounded py-2 focus-visible:outline-2 focus-visible:outline-ring">
          View chart values
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">
            {FactorLabels[factor]} averages by date
          </caption>
          <thead>
            <tr>
              <th scope="col" className="py-2">
                Date
              </th>
              <th scope="col">
                {FactorLabels[factor]} ({unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date} className="border-t">
                <th scope="row" className="py-2 font-normal">
                  {formatForecastDate(point.date)}
                </th>
                <td>
                  {point.value === null
                    ? 'Unavailable'
                    : numberFormatter.format(point.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

export { ForecastCharts };
