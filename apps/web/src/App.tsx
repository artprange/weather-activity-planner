import { PlaceSearch } from '@/features/places/PlaceSearch';

function HomePage() {
  return (
    <section aria-labelledby="page-title" className="max-w-2xl space-y-8">
      <div className="space-y-3">
        <h1
          id="page-title"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Find the right day for your next activity
        </h1>

        <p className="text-muted-foreground">
          Compare weather conditions for skiing, surfing and sightseeing. Start
          by choosing a location.
        </p>
      </div>

      <PlaceSearch />
    </section>
  );
}

export { HomePage };
