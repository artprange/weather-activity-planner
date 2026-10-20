function LoadingSkeleton({ variant }: { variant: 'forecast' | 'locations' }) {
  return (
    <div
      aria-hidden="true"
      data-loading-skeleton={variant}
      className="space-y-4 motion-safe:animate-pulse"
    >
      {variant === 'forecast' && (
        <div className="grid gap-6 sm:grid-cols-[1fr_11rem] sm:items-center">
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-5 w-1/2 rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
          <div className="mx-auto w-full max-w-44 rounded-xl border p-4">
            <div className="aspect-square rounded-full bg-muted" />
            <div className="mx-auto mt-4 h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>
      )}
      {Array.from({ length: variant === 'forecast' ? 2 : 3 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-5">
          <div className="h-5 w-1/3 rounded bg-muted" />
          {variant === 'locations' && (
            <div className="h-4 w-2/3 rounded bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}

export { LoadingSkeleton };
