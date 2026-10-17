# JS/TS coding standards

Source: user-provided `padroes_codigo_js_ts_codex.pdf`, adopted on 2026-10-17.
This is a repository reference for all future JS/TS changes.

1. Constant literal fields in constant objects use UPPER_SNAKE_CASE. Classes use PascalCase. Enums use PascalCase with the Enum suffix; members use UPPER_SNAKE_CASE.
2. Define route names as constants. Route paths use kebab-case; this project's routes use English.
3. If internationalization is introduced, all user-facing text must use its translation mechanism. English as the default language does not itself require multiple locales.
4. Avoid `any`. Model expected data with explicit types/interfaces. Use `Record` for enum-to-value mappings requiring all keys.
5. PropTypes/defaultProps guidance applies to non-TypeScript projects; this project uses TypeScript and typed props.
6. Use `??` rather than `||` for fallbacks when zero, false or an empty string is valid.
7. Group exports at the end of files. Avoid mixing default and named exports; if needed, put the default export before named exports. Preserve valid syntax and framework requirements.
8. Group related business constants in enums in TypeScript. Do not introduce unnecessary enums solely to satisfy the convention.
9. Use `Record<Enum, Value>` when all enum keys are mandatory. Use enum members as computed keys when their runtime values differ from their names.
10. Prefer small interfaces and type maps over unwieldy inline discriminated types. Preserve the relationship between discriminators and payloads; a generic intersection does not automatically preserve a discriminated union.
11. Use `satisfies` when validating a contract while retaining the expression's specific inference is useful.
12. Mark actionable pending work with `TODO:`. Do not add unnecessary comments or commented-out code.
13. Prioritize consistency with the repository. If a convention conflicts with type correctness, valid syntax, expected behavior or established module conventions, preserve correctness and explain the exception. Avoid mechanical abstractions, enums and comments.

## Project requirements

- Use English for UI text, accessible names, errors, identifiers and documentation.
- Keep scoring rules independent from GraphQL resolvers and upstream HTTP calls.
- Validate external boundaries; do not treat TypeScript types as runtime validation.
- Do not claim a UI library alone guarantees accessibility.
- Additional fs-test conventions such as separate `styles.ts` files are not automatically adopted here; decide their fit with shadcn/ui before implementation.
