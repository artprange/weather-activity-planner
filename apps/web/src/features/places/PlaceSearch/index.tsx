import { useId, useState, type SubmitEvent } from 'react';

import { Search } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { PlaceSearchResults } from '@/features/places/PlaceSearchResults';
import { searchPlacesOptions } from '@/features/places/placeSearch.queries';
import {
  placeSearchInputSchema,
  type SearchPlaceType,
} from '@/features/places/placeSearch.schemas';

type PlaceSearchProps = {
  selectedPlaceId: string | null;
  onSelect: (place: SearchPlaceType) => void;
  onClear: () => void;
};

function PlaceSearch({ selectedPlaceId, onSelect, onClear }: PlaceSearchProps) {
  const inputId = useId();
  const errorId = useId();

  const [input, setInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const searchQuery = useQuery(searchPlacesOptions(submittedQuery));
  const places = searchQuery.data?.searchPlaces;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = placeSearchInputSchema.safeParse(input);

    if (!result.success) {
      setValidationError(
        result.error.issues[0]?.message ?? 'Enter a valid place name.',
      );
      return;
    }

    setValidationError(null);
    setInput(result.data);
    setSearchAttempt((attempt) => attempt + 1);

    if (result.data === submittedQuery) {
      void searchQuery.refetch();
      return;
    }

    onClear();
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
            aria-describedby={validationError === null ? undefined : errorId}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />

          <Button type="submit" size="lg" className="min-h-11">
            {searchQuery.isFetching ? (
              <LoadingSpinner />
            ) : (
              <Search aria-hidden="true" className="size-4" />
            )}
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
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {searchQuery.isFetching && <LoadingSpinner />}
        {announcement}
      </p>

      {searchQuery.isFetching && places === undefined && (
        <LoadingSkeleton variant="locations" />
      )}

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
          key={`${submittedQuery}-${searchAttempt}`}
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

export { PlaceSearch };
