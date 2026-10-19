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

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <p className="font-semibold">Weather Activity Planner</p>
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
