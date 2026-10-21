# Weather Activity Planner

A full-stack application that analyzes weather forecasts to help users identify suitable days for skiing, surfing, outdoor sightseeing, and indoor sightseeing.

## Features

- Location search and seven-day activity forecasts.
- Daily suitability scores with contributing factors and explanations.
- Weather charts and an interactive location globe.
- Weather-based activity restrictions and coastal proximity validation.
- Responsive interface with light and dark themes.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Router, TanStack Query, Recharts, and COBE.
- **Backend:** Node.js 24, TypeScript, GraphQL Yoga, and Zod.
- **Testing:** Vitest, Playwright, and axe-core.
- **Data:** Open-Meteo and Natural Earth.

## Running Locally

Requires **Node.js 24** and **npm**.

Install dependencies from the repository root:

```bash
npm ci
```

Create the local API configuration:

```bash
cp apps/api/.env.example apps/api/.env
```

Start the API and frontend in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173).

The GraphQL API runs at [http://127.0.0.1:4000/graphql](http://127.0.0.1:4000/graphql).

Vite proxies frontend GraphQL requests to the API. Internet access is required for location searches and weather forecasts.

## Validation

Run the following commands from the repository root:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

For end-to-end tests, install Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

## Project Structure

```text
apps/
  api/    GraphQL API, weather integrations, and scoring engine
  web/    React frontend

docs/
  DECISIONS.md
  BACKLOG.md
```

## Assumptions and Limitations

- **Forecast period:** Seven complete calendar days starting tomorrow, using the selected location's timezone.
- **Activity scoring:** Scores represent weather suitability, not safety or actual venue availability.
- **Ranking:** Each activity is ranked independently based on its calculated daily score.
- **Scoring model:** Weather factors, weights, and thresholds are defined as product heuristics, not scientifically calibrated predictions.
- **Missing data:** Unavailable observations are distinguished from unfavorable conditions.
- **Geographic limitations:** Coastal proximity does not guarantee a suitable surfing location, and snow depth does not confirm ski resort availability.
- **Weather charts:** Measurements represent averages over evaluated activity windows rather than complete hourly forecasts.

The scoring model and its assumptions are explained in detail in [Engineering Decisions](./docs/DECISIONS.md).

## Development Process

The application was developed incrementally using feature branches and pull requests.

The implementation progressed from project setup and Open-Meteo integration to business logic, GraphQL, frontend development, testing, and additional improvements.

AI assistance was particularly useful for researching weather-related business rules, setting up GraphQL, and independently checking scoring calculations with Python.

Supporting documentation:

- [Engineering Decisions](./docs/DECISIONS.md): Technical choices, scoring rules, assumptions, trade-offs, and AI-assisted work.
- [Development Backlog](./docs/BACKLOG.md): Implementation tasks and additional improvements.

## Data Sources

- [Open-Meteo](https://open-meteo.com/): Location searches, weather forecasts, and marine conditions.
- [Natural Earth](https://www.naturalearthdata.com/): Geographic coastline data.

The coastline dataset is bundled with the backend. Python is only required to regenerate this dataset, not to run the application.

Dataset provenance and regeneration instructions are available in [Coastline Data Documentation](./apps/api/src/locations/data/README.md).
