# Deploy to Vercel

Deploy this repository as **one Vercel project**, with the repository root as its Root Directory. The static Vite build and GraphQL function share a domain, so the browser continues to request `/graphql` without CORS or an API URL variable.

## Configuration

`vercel.json` defines:

- Install: `npm ci`.
- Build: `npm run build` (API/code generation first, then web).
- Output: `apps/web/dist`.
- Framework preset: Other.
- Function: `api/graphql.mjs`, with a 30-second maximum duration.
- Rewrite: `/graphql` to `/api/graphql`.

Use Node.js **24.x**, matching `package.json`. No environment variables or API keys are required by the current Open-Meteo integration. `PORT` is only used by the standalone local API server.

The function imports the compiled API from `apps/api/dist`; the repository build must finish before function packaging. It shares the Yoga instance with the local server without opening a listening port. The UI currently only has the `/` route and stores the selected place in query parameters, so no catch-all SPA rewrite is required.

## Publish

1. Commit and push the deployment changes to the GitHub branch you intend to deploy.
2. Open https://vercel.com/new and import `artprange/weather-activity-planner`.
3. Keep Root Directory at the repository root (`.`), not `apps/web` or `apps/api`.
4. Select the Other framework preset and Node.js 24.x. Keep the build/install/output settings from `vercel.json`.
5. Check the production branch: these changes were prepared on `develop`; if production uses another branch, merge the changes there first or explicitly select the intended branch.
6. Deploy and review the build/function logs if it fails.
7. Test the deployed URL before adding it to a portfolio.

Alternatively, with Vercel CLI installed and authenticated, run `vercel` from the repository root to create a preview. After checking it, run `vercel --prod`.

## Deployment checks

- POST `/graphql` with `{"query":"query { health }"}` returns `{"data":{"health":"ok"}}`.
- Search for Santos, select a place and load its forecast. Check unavailable/partial activity explanations.
- Refresh the URL with the selected place query parameter and verify restoration.
- Check light/dark themes and the mobile layout.

Local build/tests do not verify Vercel packaging or live upstream availability. Confirm these on the actual deployment. Broader accessibility verification remains tracked separately in the backlog.

## References

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/routing/rewrites
