import { useId } from 'react';
import type { SearchPlaceType } from '../placeSearch.schemas';

type PlaceSearchResultsProps = {
  places: SearchPlaceType[];
  selectedPlaceId: string | null;
  onSelect: (place: SearchPlaceType) => void;
};

function PlaceSearchResults({
  places,
  selectedPlaceId,
  onSelect,
}: PlaceSearchResultsProps) {
  const groupId = useId();

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-lg font-semibold">Choose a location</legend>

      <ul className="space-y-3">
        {places.map((place) => (
          <li key={place.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
              <input
                type="radio"
                name={groupId}
                value={place.id}
                checked={selectedPlaceId === place.id}
                onChange={() => onSelect(place)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />

              <span className="min-w-0 space-y-1 wrap-break-words">
                <span className="block font-medium">
                  {[place.name, place.region, place.country]
                    .filter((part) => part !== null && part !== '')
                    .join(', ')}
                </span>

                <span className="block text-sm text-muted-foreground">
                  Time zone: {place.timezone}
                </span>

                <span className="block text-sm text-muted-foreground">
                  Latitude: {place.latitude.toFixed(4)}; longitude:{' '}
                  {place.longitude.toFixed(4)}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export { PlaceSearchResults };
