import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { fetchHealth } from '@/lib/health';

function HomePage() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    retry: false,
    staleTime: 30_000,
  });

  return (
    <section aria-labelledby="page-title" className="max-w-2xl space-y-6">
      <div className="space-y-3">
        <h1
          id="page-title"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Find the right day for your next activity
        </h1>

        <p className="text-muted-foreground">
          Compare weather conditions for skiing, surfing and sightseeing.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Service connection</h2>

        <div role="status" className="mt-2 text-sm">
          {healthQuery.isFetching && <p>Checking service availability…</p>}

          {!healthQuery.isFetching && healthQuery.isSuccess && (
            <p>The weather service is connected.</p>
          )}

          {!healthQuery.isFetching && healthQuery.isError && (
            <p>
              Unable to connect. Check that the API is running and try again.
            </p>
          )}
        </div>

        {healthQuery.isError && (
          <Button
            type="button"
            className="mt-4"
            disabled={healthQuery.isFetching}
            onClick={() => {
              void healthQuery.refetch();
            }}
          >
            Try again
          </Button>
        )}
      </div>
    </section>
  );
}

export { HomePage };
