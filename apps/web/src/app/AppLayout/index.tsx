import { Compass } from 'lucide-react';
import { ThemeSwitcher } from '@/features/theme/themeSwitcher';
import { Outlet } from '@tanstack/react-router';

function AppLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only rounded-md bg-background p-3 text-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <p className="flex items-center gap-3 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Compass aria-hidden="true" className="size-6" />
            </span>
            Out There
          </p>
          <ThemeSwitcher />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-10"
      >
        <Outlet />
      </main>
    </>
  );
}

export { AppLayout };
