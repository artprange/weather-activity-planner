# Engineering Decisions and Reasoning

## 1. Assumptions

The main problem was defining explainable activity scores from weather data. I adopted these assumptions:

- Evaluate seven complete days starting tomorrow, in the destination's timezone.
- Model suitability for a recreational visitor with intermediate sporting experience.
- Rank days independently for each activity; scores across activities are not directly comparable.
- Treat scores as weather suitability, not safety advice or confirmation that a venue is available.

City-level forecasts do not describe individual resorts or surf breaks. All scoring weights and thresholds are product heuristics that would need domain validation.

## 2. Architecture

The project uses npm workspaces with a Node.js/TypeScript GraphQL API and a React/Vite frontend.

Node.js and GraphQL were required. GraphQL Yoga avoided a larger backend framework, while React matched the team's stated stack.

The backend separates external data access, normalization, scoring, and GraphQL response mapping. Adapters handle requests, timeouts, and Zod validation; pure scoring functions can be tested without network calls. Generated GraphQL types keep the frontend and backend contracts aligned.

The frontend sends a canonical `placeId`; the backend resolves coordinates and owns scoring and ranking. TanStack Router preserves the location in the URL, and TanStack Query manages remote data and request states.

Missing observations produce a `null` score and an explanation. They are never converted to zero or compensated for by reweighting other factors. A marine failure should not prevent complete weather-based assessments.

## 3. Scoring decisions

### Aggregation and ranking

Required hourly measurements are mapped to 0–100 suitability values using piecewise-linear functions, then combined with activity-specific weights. Hourly caps apply before aggregation.

Skiing and outdoor sightseeing average daylight hours from 09:00 to before 17:00. Indoor sightseeing uses the same hours without the daylight restriction. Surfing selects the best three consecutive eligible daylight hours because a useful window can matter more than a whole-day average.

Scores are rounded after aggregation and classified as `POOR` (0–39), `FAIR` (40–59), `GOOD` (60–79), or `EXCELLENT` (80–100). Ranking ties favor the earlier date; surfing-window ties favor the earlier window.

### Factors and thresholds

**Surfing:** Wave height 45%, wave period 30%, sustained wind 15%, gusts 10%.

Wave characteristics dominate because height alone does not describe wave quality. Ideal height is 0.8–1.5 m; height contributes zero at or below 0.2 m and at or above 3 m. Period contribution rises from zero at 5 seconds to ideal at 10 seconds. Wind contribution falls from ideal to zero over 10–30 km/h, and gust contribution over 15–40 km/h. Waves at or above 3 m cap the hourly score at 20.

**Skiing:** Snow depth 40%, temperature 20%, wind 15%, visibility 15%, liquid precipitation 10%.

Snow receives the largest weight because coverage is fundamental. Its contribution reaches the ideal at 50 cm. Zero snow forces a score of 0; less than 10 cm caps the hourly score at 20.

Temperature is ideal at -8 to -1°C, with zero contribution at -20°C and 5°C. Wind contribution falls from ideal at 15 km/h to zero at 50 km/h; visibility rises from zero at 200 m to ideal at 5,000 m; rain falls from ideal at 0 to zero at 2 mm/h. Visibility at or below 200 m or gusts at or above 60 km/h cap the hourly score at 20.

**Outdoor sightseeing:** Apparent temperature 40%, precipitation 40%, wind 20%.

Comfort and rain exposure receive equal priority. Temperature is ideal at 16–26°C, reaching zero contribution at 0°C and 38°C. Rain contribution falls from ideal at 0 to zero at 3 mm/h; wind falls from ideal at 15 km/h to zero at 45 km/h. Cloud cover was excluded to keep the model simple.

**Indoor sightseeing:** Start at 100 and subtract up to 15 points for temperature, 15 for rain, and 10 for wind.

Weather affects travel between venues, but bad outdoor conditions should not artificially improve the score. Temperature has no penalty at 10–30°C and reaches its maximum penalty at -5°C and 40°C. Rain and wind reach their maximum penalties at 3 mm/h and 50 km/h.

Thunderstorm codes 95, 96, and 99 cap hourly outdoor scores at 20 and indoor scores at 60. These are scoring rules, not weather alerts.

### Sanity checks

- Surfing with 1.2 m waves, an 8-second period, 10 km/h wind, and 15 km/h gusts scores `45 + 18 + 15 + 10 = 88`.
- Ideal skiing conditions score 100, but zero snow forces 0 regardless of other factors.
- Outdoor sightseeing at 21°C, no rain, and 10 km/h wind scores 100; changing rain to 3 mm/h reduces it to 60.
- Missing required data produces an unavailable assessment, not `0 / POOR`.

These checks validate arithmetic and intended behavior, not real-world predictive accuracy.

## 4. Geographic applicability

During implementation, I found that inland locations could receive marine data. Rejecting marine grid cells more than 25 km away did not independently establish proximity to an ocean coastline.

I added a Natural Earth 1:50m coastline check, rejecting locations beyond 35 km: the existing 25 km proximity concept plus 10 km tolerance for generalized geometry.

Both checks remain: one checks coastline proximity, the other checks the proximity of the returned marine data. Inland locations receive `NO_NEARBY_COAST` rather than an ambiguous unavailable result.

The dataset can omit small islands or simplify coastlines. Passing these checks does not confirm a suitable surf break.

## 5. Interface and scope

Explicit search-result selection handles ambiguous city names. Activity tabs and a seven-day selector reduce scrolling. The backend chooses the best-ranked day, which can still have poor conditions.

Unavailable activities remain visible with explanations. Scores use numbers and labels alongside color, and charts have a data-table alternative. Keyboard interaction, focus, responsive layouts, and reduced motion are included in browser checks.

Charts and the globe were added after the core flow to explain forecasts and location context. They add bundle and rendering costs. Deployment configuration targets a static frontend and a Node.js function on Vercel, with serverless execution limits and cold starts as trade-offs.

I excluded surf-break orientation, tides, resort operations, grooming, elevation-specific snow conditions, and attraction availability. City-level input cannot reliably establish those details. Better location specificity and domain validation would be the priorities for further work.

## 6. Validation and AI use

Vitest tests scoring boundaries, missing data, validation, and API behavior with controlled fixtures. Playwright checks browser flows, and axe-core checks detectable accessibility issues. These tests do not establish live upstream availability or replace manual assistive-technology testing.

AI helped explore weather factors, challenge scoring assumptions, bootstrap GraphQL, and check scoring arithmetic separately with Python. Python is not part of the application runtime. An agent helped me writing this very document as well.

AI also contributed implementation suggestions, debugging, and specially documentation edits. I reviewed suggestions, selected the rules, and decided what to implement. No model runs during normal application requests.

Commit history, pull requests, and working notes preserve the development sequence behind these decisions. And you can check it on [github](hhttps://github.com/artprange/weather-activity-planner/commits/develop/)

## 7. References

- [Open-Meteo Weather API](https://open-meteo.com/en/docs)
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Met Office: Mountain Weather](https://weather.metoffice.gov.uk/guides/mountain/forecast)
- [National Weather Service: Wave Characteristics](https://www.weather.gov/marine/wavedetail)
- [Coastline dataset documentation](../apps/api/src/locations/data/README.md)

Domain references informed factor selection; numerical weights and thresholds are project-specific choices.

## Unavailable activity weeks

When all seven days lack an available assessment, the activity tab remains visible but cannot be selected. Its explanation lists the reported reasons without treating missing data as evidence of unsuitable geography. Weeks with at least one available assessment remain inspectable. If no activity can be selected, the interface shows a shared empty state.
