# CLAUDE.md

## Rule: output must stay stable

The committed files in `examples/basic/generated` must equal what the tool writes, and the output for a real project's icons must not change when this package changes. Compare before and after any change to `src/component.ts`, `src/jsx.ts`, `src/color.ts` or `src/registry.ts`.

## Rule: no project names

Nothing project-specific (a word to drop from names, a folder name) is written in `src/`. It belongs in the user's `react-svg-icons.config`.

## Rule: the config is data

YAML, JSON or an rc file, never a script. An unknown option is an error.

## Tests

Real SVGs in `examples/basic`, no mocks. The generated code is type-checked with the real TypeScript compiler against `@types/react`, bundled with esbuild and rendered with `react-dom/server`. `npm test` builds and runs `node --test`. Temporary projects are made inside `.test-tmp/` (ignored by git) so that `react` and `@types/react` resolve from this repo.
