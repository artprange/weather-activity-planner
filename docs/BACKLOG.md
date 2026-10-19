# Project backlog

Status: TODO, IN DISCUSSION, READY, IN PROGRESS, DONE.
B01–B09 are DONE. B10 is IN PROGRESS through guided instructions; theme implementation and browser acceptance checks remain pending.
Task order is the suggested execution order; acceptance requires evidence, not only code presence.

## Working process

For each task: explain scope and decisions, implement through the guided workflow agreed with the user, verify its acceptance criteria, update status and working notes, and suggest a focused commit. Do not mark proposed rules as accepted. No application implementation during the planning phase.

## B01 — Define activity scoring [DONE]

Approved by the user. See the accepted scoring specification and worked examples in `DECISIONS.md`.

Dependencies: none.

- Define practitioner profile, score meaning and category boundaries.
- Specify measurements, units, weights, curves/thresholds, penalties and applicability for all four activities.
- Decide whether seven days includes today, local activity hours and hourly-to-daily aggregation.
- Decide how days are ranked per activity, tie handling and missing/partial data.
- Discuss city coordinates, mountain elevation and coastal limitations; never infer availability from weather alone.
- Define explanations and worked examples: favorable, unfavorable, boundary and unavailable cases.

Acceptance: an agreed scoring specification with explicit assumptions and worked calculations; no weights chosen merely to fill a table. Research domain assumptions before finalizing them.

## B02 — Define architecture and GraphQL contract [DONE]

Dependencies: B01.

- Decide one repository with separate web/API applications versus alternatives; document the choice.
- Define search and forecast operations, inputs, enums, nullability, explanations and errors.
- Separate upstream adapters, application orchestration, pure scoring and resolvers.
- Decide dependency set, package manager, runtime and sharing/code generation needs. Verify licenses for selected libraries.

Acceptance: documented boundaries and example successful, ambiguous-place and partial-data responses; frontend never owns scoring rules. Keep infrastructure proportional to the exercise.

## B03 — Define accessible UI flow [DONE]

Dependencies: B01–B02.

- Sketch search, place selection, seven-day results, activity ranking and score details.
- Specify mobile behavior, empty/loading/error states, focus behavior and announcements.
- Define English labels, units, dates, theme controls and component organization.

Acceptance: a reviewable screen/state outline covering keyboard navigation, text alternatives to color and both themes. Decide if i18n is needed; multiple languages are outside the initial scope.

## B04 — Set up project foundations [DONE]

Dependencies: B02–B03.

- Create agreed web/API structure and install selected dependencies.
- Configure strict TypeScript, linting, formatting, environment examples and local development scripts.
- Configure Router, Tailwind and shadcn/ui foundations; keep generated code consistent with standards where practical.

Acceptance: clean installation, both apps start, type/lint/build checks pass, and documented commands work. No database requirement.

## B05 — Integrate Open-Meteo [DONE]

Dependencies: B04; B01 variable requirements.

Geocoding, weather and marine adapters implemented and verified. The user reported successful live Santos queries, 168-hour weather/marine coverage and passing automated checks.

- Implement geocoding, weather and marine adapters as needed.
- Validate upstream payloads with Zod and normalize units, dates and timezones.
- Handle timeouts, invalid responses, missing fields and service failures.
- Verify marine grid selection and geographic applicability rather than accepting any returned sea cell as a valid local surf spot.

Acceptance: recorded representative payloads/fixtures; duplicate place names remain selectable; missing marine data does not discard usable weather results; external requests have bounded duration.

## B06 — Implement scoring engine [DONE]

Dependencies: B01, B05.

- Implement pure per-activity scoring and daily aggregation.
- Model business enums using the required Enum suffix and typed complete mappings.
- Return score/category, status, contributing reasons and deterministic ranking.
- Add meaningful unit tests for thresholds, monotonicity where intended, missing data, penalties, timezone/day boundaries and ties.

Acceptance: worked B01 examples match results; scores are finite and within range; missing data remains distinguishable from poor conditions.

## B07 — Expose GraphQL service [DONE]

Dependencies: B02, B05–B06.

- Implement resolvers and orchestration, validated inputs and consistent errors.
- Preserve useful partial activity results when an independent upstream service fails.
- Keep technical upstream details out of user-facing messages.
- Test representative query success, invalid input and partial/failing upstream responses.

Acceptance: agreed contract can be exercised end to end; only the backend calculates scores.

## B08 — Implement place search [DONE]

Dependencies: B03–B04, B07.

User verified single selection, arrow-key navigation, empty input, no matches, API errors, retry and passing code checks. Manual screen-reader verification remains tracked in B11.

- Build labeled search and accessible place selection with country/region context.
- Integrate TanStack Query with explicit form submission, following B03; prevent stale responses from replacing the selected place.
- Keep candidate selection in page state for B08. Add placeId URL persistence and canonical-place restoration with forecast loading in B09.
- Cover initial, loading, no-results, error and retry behavior.

Acceptance: a user can find and select an unambiguous place using keyboard alone; status changes are announced without excessive repetition.

## B09 — Implement seven-day activity results [DONE]

Dependencies: B08.

The user confirmed URL restoration and the listed B09 browser/code checks, then reported B09 completion after collapsible activity sections and score colors were added. Final integrated accessibility coverage remains part of B11.

- Display scores and ranking for all four activities, dates and local context.
- Persist the selected placeId in validated route search parameters; restore the canonical place through activityForecast on refresh and browser history changes.
- Explain contributing factors, unavailable states and relevant limitations.
- Keep information readable on narrow screens and available without relying on charts, hover or color alone.

Acceptance: users can identify favorable days per activity and understand why; partial results remain useful; backend scores are displayed without client-side recalculation.

## B10 — Implement and verify light/dark themes [IN PROGRESS]

Dependencies: B03–B04; verify completed screens after B09.

- Follow system preference initially; persist an explicit user selection.
- Provide a labeled keyboard-operable theme control and consistent semantic color tokens.
- Verify focus, text, inputs, errors and score indicators in both themes.

Acceptance: preference survives refresh; all states remain legible and usable in both themes. Theme tokens should be introduced with UI foundations, not retrofitted at the end.

## B11 — Verify integrated experience and accessibility [TODO]

Dependencies: B07–B10.

- Verify successful search-to-results flow plus no results, upstream failure and partial data.
- Check keyboard order, focus, accessible names, announcements, headings, zoom/reflow, reduced motion and contrast.
- Run automated accessibility checks and a manual screen-reader pass if tooling is available; document actual coverage and limitations.
- Run appropriate integration/UI tests, type checks, lint and build; fix material defects.

Acceptance: core flows pass; evidence distinguishes automated checks from manual verification; remaining limitations are explicit.

## B12 — Prepare submission [TODO]

Dependencies: B11.

- Write concise README with setup, architecture, scoring assumptions, commands and limitations.
- Preserve actual working notes, decisions and scope cuts without rewriting them as a polished retrospective.
- Add Open-Meteo attribution and verify chosen dependency licenses.
- Check setup from documented instructions; review repository contents before publication.
- Prepare public GitHub submission when requested; repository URL/account and any notification recipient must be established before publishing or messaging.

Acceptance: runnable service and UI, understandable README, traceable decisions and no unrecorded claims of completion.

## Deferred scope

Database, authentication, favorites, resort/beach catalogs, maps, advanced charts, multiple UI languages and production infrastructure are outside the initial delivery. Revisit only for a demonstrated need. Shared packages and caching are optional, not baseline requirements.

## Next step

Implement B10 through the guided workflow: native System/Light/Dark selection, saved preference, early HTML initialization and live system-theme updates. Verify refresh, keyboard interaction, blocked storage, focus, inputs, errors and score readability in both themes before marking complete.

Completion evidence for B04–B07: user-reported live integration checks and completed commits/merges; the latest repository verification passed 99 API tests, formatting, lint, type checking and both builds. B08 browser behavior and code checks were subsequently confirmed by the user. Manual screen-reader verification remains pending in B11.
