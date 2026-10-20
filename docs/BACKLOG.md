# Development Backlog

This backlog tracks the main development tasks of the Weather Activity Planner.
Technical decisions, assumptions, and trade-offs are documented in [DECISIONS.md](./DECISIONS.md).

## Tasks

- [x] **B01 - Define Activity Scoring**
      Define weather factors, weights, thresholds, and ranking rules for all four activities.

- [x] **B02 - Define Architecture**
      Establish the project structure, technology stack, GraphQL contract, and application boundaries.

- [x] **B03 - Plan User Interface**
      Define the search flow, activity results, responsive behavior, and accessibility requirements.

- [x] **B04 - Project Setup**
      Initialize the monorepo, configure dependencies, TypeScript, linting, formatting, and development scripts.

- [x] **B05 - Open-Meteo Integration**
      Implement geocoding, weather, and marine API clients with response validation and error handling.

- [x] **B06 - Scoring Engine**
      Implement activity suitability calculations, daily rankings, and unit tests.

- [x] **B07 - GraphQL API**
      Implement queries, resolvers, service orchestration, and API error handling.

- [x] **B08 - Location Search**
      Build city search, location selection, input validation, and loading/error states.

- [x] **B09 - Activity Forecast**
      Display seven-day forecasts, activity scores, rankings, explanations, and weather measurements.

- [x] **B10 - Theme Support**
      Implement light, dark, and system themes with persistent user preferences.

- [x] **B11 - Integration and Accessibility Testing**
      Verify application flows, responsive behavior, keyboard navigation, and accessibility.
      Automated tests completed; manual screen-reader verification pending.

- [x] **B12 - Documentation and Submission**
      Finalize README, technical documentation, repository review, and deployment verification.

## Additional Improvements

- [x] **UI Enhancements**
      Add activity tabs, daily navigation, loading skeletons, and score indicators.

- [x] **Weather Visualization**
      Integrate Recharts for weather measurements and COBE for geographic visualization.

- [x] **Geographic Validation**
      Improve coastal proximity detection and prevent misleading surfing recommendations for inland locations.

- [x] **Deployment Configuration**
      Prepare Vercel configuration for the frontend and GraphQL API.
