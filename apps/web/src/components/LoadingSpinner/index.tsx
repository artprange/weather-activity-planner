import { LoaderCircle } from 'lucide-react';

function LoadingSpinner() {
  return (
    <LoaderCircle
      aria-hidden="true"
      className="size-4 shrink-0 motion-safe:animate-spin"
    />
  );
}

export { LoadingSpinner };
