# Weather Activity Planner

A full-stack application that compares weather forecasts to help users choose suitable days for skiing, surfing, and sightseeing.

## Features

- Location search and seven-day activity forecasts.
- Daily suitability scores with contributing factors and limitations.
- Weather charts and an interactive location globe.
- Activity availability checks for coastal proximity, snow, and waves.
- Responsive interface with light and dark themes.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, and COBE.
- **Backend:** Node.js, TypeScript, GraphQL Yoga, and Zod.
- **Testing:** Vitest, Playwright, and axe-core.
- **Data:** Open-Meteo and Natural Earth.

## Running locally

Requires **Node.js 24** and **npm**.

Install dependencies from the repository root:

```bash
npm ci
```

Start the API and frontend in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open http://localhost:5173.

The API runs at http://127.0.0.1:4000/graphql. Vite proxies frontend GraphQL requests to it. Internet access is required for location searches and forecasts.

Optional API configuration is available in `apps/api/.env.example`. Changing the API port also requires updating the Vite proxy.

## Validation

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

For end-to-end tests, install Chromium first:

```bash
npx playwright install chromium
npm run test:e2e
```

## Project structure

```text
apps/
  api/    GraphQL API, forecast integrations, and activity scoring
  web/    React interface and end-to-end tests
docs/     Technical decisions and backlog
```

## Key decisions

- **Backend-owned scoring:** activity scores, rankings, and explanations are calculated by the API.
- **Explicit availability:** missing forecast data is distinguished from unsuitable conditions.
- **Coastal validation:** surfing uses coastline proximity alongside marine forecast checks.
- **Transparent results:** the interface displays evaluated time windows, contributing factors, and score limitations.

The coastline dataset is bundled with the API. Python is only needed to regenerate it, not to run or build the application.

## Limitations

Scores are planning estimates based on forecast conditions. Coastal proximity does not guarantee a usable surf spot, and snow depth does not confirm resort or trail availability. Chart values represent averages over evaluated windows, not hourly forecasts.

## Documentation and data

- [Technical decisions and scoring rules](docs/DECISIONS.md)
- [Backlog](docs/BACKLOG.md)
- [Coastline dataset provenance and regeneration](apps/api/src/locations/data/README.md)

Weather forecasts and location search are provided by Open-Meteo. Coastline data comes from Natural Earth.
