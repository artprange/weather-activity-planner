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
            Find your next great day out.
          </h1>

          <p className="text-muted-foreground">
            Catch some waves, hit the slopes, or explore somewhere new. Check
            the forecast and pick your day.
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
