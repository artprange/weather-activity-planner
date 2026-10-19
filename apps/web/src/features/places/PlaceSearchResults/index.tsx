import { useId, useRef, useState } from 'react';
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
  const summaryRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);
  const selectedLabel =
    selectedPlace === undefined
      ? null
      : [selectedPlace.name, selectedPlace.region, selectedPlace.country]
          .filter((part) => part !== null && part !== '')
          .join(', ');

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="rounded-xl border border-border"
    >
      <summary
        ref={summaryRef}
        className="cursor-pointer rounded-xl px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="font-semibold">Choose a location</span>
        {selectedLabel !== null && (
          <span className="mt-1 block pl-4 text-sm text-muted-foreground">
            Selected: {selectedLabel}
          </span>
        )}
      </summary>

      <fieldset className="min-w-0 px-3 pb-3">
        <legend className="sr-only">Location options</legend>
        <ul className="max-h-[min(28rem,60svh)] space-y-3 overflow-y-auto overscroll-y-contain p-1 [scrollbar-gutter:stable]">
          {places.map((place) => (
            <li key={place.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                <input
                  type="radio"
                  name={groupId}
                  value={place.id}
                  checked={selectedPlaceId === place.id}
                  onChange={() => onSelect(place)}
                  onClick={(event) => {
                    if (event.detail > 0) {
                      setIsOpen(false);
                      summaryRef.current?.focus();
                    }
                  }}
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
    </details>
  );
}

export { PlaceSearchResults };
