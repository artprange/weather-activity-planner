import { useId, useState, type SubmitEvent } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  placeSearchInputSchema,
  type SearchPlaceType,
} from '../placeSearch.schemas';
import { searchPlacesOptions } from '../placeSearch.queries';
import { PlaceSearchResults } from '../PlaceSearchResults';

function PlaceSearch() {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();

  const [input, setInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SearchPlaceType | null>(
    null,
  );

  const searchQuery = useQuery(searchPlacesOptions(submittedQuery));
  const places = searchQuery.data?.searchPlaces;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = placeSearchInputSchema.safeParse(input);

    if (!result.success) {
      setValidationError('Enter a place name between 2 and 100 characters.');
      return;
    }

    setValidationError(null);
    setInput(result.data);

    if (result.data === submittedQuery) {
      void searchQuery.refetch();
      return;
    }

    setSelectedPlace(null);
    setSubmittedQuery(result.data);
  }

  let announcement = 'Enter a city or town to search for locations.';

  if (submittedQuery !== '') {
    if (searchQuery.isFetching) {
      announcement = `Searching for “${submittedQuery}”.`;
    } else if (searchQuery.isError) {
      announcement = 'Unable to search for locations. Please try again.';
    } else if (places !== undefined) {
      announcement =
        places.length === 0
          ? `No locations found for “${submittedQuery}”. Try another name.`
          : `${places.length} ${places.length === 1 ? 'location' : 'locations'} found for “${submittedQuery}”. Choose a location below.`;
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label htmlFor={inputId} className="block font-medium">
          City or town
        </label>

        <p id={helpId} className="text-sm text-muted-foreground">
          Enter 2 to 100 characters. You can choose the region and country from
          the results.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            type="search"
            name="place"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setValidationError(null);
            }}
            aria-invalid={validationError !== null}
            aria-describedby={`${helpId} ${errorId}`}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />

          <Button type="submit" size="lg" className="min-h-11">
            Search locations
          </Button>
        </div>

        <p id={errorId} aria-live="polite" className="text-sm text-destructive">
          {validationError}
        </p>
      </form>

      <p
        role="status"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {announcement}
      </p>

      {searchQuery.isError && !searchQuery.isFetching && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            void searchQuery.refetch();
          }}
        >
          Try again
        </Button>
      )}

      {places !== undefined && places.length > 0 && (
        <PlaceSearchResults
          places={places}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelect={setSelectedPlace}
        />
      )}

      <div role="status" aria-atomic="true">
        {selectedPlace !== null && (
          <section
            aria-labelledby="selected-place-title"
            className="space-y-2 rounded-xl border border-border bg-card p-5 text-card-foreground"
          >
            <h2 id="selected-place-title" className="font-semibold">
              Selected location
            </h2>

            <p>
              {[selectedPlace.name, selectedPlace.region, selectedPlace.country]
                .filter((part) => part !== null && part !== '')
                .join(', ')}
            </p>

            <p className="text-sm text-muted-foreground">
              Time zone: {selectedPlace.timezone}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export { PlaceSearch };
