import { StatusLabels } from '@/features/forecasts/forecastPresentation';
import type { ActivityForecastType } from '@/features/forecasts/forecast.schemas';

type ActivityRestrictionType = { label: string; description: string };
type ActivityGroupType = ActivityForecastType['activities'][number];

function getActivityRestriction(
  group: ActivityGroupType,
): ActivityRestrictionType | null {
  if (group.days.length !== 7) return null;
  if (
    group.activity === 'SURFING' &&
    group.days.every((day) => day.status === 'NO_NEARBY_COAST')
  ) {
    return {
      label: 'No nearby coast',
      description:
        'Surfing requires a coastal location. No ocean coastline was found within our supported nearby range. Try a nearby beach destination.',
    };
  }
  if (
    group.activity === 'SURFING' &&
    group.days.every((day) => day.status === 'LOCATION_UNSUPPORTED')
  ) {
    return {
      label: 'Outside coastal coverage',
      description:
        'The marine forecast point is outside our supported 25 km range for this location.',
    };
  }
  if (group.days.every((day) => day.status !== 'AVAILABLE')) {
    const reasons = [
      ...new Set(group.days.map((day) => StatusLabels[day.status])),
    ];
    return {
      label: 'No forecast available',
      description: `No scores could be calculated for this seven-day forecast. ${reasons.join('; ')}. Try again later or choose another location.`,
    };
  }
  const factor =
    group.activity === 'SKIING'
      ? 'SNOW_DEPTH'
      : group.activity === 'SURFING'
        ? 'WAVE_HEIGHT'
        : null;
  if (
    factor === null ||
    !group.days.every(
      (day) =>
        day.status === 'AVAILABLE' &&
        day.factors.some(
          (item) => item.factor === factor && item.meanValue === 0,
        ),
    )
  )
    return null;
  return group.activity === 'SKIING'
    ? {
        label: 'No snow',
        description:
          'No snow in the evaluated activity windows across this seven-day forecast. This does not describe nearby ski resorts.',
      }
    : {
        label: 'No waves',
        description:
          'No waves in the evaluated activity windows across this seven-day forecast.',
      };
}

export { getActivityRestriction };
