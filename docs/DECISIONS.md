# Engineering Decisions and Reasoning

**Project:** Weather Activity Planner  
**Updated:** 2026-10-20

This document explains the engineering and product choices made while building the take-home exercise. It is a decision record, **not** a transcript of AI prompts or a claim that every implementation step was AI-driven. The chronological notes are preserved separately in [WORKING_NOTES.md](./WORKING_NOTES.md), alongside the Git history.

## 1. Understanding the assignment

The task asks for a service and interface that take a city or town and rank the next seven days for **skiing, surfing, outdoor sightseeing and indoor sightseeing**, using Open-Meteo data. Node.js and GraphQL are required on the backend; frontend technology is open. The assessment explicitly prioritizes the reasoning behind assumptions, scoring decisions and trade-offs. A small, well-reasoned solution is preferred to feature completeness.

I treated the weather-to-activity mapping as the central engineering problem. Showing forecast values is straightforward; defining a defensible and explainable suitability score is not. The implementation therefore keeps scoring rules in the backend and exposes the inputs and reasons behind each assessment.

**Interpretation and assumptions:**

- A score expresses **weather suitability**, not personal safety, activity availability or the probability of a successful outing.
- The intended user is a recreational visitor with intermediate sporting experience. This is a modeling assumption, not a user profile collected by the application.
- The seven-day window starts **tomorrow** and covers seven full calendar days in the selected destination's timezone. Using complete days avoids ranking a partly elapsed day alongside full days.
- Each activity is ranked independently. A skiing score of 80 and a surfing score of 80 share a category scale, but they do not imply equivalent real-world conditions or risk.
- The Open-Meteo forecast describes model grid cells, not individual ski resorts, surf breaks or attractions. The UI must communicate that limitation.

## 2. Technology Choices

The guiding principle was to select technologies that solve specific problems without introducing unnecessary infrastructure.

The following decisions reflect the project's requirements, architectural considerations, and practical trade-offs rather than formal benchmarks of competing technologies.

### Backend and Architecture

#### Node.js 24 + TypeScript

**Why:** Node.js satisfies the backend requirements while TypeScript provides a consistent language across the entire application.

Strict typing helps maintain consistency between GraphQL contracts, normalized weather observations, and scoring models.

**Trade-off:** TypeScript provides compile-time guarantees but does not validate external data at runtime.

#### GraphQL Yoga

**Why:** GraphQL was explicitly required by the exercise. Yoga provides a lightweight implementation that integrates directly with Node.js HTTP without requiring a larger backend framework.

Its schema-first approach fits the two primary operations:

- `searchPlaces`: Resolves city and town searches.
- `activityForecast`: Retrieves and evaluates forecasts for a selected location.

**Trade-off:** GraphQL requires additional schema definitions, resolver configuration, and type generation compared with a simple REST API.

#### GraphQL SDL + Generated TypeScript Types

**Why:** GraphQL Schema Definition Language (SDL) serves as the single source of truth for the API contract.

Generating TypeScript types from the schema reduces duplication and prevents inconsistencies between frontend queries and backend responses.

**Trade-off:** Generated types provide compile-time safety but do not replace runtime validation.

#### npm Workspaces

**Why:** A monorepo keeps the frontend and backend in a single repository while maintaining clear application boundaries.

The structure is intentionally simple:

- `apps/api`: GraphQL API and business logic.
- `apps/web`: React frontend.

A single lockfile and shared development commands simplify dependency management and local setup.

**Trade-off:** A shared package was intentionally avoided because the current architecture does not justify the additional abstraction.

### Frontend

#### React + Vite

**Why:** React aligns with the technologies commonly used by the exercise team and provides a component-based approach to building the interface.

Vite offers fast development startup, efficient hot module replacement, and straightforward production builds.

The application is a client-rendered single-page interface, so server-side rendering was not necessary.

**Trade-off:** This approach does not provide SSR or framework-managed backend functionality, neither of which is required by the project.

#### TanStack Router

**Why:** TanStack Router manages application navigation and URL state with TypeScript support.

The selected location is represented by its `placeId`, allowing users to:

- Refresh the page without losing their selection.
- Navigate through browser history.
- Share URLs that restore the selected destination.

**Trade-off:** It introduces routing infrastructure to a relatively small application, but the benefits of persistent navigation state justify the dependency.

#### TanStack Query

**Why:** TanStack Query manages asynchronous requests and their associated states.

It provides:

- Query caching and cache isolation.
- Loading and error states.
- Retry mechanisms.
- Request cancellation.
- Protection against stale responses.

This avoids implementing repetitive request-management logic across React components.

**Trade-off:** Client-side caching improves responsiveness but does not replace server-side data validation or guarantee forecast freshness.

#### Tailwind CSS + shadcn/ui

**Why:** Tailwind provides a utility-first styling approach, while shadcn/ui offers customizable component implementations that remain part of the application's source code.

Together, they support:

- Consistent visual components.
- Responsive layouts.
- Light and dark themes.
- Semantic styling tokens.
- Maintainable component-level customization.

The selected shadcn/ui configuration uses the Base UI preset.

**Trade-off:** Component libraries do not automatically guarantee accessibility. Keyboard navigation, focus management, contrast, and assistive technology compatibility still require explicit verification.

### Validation and Testing

#### Zod

**Why:** Zod validates data at runtime, particularly at boundaries where TypeScript cannot guarantee correctness.

It is used to validate:

- External Open-Meteo API responses.
- User search inputs.
- Application data contracts where runtime verification is necessary.

**Trade-off:** Runtime schemas introduce additional definitions, but they address problems that static TypeScript types cannot solve.

#### Vitest

**Why:** Vitest integrates naturally with the project's TypeScript and Vite ecosystem.

It supports deterministic tests for:

- Scoring algorithms.
- Thresholds and boundary conditions.
- Input validation.
- GraphQL and application behavior.
- Missing or malformed weather observations.

Controlled fixtures ensure that tests do not depend on the availability of external weather services.

**Trade-off:** Mocked API responses provide reproducibility but cannot guarantee the availability or correctness of live upstream services.

#### Playwright + axe-core

**Why:** Playwright verifies application behavior in a real browser, while axe-core provides automated accessibility checks.

Together, they cover:

- Search and location selection.
- Keyboard navigation.
- Loading and error states.
- Responsive layouts.
- Browser navigation and URL restoration.
- Accessibility violations detectable through automation.

**Trade-off:** Automated accessibility testing cannot replace manual verification with screen readers and browser zoom.

### HTTP Communication

#### Native Fetch API

**Why:** The native Fetch API provides everything required for communication with Open-Meteo and the GraphQL endpoint.

An additional HTTP client would introduce a dependency without providing a significant benefit for the application's current needs.

**Trade-off:** Request timeouts, cancellation, and error handling must be implemented explicitly.

### Additional Visualization Libraries

The following technologies were introduced after the initial implementation to improve the presentation of forecast information. They are not required by the original exercise.

#### Recharts

**Why:** Recharts provides visual representations of weather measurements across the seven-day forecast.

The charts display normalized measurements provided by the backend, such as temperature, wind speed, snow depth, and wave height.

The frontend does not recalculate activity suitability scores.

An accessible data table provides an alternative representation of the same measurements.

**Trade-off:** The additional charting dependency increases the frontend bundle size. Code splitting remains a possible future optimization.

#### COBE

**Why:** COBE provides a lightweight WebGL globe that visually identifies the selected destination.

The globe uses the canonical coordinates returned by the backend.

A textual location description and coordinates remain available when WebGL rendering is unsupported.

**Trade-off:** WebGL introduces rendering and lifecycle considerations, including canvas cleanup, resizing, and compatibility with different devices.

### Deployment

#### Vercel

**Why:** Vercel was selected as the deployment platform because it supports both the static Vite frontend and Node.js serverless functions.

The deployment architecture consists of:

- A statically built React application.
- A Node.js GraphQL function.
- Same-origin `/graphql` requests through a rewrite rule.

This keeps deployment relatively simple without introducing separate hosting services for the frontend and backend.

**Trade-off:** Serverless execution introduces platform-specific constraints, including execution duration and cold starts.

The deployment configuration does not change the application's business logic or scoring responsibilities.

Deployment preparation should not be confused with a verified production deployment.

## 3. Backend design and boundaries

The application follows this dependency direction:

```text
GraphQL resolver
    -> application service
        -> Open-Meteo adapters (geocoding / forecast / marine)
        -> validated, normalized observations
        -> pure activity scoring
    -> GraphQL response mapping
```

This separation matters because the scoring rules can be unit-tested without HTTP calls or a running GraphQL server. The adapters own network behavior, timeouts and upstream payload validation; resolvers do not implement formulas.

**GraphQL operations:**

- `searchPlaces(query: String!): [Place!]!` returns candidate locations with identifiers and geographic context. Ambiguous names remain selectable; no matches return an empty list.
- `activityForecast(placeId: ID!): ActivityForecast` resolves a canonical location server-side and returns four activity groups with seven chronological daily assessments, explanations, evaluated periods, limitations, data sources and server-calculated ranks.

The frontend uses the canonical location ID rather than trusting client-supplied coordinates. The server is the single source of truth for score calculation and ranking.

**Failure policy:** a forecast being poor and a forecast being unavailable are different outcomes. A missing required observation produces an unavailable assessment with a `null` score, not a zero. A marine API failure should not prevent complete weather-based assessments from being returned. Invalid input and unrecoverable failures use stable GraphQL error codes; independent activity failures remain visible as assessment statuses.

Statuses recorded in the implementation include `AVAILABLE`, `INSUFFICIENT_DATA`, `NO_VALID_WINDOW`, `LOCATION_UNSUPPORTED`, `UPSTREAM_UNAVAILABLE` and the later geographic case `NO_NEARBY_COAST`.

## 4. Defining activity suitability

This is the part of the assignment where domain research and AI assistance were most useful. I did not assume that I already knew which weather measurements were most important for skiing or surfing. I used AI to explore candidate factors and threshold choices, then selected a constrained, explicit scoring model that I could explain and test.

**These weights and thresholds are product heuristics, not published sporting standards, calibrated prediction models or safety advice.** They make the prototype deterministic and interpretable; they should be revisited with domain expertise and local venue data for a production product.

### 4.1 Shared scoring rules

1. Transform each required hourly observation into a factor suitability value between **0 and 100** using piecewise-linear interpolation and bounded ideal ranges.
2. Combine factors using the activity-specific weights below. For indoor sightseeing, start from 100 and subtract bounded penalties.
3. Apply hour-level caps after weighting, then aggregate eligible hours or the selected surfing window.
4. **Round only after aggregation** and assign `POOR` (0–39), `FAIR` (40–59), `GOOD` (60–79) or `EXCELLENT` (80–100).
5. Rank the seven days **separately for each activity** by final rounded score. Break ties with the earlier local date.
6. Do not invent missing measurements or reweight the remaining factors when any required observation is absent.

**Time windows:** skiing and outdoor sightseeing use the mean hourly score from 09:00 to before 17:00 local time, restricted to daylight. Indoor sightseeing uses the same hours without a daylight restriction. Surfing picks the highest-scoring mean of **three consecutive eligible daylight hours**, breaking window ties in favor of the earliest window.

### 4.2 Factors and Their Rationale

The scoring model assigns different weights to meteorological factors according to their relevance to each activity. These weights are product heuristics, established to provide consistent and explainable recommendations rather than scientifically validated safety assessments.

| Activity                | Factors and Weights                                                                                         | Rationale                                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Surfing**             | Wave height (45%), wave period (30%), sustained wind (15%), gusts (10%)                                     | Wave characteristics are the primary indicators of potential surfing conditions. Wind can negatively affect wave quality. Wave height alone is insufficient, and offshore wind direction requires knowledge of the specific beach orientation. |
| **Skiing**              | Snow depth (40%), air temperature (20%), sustained wind (15%), visibility (15%), liquid precipitation (10%) | Snow coverage is fundamental to skiing suitability. Temperature, wind, visibility, and precipitation influence overall conditions. Snow depth measured at city coordinates does not establish conditions at nearby ski resorts.                |
| **Outdoor sightseeing** | Apparent temperature (40%), precipitation (40%), sustained wind (20%)                                       | Thermal comfort and precipitation directly affect outdoor activities. Wind influences comfort, while cloud coverage was deliberately excluded to keep the scoring model simple.                                                                |
| **Indoor sightseeing**  | Base score (100), temperature penalty (up to 15), precipitation penalty (up to 15), wind penalty (up to 10) | Indoor activities are less affected by weather. Adverse outdoor conditions reduce suitability only moderately rather than artificially increasing the indoor score.                                                                            |

#### Weighting Considerations

The weights reflect the relative importance of each variable within the available Open-Meteo data.

- **Surfing:** Wave height and period account for 75% of the score because they are the primary available indicators of wave conditions.
- **Skiing:** Snow depth receives the highest weight (40%), as snow coverage is a prerequisite for the activity.
- **Outdoor sightseeing:** Temperature and precipitation share the highest weights (40% each), prioritizing comfort and exposure to rain.
- **Indoor sightseeing:** Rather than using weighted positive factors, the model starts at 100 and applies bounded weather-related penalties.

All scoring factors are normalized to a 0–100 scale before aggregation, except for indoor sightseeing, which uses direct penalties.

The resulting scores represent **weather suitability**, not guarantees of safety, venue availability, or actual sporting conditions. |

### 4.3 Key thresholds and limits

- **Surfing:** height suitability is zero at or below **0.2 m**, ideal at **0.8–1.5 m**, and zero at or above **3 m**. Wave period is zero at **5 s** or less and ideal at **10 s** or more. Sustained wind falls from ideal at **10 km/h** or less to zero at **30 km/h** or more; gusts from **15** to **40 km/h**. Waves **>= 3 m** cap the hourly score at **20**.
- **Skiing:** snow depth reaches its ideal contribution at **50 cm**. **Zero snow forces a score of 0**; below **10 cm** caps the hourly score at **20**. Temperature is ideal at **-8 to -1°C** and unsuitable by the endpoints **-20°C** and **5°C**. Wind ranges from ideal at **<= 15 km/h** to zero at **>= 50 km/h**; visibility from zero at **<= 200 m** to ideal at **>= 5,000 m**; rain from ideal at **0** to zero at **>= 2 mm/h**. Visibility **<= 200 m** or gusts **>= 60 km/h** cap at **20**.
- **Outdoor sightseeing:** apparent temperature is ideal at **16–26°C**, falling to zero at **<= 0°C** or **>= 38°C**. Precipitation falls from ideal at **0** to zero at **>= 3 mm/h**; wind from **<= 15** to **>= 45 km/h**.
- **Indoor sightseeing:** temperature has no penalty at **10–30°C**, reaching the maximum penalty at **<= -5°C** or **>= 40°C**. Rain reaches its maximum penalty at **>= 3 mm/h**; wind at **>= 50 km/h**.
- **Thunderstorm codes 95, 96 and 99** cap outdoor activity hourly scores at **20** and indoor scores at **60**. These are scoring rules, **not severe-weather alerts**.

Tides, surf-break direction and spot-specific wave behavior were excluded because a city-level input does not identify a particular surf break. Ski resort opening hours, slope grooming and elevation-specific snow conditions were also excluded for the same reason.

### 4.4 Sanity checks

Examples used to inspect the model's behavior:

- Surfing at **1.2 m** wave height, **8 s** period, **10 km/h** wind and **15 km/h** gusts: `45 + 18 + 15 + 10 = 88` (**EXCELLENT**), before any exceptional cap.
- Skiing with **50 cm** snow, **-5°C**, **10 km/h** wind, **5 km** visibility and no rain: **100** with no cap; with **zero snow**, the score must be **0** even if every other variable is ideal.
- Outdoor sightseeing at **21°C** apparent temperature with no rain and **10 km/h** wind: **100**. With **3 mm/h** precipitation and the other measurements unchanged: **60**.
- Indoor sightseeing at **21°C**, **3 mm/h** precipitation and **10 km/h** wind: `100 - 0 - 15 - 0 = 85`; a thunderstorm cap reduces that hour to **60**.
- If any required eligible hour is missing, the assessment must be **unavailable**, not deceptively rated `0 / POOR`.

These examples are sanity checks of a heuristic, not evidence that the model predicts real sporting outcomes.

## 5. Geographic applicability: a problem discovered during implementation

A city-level forecast can return marine model information even when the requested location is inland. Initially the implementation bounded marine-grid distance to **25 km** from the selected coordinates; this protects against obviously remote sea cells but does not establish that a city is actually near an ocean coastline.

A later check added a backend-only **Natural Earth 1:50m coastline dataset**. The application estimates the spherical distance from the canonical location to ocean coastline segments. Because the source geometry is generalized, it uses **35 km** as the rejection boundary: the existing nearby concept of 25 km plus a conservative 10 km tolerance. Locations farther away are reported as `NO_NEARBY_COAST` for surfing.

**Why keep both checks?** Coastline proximity answers whether ocean coastline is plausibly nearby; the marine-grid check answers whether the returned marine data is geographically close enough. Neither confirms an actual surf beach. The system retains limitations for omitted small islands and imperfect coastal geometry, and does not make special exceptions based on city names.

This replaced an ambiguous “unavailable” experience for inland locations such as São Paulo with an explicit geographic explanation. The scoring formulas did not need to move into the UI or acquire city-specific special cases.

## 6. UI decisions and accessibility

I chose an explicit **search -> candidate selection -> forecast** flow because cities can have duplicate names. Requiring a confirmed place ID prevents silently analyzing the wrong location. Search uses validation and distinguishes no results, request failure, loading and partial availability.

The interface evolved from four large sections to activity tabs and a seven-day selector to reduce scrolling. The best day is selected using the rank supplied by the backend; **rank 1 does not necessarily mean good weather**. Restricted activities remain discoverable with an explanation rather than disappearing without context.

Scores are always expressed using both **numbers and text labels**; color is supplementary. The selected measurement also has a readable table, not only a chart. Keyboard interaction, focus behavior, narrow-screen reflow, contrast and reduced-motion behavior are covered by automated browser checks. A **manual screen-reader review is still outstanding** in the supplied verification record, and should not be presented as completed.

## 7. How I used AI

The brief explicitly encourages using AI, but I want the record to distinguish **where it materially helped** from the rest of the engineering work.

1. **Business-rule research and scoring design.** I used AI to investigate which weather conditions matter for activities outside my domain expertise, challenge initial assumptions, work through weights and caps, and identify boundary cases. The resulting rules were treated as hypotheses and made explicit so they could be tested and revised.
2. **GraphQL setup.** I used AI for targeted help bootstrapping GraphQL Yoga, SDL/resolver wiring and the TypeScript contract setup. The API boundary and backend ownership of scoring were project decisions, not an excuse to move logic into generated client code.
3. **Independent validation with Python.** I used a separate Python-based arithmetic check to sanity-check scoring calculations independently of the TypeScript implementation. **Python is not part of the runtime stack**. The concrete script/output should be kept with the repository if it is to serve as independently reproducible evidence.

The dated working log also records **occasional AI-provided implementation suggestions, code drafts and debugging assistance**, including some UI iterations. I am not claiming that the three items above were the _only_ AI interactions. They are the areas where its assistance was most substantively needed. The project is also not an AI-powered application: no model is called during normal user requests.

I retained responsibility for deciding what belonged in scope, accepting or rejecting suggestions, reviewing the behavior and choosing what to test. The best evidence for this is the actual code, commits, tests, original working notes and the limitations recorded here, not a reconstructed narrative of perfect decisions.

## 8. Verification and evidence

The supplied project log records the following latest checks on **2026-10-20**:

- **119 API tests** and **26 browser tests**, including automated axe checks in light and dark themes, passing at that point.
- Type checking, linting and production builds passing after the coastline change.
- Regression coverage for inland and coastal places, marine failures, date/selection behavior and accessibility-related browser behavior.

These are **recorded results**, not checks rerun while editing this document. The precise commands, fixtures, coverage and environment belong in the repository. The separate Python calculation check should be backed by its own artifact if its results are cited externally. Manual spoken screen-reader testing remains a known gap.

## 9. Scope decisions and limits

**Added after the core scope:** charts, a globe, richer loading states, activity tabs and a coastline proximity guard. These improve explanation and usability, but are not necessary to prove the basic algorithm. Their extra dependency and bundle cost are acknowledged rather than presented as mandatory architecture.

**Known limitations:** scoring thresholds are uncalibrated heuristics; forecast quality depends on external data; city coordinates are not venue conditions; marine height is not breaking-wave height; a nearby coastline does not guarantee surfable waves; the geographic dataset is approximate; automated accessibility tests do not replace real assistive-technology use.

## 10. Sources and supporting records

**Assignment and original record**

- Original take-home exercise: Appendix A of `weather-activity-planner-task.pdf` (supplied project reference).
- [WORKING_NOTES.md](./WORKING_NOTES.md): preserved chronological implementation notes, including discarded ideas, adjustments and AI-assisted sessions.
- Repository Git history and test files: the authoritative record of implemented changes and reproducible checks.
- `apps/api/src/locations/data/README.md`: coastline data provenance and conversion details, as recorded in the project notes.

**Technical and domain references**

- [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs)
- [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [GraphQL Yoga documentation](https://the-guild.dev/graphql/yoga-server)
- [TanStack Router: search parameters](https://tanstack.com/router/latest/docs/guide/search-params)
- [TanStack Query: overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zod: runtime schema validation](https://zod.dev/basics)
- [Vite: design rationale](https://vite.dev/guide/why.html)
- [Vitest: why Vitest](https://vitest.dev/guide/why.html)
- [Playwright: end-to-end testing](https://playwright.dev/docs/intro)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [COBE globe](https://github.com/shuding/cobe)
- [Met Office: mountain forecasts](https://weather.metoffice.gov.uk/guides/mountain/forecast)
- [National Weather Service: wave details](https://www.weather.gov/marine/wavedetail)

The source links document APIs, tool capabilities and domain context. **They do not independently validate the product-specific weights or thresholds** selected above.
