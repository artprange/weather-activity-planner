import { useNavigate, useSearch } from '@tanstack/react-router';

import { AppRoutes } from '@/app/routes';

import { PlaceSearch } from '@/features/places/PlaceSearch';
import { ActivityForecast } from './features/forecasts/ActivityForescast';

function HomePage() {
  const { placeId } = useSearch({ from: AppRoutes.HOME });
  const navigate = useNavigate({ from: AppRoutes.HOME });

  const selectedPlaceId = placeId ?? null;

  return (
    <div className="space-y-10">
      <section aria-labelledby="page-title" className="max-w-2xl space-y-8">
        <div className="space-y-3">
          <h1
            id="page-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Find the right day for your next activity
          </h1>

          <p className="text-muted-foreground">
            Compare weather conditions for skiing, surfing and sightseeing.
            Start by choosing a location.
          </p>
        </div>

        <PlaceSearch
          selectedPlaceId={selectedPlaceId}
          onSelect={(place) => {
            void navigate({
              search: { placeId: place.id },
              resetScroll: false,
            });
          }}
          onClear={() => {
            if (selectedPlaceId !== null) {
              void navigate({
                search: {},
                resetScroll: false,
              });
            }
          }}
        />
      </section>

      <ActivityForecast placeId={selectedPlaceId} />
    </div>
  );
}

export { HomePage };
