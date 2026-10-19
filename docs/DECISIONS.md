# Decisions and working notes

Record reasoning as it happens. Keep rejected options and scope cuts only when they explain an actual choice.

## 2026-10-17 — Initial planning

Confirmed requirements:

- Node.js and GraphQL backend; Open-Meteo data; four activities over seven days.
- React/Vite/TypeScript frontend direction, with TanStack Router, shadcn/ui, Tailwind and Zod.
- English default UI; accessible interactions; light and dark themes.
- User-provided JS/TS coding standards apply to future code.
- Plan first; proceed through numbered tasks using a guided workflow like fs-test.

Proposals awaiting discussion:

- One repository with separate web and API workspace applications.
- Scores from 0 to 100 with category labels and explanations.
- GraphQL Yoga and TanStack Query as optional additions; verify licenses when selecting dependencies.

Open questions for B01:

- Practitioner profile and the meaning of a comparable score across activities.
- Daily scoring window, local timezone, whether today counts, and treatment of elapsed hours.
- City coordinates versus nearby beaches/resorts; geographic applicability versus unavailable data.
- Indoor sightseeing's intrinsic weather suitability versus its relative appeal in poor outdoor weather.
- Aggregation, thresholds, weights, ties and partial upstream failures.

No application code has been created.

## B01 — Accepted scoring specification

The user approved the following rules after discussion. These supersede the initial B01 questions above. Thresholds are product heuristics, not official sporting standards or safety assessments.

### Meaning, time and ranking

- Recreational user, intermediate sporting ability. Scores measure weather suitability, not probability, venue availability or safety.
- Seven complete local calendar days starting tomorrow, using the destination timezone.
- Ski/outdoor: hourly score average for 09:00 <= local time < 17:00, restricted to daylight. Indoor: same hours without daylight restriction.
- Surf: highest average over three consecutive hourly intervals wholly within daylight, with the winning window included in results. Earlier window wins a tie.
- Rank days separately for each activity; compare final rounded scores, with earlier dates winning ties. Round only after aggregation.
- Labels: POOR 0–39, FAIR 40–59, GOOD 60–79, EXCELLENT 80–100.
- All required observations for the activity's eligible period must be present. Missing observations make that assessment unavailable; never replace them with zero or reweight remaining factors. No eligible period/window also makes the assessment unavailable.
- Distinguish lack of data from proven lack of applicability. Marine data alone does not establish a local surf venue. Geographic eligibility detection remains an integration question for B02/B05.

### Curves and weights

Each factor is bounded to 0–100. Interpolate linearly between the listed endpoints, remain at 100 across ideal plateaus, and clamp beyond outer limits. Weights sum to one. Apply hourly caps after weighting, before daily/window aggregation. Where multiple caps apply, use the lowest.

Surf:

- Significant wave height, 45%: 0 at <=0.2 m; 100 at 0.8–1.5 m; 0 at >=3 m.
- Mean wave period, 30%: 0 at <=5 s; 100 at >=10 s.
- Sustained wind, 15%: 100 at <=10 km/h; 0 at >=30 km/h.
- Gusts, 10%: 100 at <=15 km/h; 0 at >=40 km/h.
- Wave height >=3 m caps hourly score at 20.
- Tides and shore-relative wind direction excluded: no spot orientation/tidal suitability model. Marine wave heights are not breaking-wave heights.

Ski:

- Snow depth, 40%: 0 at 0 cm; 100 at >=50 cm. Convert API meters to centimeters.
- Air temperature, 20%: 0 at <=-20 C; 100 at -8 to -1 C; 0 at >=5 C.
- Sustained wind, 15%: 100 at <=15 km/h; 0 at >=50 km/h.
- Visibility, 15%: 0 at <=200 m; 100 at >=5,000 m.
- Liquid precipitation (rain plus showers), 10%: 100 at 0 mm/h; 0 at >=2 mm/h.
- Zero snow forces score 0. Snow below 10 cm caps score at 20. Visibility <=200 m or gusts >=60 km/h cap score at 20.
- No fresh-snow bonus. City snow depth does not prove resort conditions or opening status.

Outdoor sightseeing:

- Apparent temperature, 40%: 0 at <=0 C; 100 at 16–26 C; 0 at >=38 C.
- Total precipitation, 40%: 100 at 0 mm/h; 0 at >=3 mm/h.
- Sustained wind, 20%: 100 at <=15 km/h; 0 at >=45 km/h.
- No cloud-cover penalty or separate precipitation-probability factor.

Indoor sightseeing:

- Start at 100 and subtract three bounded penalties.
- Apparent temperature penalty: 0 at 10–30 C; 15 at <=-5 C or >=40 C, linear between endpoints.
- Total precipitation penalty: 0 at 0 mm/h; 15 at >=3 mm/h.
- Wind penalty: 0 at <=20 km/h; 10 at >=50 km/h.
- No inverse-outdoor formula; bad outdoor weather does not increase indoor scores.

Thunderstorm weather codes (95, 96, 99) cap outdoor sporting/sightseeing hourly scores at 20 and indoor at 60. These are classification caps, not weather alerts. Required inputs include weather code for each activity and gusts for ski even though they are cap-only inputs.

### Worked checks

- Surf: height 1.2 m, period 8 s, wind 10 km/h, gusts 15 km/h, no thunderstorm: 45 + 18 + 15 + 10 = 88, EXCELLENT. Three identical eligible hours produce a window score of 88.
- Surf boundary: height 0.2 m, period 5 s, wind 30 km/h, gusts 40 km/h: all factors 0, score 0, POOR. At 3 m with other factors ideal, raw score 55 is capped at 20.
- Ski: 50 cm snow, -5 C, wind 10 km/h, visibility 5 km, no rain, low gusts and no thunderstorm: score 100. Zero snow forces 0 even with all other factors ideal. At 5 cm, otherwise ideal, raw score 64 is capped at 20.
- Outdoor: apparent temperature 21 C, no precipitation, wind 10 km/h, no thunderstorm: score 100. With 3 mm/h precipitation and otherwise identical conditions: score 60.
- Indoor: apparent temperature 21 C, precipitation 3 mm/h and wind 10 km/h, no thunderstorm: 100 - 0 - 15 - 0 = 85. Thunderstorm cap lowers this hour to 60.
- If any required hour is missing, return an unavailable assessment with null score/category/rank; preserve other activities with complete data.

Remaining geographic limitations will be visible in results. The weather index does not assert the presence of resorts, beaches or attractions.

## B02 — Accepted architecture

- One repository, npm workspaces, `apps/web` and `apps/api`; one root lockfile. No shared package until justified.
- Node.js 24 LTS, TypeScript and GraphQL Yoga with Node HTTP on the API. React/Vite, TanStack Router/Query, shadcn/ui, Tailwind and Zod on the web. Native fetch for upstream and GraphQL HTTP calls. Vitest for pure scoring/contract tests. Pin compatible versions during B04.
- Use SDL as the GraphQL contract source of truth. Generate operation/resolver TypeScript types from it when implementing B07/B08; generated types are not runtime validators. Prefer generated code over a hand-maintained shared DTO package.
- API flow: GraphQL resolver -> application service -> Open-Meteo adapters -> validated normalized observations -> pure scoring -> response mapping. Weather and marine requests can run concurrently; failures remain independent where possible.
- Search operation: `searchPlaces(query: String!): [Place!]!`. Return candidate ID, name, optional region/country, country code, coordinates and timezone. No matches returns an empty list, ambiguous names return multiple candidates.
- Forecast operation: `activityForecast(placeId: ID!): ActivityForecast`. Resolve canonical place details server-side; client labels/coordinates are not authoritative. URL can preserve selected place ID.
- Forecast includes place, timezone, generation time, scoring version, source attribution and four activity groups with seven chronological daily assessments each. Rank is computed server-side within each activity, with unavailable days excluded.
- Daily assessment fields: local date, activity, status, nullable score/category/rank, evaluated time window, factor contributions, cap reasons, English summary and limitations. Factor details refer to the evaluated period/window; do not mislabel mean raw observations as inputs to a nonlinear aggregate formula.
- Status proposals: AVAILABLE, INSUFFICIENT_DATA, NO_VALID_WINDOW, LOCATION_UNSUPPORTED and UPSTREAM_UNAVAILABLE. Unavailable assessments have null score/category/rank and explanatory reasons.
- Invalid input, unknown place and wholly unavailable upstream data use GraphQL errors with stable extension codes. A marine-only failure returns usable weather-based activity results plus surf assessments marked UPSTREAM_UNAVAILABLE. Unexpected errors use generic messages and server logs.
- Geographic scope proposal: use the selected city's weather grid and expose its limitations. For marine results, reject a sea grid center more than 25 km from the requested location as LOCATION_UNSUPPORTED. This is a deliberately conservative coverage heuristic, not a shoreline distance or proof of surfability. Validate against representative coastal/inland locations in B05 and revisit if it fails.
- No eligible daylight period is NO_VALID_WINDOW, not missing observations. No database, authentication, resort/beach catalog or production caching required.
- Illustrative outcomes: ambiguous search -> multiple places to select; scoreable surf window -> AVAILABLE/88/EXCELLENT with start/end and reasons; marine timeout -> surf UPSTREAM_UNAVAILABLE with null score while other complete activities remain ranked.

Dependency references checked during discussion: GraphQL Yoga, TanStack Query and Vitest are MIT licensed. Complete selected dependency/license review remains part of setup and submission.

## B03 — Accepted UI flow

- Single page: explicit city search submission, accessible candidate selection, then four activity sections with seven chronological days and best-day highlighting.
- Each assessment shows date, score, category and short English explanation; surf includes its best window. Expandable details expose factors and limitations without hover dependency.
- Explicit initial, searching, no-results, forecast-loading, retryable-error and partial-data states.
- Semantic headings/regions, native controls, visible focus, keyboard interaction and concise live announcements. Scores remain understandable without color or icons.
- Mobile sections stack without required horizontal scrolling. Theme follows system initially; System/Light/Dark selection persists.
- English only for the initial version; no translation dependency yet.

## B04 — Guided setup started

The user requested code/instructions, following the fs-test workflow. Application code is supplied in chat for the user to create; its execution is not assumed. Inspection found Node 22.23.2, npm 10.9.8 and nvm available. Instructions switch to the accepted Node 24 runtime before installing. B04 remains incomplete until setup and verification pass.

## B05.1 - Geocoding verification

- The user ran a live search for Santos and resolved ID 3449433 successfully. Homonymous places remained separate; Santos/SP coordinates and timezone matched the lookup.
- Integration naming: GeocodedLocationType is the application model; OpenMeteoLocationResponseType is the validated upstream model; openMeteoClient.ts owns bounded HTTP/JSON requests. Empty lookup data is normalized to null in Zod to preserve type narrowing.
- Added Vitest tests with simulated HTTP responses, including empty results, missing optional fields, invalid inputs, malformed coordinates/timezones/payloads, mismatched IDs, HTTP failures, network failures and request/body timeouts. No test calls the live API.
- Fixed client constant/message typos and preserved the JSON parsing error as the cause. Tests live outside src and have a dedicated no-emit TypeScript configuration, keeping test code out of production output.
- The B05 weather and marine integrations remain pending. The generated project PDF is a separate deliverable and is not part of the suggested geocoding commit. Commits remain user-owned.

## 2026-10-19 - File naming convention

The user requested camelCase for project-owned filenames that do not require kebab-case. Renamed source, test and generator files; updated imports, test mocks, package scripts and code-generation mappers. React components retain PascalCase; tool-defined filenames, URL routes and existing directories are preserved. Existing uncommitted B07 changes are retained. No commit is created by this migration.

## 2026-10-19 — B08 guided implementation

The user confirmed B07 completion and requested the next implementation as code in chat, with each file path given before its contents. Backlog statuses now reflect B04–B07 completion and B08 in progress.

Follow B03's explicit search submission rather than the assistant's later debounce suggestion. Use native radio controls for candidate selection and TanStack Query cancellation/cache isolation for requests. Generate frontend contract types from the existing SDL and validate HTTP responses with Zod; no additional runtime dependency is needed. Candidate selection remains in page state in B08; URL placeId persistence and canonical restoration are deferred to B09 alongside forecast loading. These are implementation choices for the guided B08 delivery; browser and assistive-technology verification remain pending.

## 2026-10-19 — B08 acceptance and B09 guided implementation

The user confirmed B08 single selection, arrow-key navigation, input validation, no matches, API failure/retry and passing code checks. B08 is complete; manual screen-reader verification remains part of B11. React components follow the user's PascalCase-directory/index.tsx convention.

B09 code is supplied in chat for the user to implement. Persist placeId through TanStack Router search state and restore canonical place details through activityForecast. Display chronological days with backend-provided ranks and highlight rank 1 without implying favorable conditions. Format calendar dates without browser-timezone shifts and evaluation times in the destination timezone. Keep null scores unavailable, preserve partial activities, expose factor averages/negative indoor contributions and scoring limits, and show source attribution. Increase GraphQL transport timeout to 20 seconds to cover sequential 8-second geocoding and 8-second forecast stages. No frontend scoring or ranking calculation is introduced. Browser acceptance remains pending.

## 2026-10-19 — Collapsible activity forecasts

After reporting passing B09 checks, the user requested less scrolling and explicitly authorized direct code edits. Each activity now uses native details/summary, starts collapsed and can be opened independently. Native disclosure markers and visible keyboard focus indicate interaction; daily factors/limitations remain nested disclosures. Changing the selected destination resets activity disclosures through destination-specific React keys. No activity is hidden based on city name or inferred venue availability. Browser keyboard and screen-reader verification of this presentation change remains pending.

## 2026-10-19 — Score colors

The user requested colored scores. Display the backend category using semantic theme tokens: Poor/red, Fair/amber, Good/green and Excellent/blue. Keep the numeric score and English category visible, with unavailable assessments styled neutrally. Add a decorative bar using the backend score directly; hide the redundant bar from assistive technology. Define explicit light/dark foreground/background pairs and verify their text contrast numerically. No thresholds, categories or scores are recalculated in the frontend.

## 2026-10-19 — B10 guided implementation

The user confirmed B09 completion and requested B10 code in chat. Use a labeled native System/Light/Dark select without a new dependency or a global provider for the single header control. Follow live system changes only for System; persist explicit choices in localStorage and synchronize other tabs through storage events. Storage failure leaves the current tab usable. Apply a validated preference through an inline head script before React loads, setting the dark class and color-scheme to reduce an incorrect first paint. The tiny initialization script intentionally mirrors the storage key, accepted values and media query from the TypeScript helpers because it runs before module loading.

When editing the existing layout, migrate it to AppLayout/index.tsx to follow the user's component convention. Strengthen input boundaries and the light-theme focus-ring token so their contrast is at least 3:1 against the existing background and card colors. Theme UI and helpers are supplied in chat; browser and screen-reader coverage is not assumed.

## 2026-10-19 — Scrollable place candidates

Before B11, the user requested a bounded candidate list to reduce page scrolling. Limit the list to the smaller of 28rem and 60svh, showing roughly three to four ordinary cards while allowing long names and zoom to increase individual card height. Use native vertical scrolling and radio controls; keep the legend outside the scroll area and include inner padding for visible focus outlines. Reserve scrollbar space to avoid horizontal shifts. No additional tab stop or custom arrow-key handling is introduced.

## 2026-10-19 — Collapsible location selection

The user requested a disclosure for location candidates after selection. Wrap the existing bounded list in native details/summary and keep a selected-place label visible in the summary. Pointer selection collapses the list and moves focus to the summary so focus does not remain in hidden content. Keyboard radio selection intentionally stays open to preserve arrow-key comparison; the summary remains the native keyboard toggle. Every valid search submission, including repeating the same term, remounts the disclosure open. Keep the radio group's accessible legend inside the disclosure.

## 2026-10-19 — Search validation on submission

The user requested removal of the persistent character-count/region/country instruction and a validation message only after submitting fewer than three characters. Require 3–100 characters after trimming in both frontend and API. Frontend schema messages distinguish too-short and too-long input; display the message in the existing live error region and associate it with the input only when invalid. Query enablement reuses the same input schema. Backend boundary checks cover two-character rejection and three-character acceptance.

## 2026-10-19 — B11 browser and accessibility verification

The user requested B11. Created test/accessibility-integration without committing and added development-only Playwright/axe coverage with deterministic GraphQL responses and the existing backend scoring engine. Tested keyboard/focus, disclosure scrolling, unavailable vs zero, partial data, retry, stale forecasts, URL restoration/history, themes and narrow reflow. axe found a real light-theme unavailable-badge contrast defect (4.34:1); normal foreground on the neutral badge fixes it.

Separate HTTP/UI fixture tests from live upstream and actual assistive-technology checks. A new search adds an unselected history state; test back/forward between selections without inventing a different history model. Browser tests verify B10. B11 remains in progress pending manual spoken-output and actual zoom checks in B11_VERIFICATION.md. npm audit reported the existing shadcn/braces chain; no compatible patch was published in the queried registry and no forced major downgrade was applied.

## 2026-10-19 — Vercel deployment preparation

The user requested publishing the project to Vercel for later portfolio use. Prepared one project rooted at the repository root: Vite static output plus a Node GraphQL function. Share the Yoga instance between the local HTTP server and the function; keep scoring in the backend and preserve the browser's same-origin `/graphql` requests through a rewrite. Use the existing Node 24 runtime and root workspace build. No new production dependency or environment secret is needed. Local Vercel metadata is ignored. Publication requires pushing the changes and importing the repository in the user's Vercel account; no deployment is claimed from local verification alone. See DEPLOYMENT.md for settings and post-deployment checks.
