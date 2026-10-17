import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { HomePage } from '@/App';
import { AppLayout } from '@/app/app-layout';
import { AppRoutes } from '@/app/routes';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: AppRoutes.HOME,
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

const router = createRouter({
  routeTree,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };
