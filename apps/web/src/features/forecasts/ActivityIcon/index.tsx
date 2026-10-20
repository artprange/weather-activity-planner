import {
  Landmark,
  MountainSnow,
  TreePine,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityEnum } from '@/graphql/generated';
import { cn } from '@/lib/utils';

const ActivityIcons: Record<ActivityEnum, LucideIcon> = {
  SKIING: MountainSnow,
  SURFING: Waves,
  OUTDOOR_SIGHTSEEING: TreePine,
  INDOOR_SIGHTSEEING: Landmark,
};

const ActivityColors: Record<ActivityEnum, string> = {
  SKIING: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  SURFING: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  OUTDOOR_SIGHTSEEING:
    'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200',
  INDOOR_SIGHTSEEING:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
};

function ActivityIcon({
  activity,
  muted = false,
  selected = false,
}: {
  activity: ActivityEnum;
  muted?: boolean;
  selected?: boolean;
}) {
  const Icon = ActivityIcons[activity];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
        muted
          ? 'bg-muted text-muted-foreground'
          : selected
            ? 'bg-primary-foreground/15 text-primary-foreground'
            : ActivityColors[activity],
      )}
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  );
}

export { ActivityIcon };
